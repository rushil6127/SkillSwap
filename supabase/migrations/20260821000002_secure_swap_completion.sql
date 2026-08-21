-- ==============================================================================
-- SkillSwap Migration: 20260821000002_secure_swap_completion.sql
-- Description: Financial-grade atomic swap completion and SkillCredit transfer
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.complete_swap_and_transfer_credits(
  p_swap_id UUID,
  p_confirming_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_swap RECORD;
  v_rows_affected INTEGER;
  v_sender_balance INTEGER;
  v_transaction_id UUID;
  v_reason TEXT;
BEGIN
  -- 1. Fetch swap details with row lock
  SELECT id, request_id, requester_id, provider_id, credits, status
  INTO v_swap
  FROM public.swaps
  WHERE id = p_swap_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Swap not found';
  END IF;

  -- 2. Authorization: Only the requester can confirm swap completion
  IF v_swap.requester_id != p_confirming_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Only the requester can confirm swap completion';
  END IF;

  -- 3. Self-transfer check (defensive)
  IF v_swap.requester_id = v_swap.provider_id THEN
    RAISE EXCEPTION 'Self-transfer is not allowed';
  END IF;

  -- 4. Status checks
  IF v_swap.status = 'COMPLETED' THEN
    RAISE EXCEPTION 'Swap is already completed';
  END IF;

  IF v_swap.status = 'CANCELLED' THEN
    RAISE EXCEPTION 'Cannot complete a cancelled swap';
  END IF;

  IF v_swap.status != 'ACTIVE' THEN
    RAISE EXCEPTION 'Swap is not active';
  END IF;

  -- 5. Lock and check requester's balance
  SELECT credits_balance INTO v_sender_balance
  FROM public.users
  WHERE id = v_swap.requester_id
  FOR UPDATE;

  IF v_sender_balance IS NULL THEN
    RAISE EXCEPTION 'Requester account not found';
  END IF;

  IF v_sender_balance < v_swap.credits THEN
    RAISE EXCEPTION 'Insufficient SkillCredits balance to complete swap';
  END IF;

  -- 6. GUARDED UPDATE: Atomically transition status from ACTIVE -> COMPLETED
  UPDATE public.swaps
  SET status = 'COMPLETED', completed_at = NOW()
  WHERE id = p_swap_id AND status = 'ACTIVE';

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  IF v_rows_affected = 0 THEN
    RAISE EXCEPTION 'Concurrent completion conflict: swap is no longer active';
  END IF;

  -- 7. Deduct from requester
  UPDATE public.users
  SET credits_balance = credits_balance - v_swap.credits
  WHERE id = v_swap.requester_id;

  -- 8. Add to provider
  UPDATE public.users
  SET credits_balance = credits_balance + v_swap.credits
  WHERE id = v_swap.provider_id;

  -- 9. Insert transaction record using immutable swap credits
  v_reason := COALESCE(p_reason, format('Completed swap exchange for %s credits', v_swap.credits));
  INSERT INTO public.transactions (
    swap_id,
    from_user_id,
    to_user_id,
    amount,
    reason,
    created_at
  ) VALUES (
    p_swap_id,
    v_swap.requester_id,
    v_swap.provider_id,
    v_swap.credits,
    v_reason,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- 10. Update linked request to COMPLETED
  UPDATE public.requests
  SET status = 'COMPLETED', updated_at = NOW()
  WHERE id = v_swap.request_id;

  -- 11. Send notifications
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message
  ) VALUES
  (
    v_swap.provider_id,
    'CREDIT_TRANSFER',
    'SkillCredits Received! 🪙',
    format('You earned %s SkillCredits for completing your swap.', v_swap.credits)
  ),
  (
    v_swap.requester_id,
    'CREDIT_TRANSFER',
    'Swap Completed ✨',
    format('You transferred %s SkillCredits for your completed swap.', v_swap.credits)
  );

  RETURN jsonb_build_object(
    'success', true,
    'swap_id', p_swap_id,
    'transaction_id', v_transaction_id,
    'amount', v_swap.credits,
    'new_requester_balance', v_sender_balance - v_swap.credits
  );
END;
$$;

-- Hardened execution permissions: Only authenticated users and service role may invoke settlement
REVOKE EXECUTE ON FUNCTION public.complete_swap_and_transfer_credits(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_swap_and_transfer_credits(UUID, UUID, TEXT) TO authenticated, service_role;
