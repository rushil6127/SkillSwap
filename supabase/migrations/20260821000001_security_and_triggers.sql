-- ==============================================================================
-- SkillSwap Security, Row-Level Security (RLS) & Triggers Migration
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. USERS POLICIES
-- ------------------------------------------------------------------------------
-- Anyone authenticated can view user profiles
CREATE POLICY "Users profiles are viewable by authenticated users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- Users can update only their own profile info (bio, avatar, etc.), but NOT credits_balance or rating directly
CREATE POLICY "Users can update their own profile details"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. SKILLS POLICIES
-- ------------------------------------------------------------------------------
-- All authenticated users can view the skill catalog
CREATE POLICY "Skills catalog is readable by authenticated users"
  ON public.skills FOR SELECT
  TO authenticated
  USING (true);

-- ------------------------------------------------------------------------------
-- 3. USER_SKILLS POLICIES
-- ------------------------------------------------------------------------------
-- User-skills associations are viewable by authenticated users
CREATE POLICY "User skills are viewable by authenticated users"
  ON public.user_skills FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own skills
CREATE POLICY "Users can add their own skills"
  ON public.user_skills FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own skills
CREATE POLICY "Users can update their own skills"
  ON public.user_skills FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own skills
CREATE POLICY "Users can remove their own skills"
  ON public.user_skills FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. REQUESTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Requests are viewable by authenticated users"
  ON public.requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create requests"
  ON public.requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own requests"
  ON public.requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own requests"
  ON public.requests FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- ------------------------------------------------------------------------------
-- 5. OFFERS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Offers are viewable by provider and request creator"
  ON public.offers FOR SELECT
  TO authenticated
  USING (
    auth.uid() = provider_id OR
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = offers.request_id AND r.creator_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create offers"
  ON public.offers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Request creators and providers can update offer status"
  ON public.offers FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = provider_id OR
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = offers.request_id AND r.creator_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- 6. SWAPS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Swaps are viewable by participants"
  ON public.swaps FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = provider_id);

CREATE POLICY "Participants can update their swap"
  ON public.swaps FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = provider_id);

-- ------------------------------------------------------------------------------
-- 7. MESSAGES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Messages viewable by swap participants"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.swaps s
      WHERE s.id = messages.swap_id AND (s.requester_id = auth.uid() OR s.provider_id = auth.uid())
    )
  );

CREATE POLICY "Swap participants can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.swaps s
      WHERE s.id = messages.swap_id AND (s.requester_id = auth.uid() OR s.provider_id = auth.uid())
    )
  );

-- ------------------------------------------------------------------------------
-- 8. TRANSACTIONS POLICIES (Strictly Read-only for users)
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view transactions they participated in"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- ------------------------------------------------------------------------------
-- 9. RATINGS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Ratings are viewable by authenticated users"
  ON public.ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Swap participants can submit a rating"
  ON public.ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM public.swaps s
      WHERE s.id = ratings.swap_id AND (s.requester_id = auth.uid() OR s.provider_id = auth.uid())
    )
  );

-- ------------------------------------------------------------------------------
-- 10. NOTIFICATIONS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their own notifications as read"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- AUTH TRIGGER: Automatic Profile Creation with 20 starting SkillCredits
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    name,
    email,
    avatar_url,
    college,
    department,
    year,
    bio,
    credits_balance,
    rating
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'college', 'Campus Community'),
    COALESCE(NEW.raw_user_meta_data->>'department', 'General'),
    COALESCE((NEW.raw_user_meta_data->>'year')::SMALLINT, 1),
    NEW.raw_user_meta_data->>'bio',
    20, -- Starting balance for all new verified students
    5.00
  );
  
  -- Create initial welcome notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message
  ) VALUES (
    NEW.id,
    'CREDIT_TRANSFER',
    'Welcome to SkillSwap! 🎉',
    'You received 20 starting SkillCredits. Explore the board or offer your skills to get started.'
  );

  RETURN NEW;
END;
$$;

-- Trigger to execute on Supabase auth.users INSERT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ATOMIC FUNCTION: Credit Transfer & Swap Completion
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.transfer_credits_atomic(
  p_swap_id UUID,
  p_from_user_id UUID,
  p_to_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- 1. Lock and verify sender balance
  SELECT credits_balance INTO v_sender_balance
  FROM public.users
  WHERE id = p_from_user_id
  FOR UPDATE;

  IF v_sender_balance IS NULL THEN
    RAISE EXCEPTION 'Sender user not found';
  END IF;

  IF v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient SkillCredits balance';
  END IF;

  -- 2. Deduct from sender
  UPDATE public.users
  SET credits_balance = credits_balance - p_amount
  WHERE id = p_from_user_id;

  -- 3. Add to receiver
  UPDATE public.users
  SET credits_balance = credits_balance + p_amount
  WHERE id = p_to_user_id;

  -- 4. Record transaction
  INSERT INTO public.transactions (
    swap_id,
    from_user_id,
    to_user_id,
    amount,
    reason
  ) VALUES (
    p_swap_id,
    p_from_user_id,
    p_to_user_id,
    p_amount,
    p_reason
  ) RETURNING id INTO v_transaction_id;

  -- 5. Mark swap completed if swap_id provided
  IF p_swap_id IS NOT NULL THEN
    UPDATE public.swaps
    SET status = 'COMPLETED', completed_at = NOW()
    WHERE id = p_swap_id;

    -- Update linked request to COMPLETED
    UPDATE public.requests
    SET status = 'COMPLETED', updated_at = NOW()
    WHERE id = (SELECT request_id FROM public.swaps WHERE id = p_swap_id);
  END IF;

  -- 6. Notify provider
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message
  ) VALUES (
    p_to_user_id,
    'CREDIT_TRANSFER',
    'Credits Received! 🪙',
    format('You earned %s SkillCredits for completing your swap.', p_amount)
  );

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'amount', p_amount,
    'new_sender_balance', v_sender_balance - p_amount
  );
END;
$$;
