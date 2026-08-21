-- ==============================================================================
-- SkillSwap Migration: 20260821000003_ratings_and_reputation.sql
-- Description: Marketplace Ratings, Reviewer Integrity, and Aggregate Reputation
-- ==============================================================================

-- 1. Ensure check constraint preventing self-rating at DB level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_different_rating_participants'
  ) THEN
    ALTER TABLE public.ratings
    ADD CONSTRAINT check_different_rating_participants
    CHECK (reviewer_id != reviewee_id);
  END IF;
END $$;

-- 2. Indexes for fast retrieval of ratings and reputation aggregation
CREATE INDEX IF NOT EXISTS idx_ratings_reviewee_id ON public.ratings(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_swap_id ON public.ratings(swap_id);
CREATE INDEX IF NOT EXISTS idx_ratings_reviewer_id ON public.ratings(reviewer_id);

-- 3. Trigger Function: Automatically recompute user aggregate rating upon new rating
CREATE OR REPLACE FUNCTION public.update_user_aggregate_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user_id UUID;
  v_avg_rating NUMERIC(3, 2);
BEGIN
  v_target_user_id := COALESCE(NEW.reviewee_id, OLD.reviewee_id);

  -- Compute average score for reviewee
  SELECT COALESCE(ROUND(AVG(score)::numeric, 2), 5.00)
  INTO v_avg_rating
  FROM public.ratings
  WHERE reviewee_id = v_target_user_id;

  -- Ensure rating stays within 1.00 to 5.00 bounds
  IF v_avg_rating < 1.00 THEN
    v_avg_rating := 1.00;
  ELSIF v_avg_rating > 5.00 THEN
    v_avg_rating := 5.00;
  END IF;

  -- Update user profile aggregate rating safely
  UPDATE public.users
  SET rating = v_avg_rating
  WHERE id = v_target_user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_user_aggregate_rating ON public.ratings;
CREATE TRIGGER trigger_update_user_aggregate_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_aggregate_rating();

-- 4. Hardened RLS Policy for Ratings Insert
DROP POLICY IF EXISTS "Swap participants can submit a rating" ON public.ratings;
CREATE POLICY "Swap participants can submit a rating"
  ON public.ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id AND
    reviewer_id != reviewee_id AND
    EXISTS (
      SELECT 1 FROM public.swaps s
      WHERE s.id = ratings.swap_id
        AND s.status = 'COMPLETED'
        AND (
          (s.requester_id = auth.uid() AND s.provider_id = ratings.reviewee_id) OR
          (s.provider_id = auth.uid() AND s.requester_id = ratings.reviewee_id)
        )
    )
  );

-- Ratings are viewable by all authenticated users
DROP POLICY IF EXISTS "Ratings are viewable by authenticated users" ON public.ratings;
CREATE POLICY "Ratings are viewable by authenticated users"
  ON public.ratings FOR SELECT
  TO authenticated
  USING (true);
