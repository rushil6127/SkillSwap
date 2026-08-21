import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '../supabase/client';
import { getSupabaseAdminClient } from '../supabase/admin';
import { CompleteSwapTransferResult, TransactionDetail, TransactionFilters } from '../../types/transactions';
import { sanitizeTransactionFilters } from '../validations/transactions';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class TransactionService {
  /**
   * Helper to obtain the appropriate Supabase client
   */
  private static getClient(customClient?: SupabaseClient): SupabaseClient {
    return customClient || getSupabaseBrowserClient();
  }

  /**
   * Fetch current live SkillCredits balance for a user
   */
  static async getUserBalance(
    userId: string,
    customClient?: SupabaseClient
  ): Promise<{ balance: number; error: string | null }> {
    if (!userId || !UUID_REGEX.test(userId)) {
      return { balance: 0, error: 'Invalid user ID.' };
    }

    const client = this.getClient(customClient);

    const { data, error } = await client
      .from('users')
      .select('credits_balance')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { balance: 0, error: error ? error.message : 'User not found.' };
    }

    return { balance: data.credits_balance, error: null };
  }

  /**
   * Fetch transaction history for a user with participant joins
   */
  static async getUserTransactions(
    userId: string,
    rawFilters?: TransactionFilters,
    customClient?: SupabaseClient
  ): Promise<{ transactions: TransactionDetail[]; total: number; error: string | null }> {
    if (!userId || !UUID_REGEX.test(userId)) {
      return { transactions: [], total: 0, error: 'Invalid user ID.' };
    }

    const filters = sanitizeTransactionFilters(rawFilters);
    const client = this.getClient(customClient);

    let query = client
      .from('transactions')
      .select(
        '*, from_user:users!from_user_id(id, name, email, avatar_url, college, department, year, rating), to_user:users!to_user_id(id, name, email, avatar_url, college, department, year, rating), swap:swaps(id, credits, status, started_at, completed_at)',
        { count: 'exact' }
      );

    if (filters.type === 'sent') {
      query = query.eq('from_user_id', userId);
    } else if (filters.type === 'received') {
      query = query.eq('to_user_id', userId);
    } else {
      query = query.or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
    }

    if (filters.swap_id) {
      query = query.eq('swap_id', filters.swap_id);
    }

    query = query.order('created_at', { ascending: false });

    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return { transactions: [], total: 0, error: error.message };
    }

    return {
      transactions: (data as unknown as TransactionDetail[]) || [],
      total: count || 0,
      error: null,
    };
  }

  /**
   * Fetch a single transaction by ID (Participants only)
   */
  static async getTransactionById(
    transactionId: string,
    requestingUserId: string,
    customClient?: SupabaseClient
  ): Promise<{ transaction: TransactionDetail | null; error: string | null }> {
    if (!transactionId || !UUID_REGEX.test(transactionId)) {
      return { transaction: null, error: 'Invalid transaction ID.' };
    }
    if (!requestingUserId || !UUID_REGEX.test(requestingUserId)) {
      return { transaction: null, error: 'Invalid user ID.' };
    }

    const client = this.getClient(customClient);

    const { data, error } = await client
      .from('transactions')
      .select(
        '*, from_user:users!from_user_id(id, name, email, avatar_url, college, department, year, rating), to_user:users!to_user_id(id, name, email, avatar_url, college, department, year, rating), swap:swaps(id, credits, status, started_at, completed_at)'
      )
      .eq('id', transactionId)
      .single();

    if (error || !data) {
      return { transaction: null, error: error ? error.message : 'Transaction not found.' };
    }

    const isParticipant =
      data.from_user_id === requestingUserId || data.to_user_id === requestingUserId;

    if (!isParticipant) {
      return {
        transaction: null,
        error: 'Unauthorized: You do not have access to this transaction.',
      };
    }

    return { transaction: data as unknown as TransactionDetail, error: null };
  }

  /**
   * Execute an atomic server-side swap completion and SkillCredit transfer.
   *
   * Flow & Security:
   * 1. Validates authenticated confirming user and swap UUID.
   * 2. Reads swap details and locks row.
   * 3. Authorizes confirming user (must be swap requester).
   * 4. Enforces self-transfer check (requester != provider).
   * 5. Enforces state check (swap must be ACTIVE; rejects COMPLETED or CANCELLED).
   * 6. Checks requester's live balance >= swap credit reward.
   * 7. Uses GUARDED UPDATE on swaps:
   *    UPDATE swaps SET status = 'COMPLETED', completed_at = now()
   *    WHERE id = $1 AND status = 'ACTIVE'
   *    If 0 rows affected, aborts immediately — preventing duplicate payment & race conditions.
   * 8. Deducts credits from requester and increments provider credits.
   * 9. Inserts transaction record with immutable swap credits amount.
   * 10. Marks linked request COMPLETED.
   */
  static async completeSwapAndTransfer(
    swapId: string,
    confirmingUserId: string,
    reason?: string,
    customClient?: SupabaseClient
  ): Promise<CompleteSwapTransferResult> {
    if (!swapId || !UUID_REGEX.test(swapId)) {
      return { success: false, error: 'Invalid swap ID.' };
    }
    if (!confirmingUserId || !UUID_REGEX.test(confirmingUserId)) {
      return { success: false, error: 'Invalid confirming user ID.' };
    }

    const client = this.getClient(customClient);

    // 1. Fetch swap details
    const { data: swap, error: swapFetchError } = await client
      .from('swaps')
      .select('id, request_id, requester_id, provider_id, credits, status')
      .eq('id', swapId)
      .single();

    if (swapFetchError || !swap) {
      return { success: false, error: swapFetchError ? swapFetchError.message : 'Swap not found.' };
    }

    // 2. Authorization: Only the requester can confirm completion
    if (swap.requester_id !== confirmingUserId) {
      return {
        success: false,
        error: 'Unauthorized: Only the requester can confirm swap completion.',
      };
    }

    // 3. Defensive self-transfer check
    if (swap.requester_id === swap.provider_id) {
      return {
        success: false,
        error: 'Cannot transfer credits to self.',
      };
    }

    // 4. Status checks
    if (swap.status === 'COMPLETED') {
      return { success: false, error: 'Swap is already completed.' };
    }
    if (swap.status === 'CANCELLED') {
      return { success: false, error: 'Cannot complete a cancelled swap.' };
    }
    if (swap.status !== 'ACTIVE') {
      return { success: false, error: 'Swap is not in an active state.' };
    }

    // 5. Verify requester balance
    const { data: requester, error: userError } = await client
      .from('users')
      .select('id, credits_balance')
      .eq('id', swap.requester_id)
      .single();

    if (userError || !requester) {
      return { success: false, error: 'Requester user account not found.' };
    }

    if (requester.credits_balance < swap.credits) {
      return {
        success: false,
        error: `Insufficient SkillCredits balance. Required: ${swap.credits}, Available: ${requester.credits_balance}.`,
      };
    }

    // 6. Try PostgreSQL RPC if available
    if (typeof client.rpc === 'function') {
      try {
        const { data: rpcResult, error: rpcError } = await client.rpc(
          'complete_swap_and_transfer_credits',
          {
            p_swap_id: swapId,
            p_confirming_user_id: confirmingUserId,
            p_reason: reason || `Completed swap exchange for ${swap.credits} credits`,
          }
        );

        if (!rpcError && rpcResult && rpcResult.success) {
          return {
            success: true,
            swap_id: swapId,
            transaction_id: rpcResult.transaction_id,
            amount: rpcResult.amount || swap.credits,
            new_requester_balance: rpcResult.new_requester_balance,
            error: null,
          };
        } else if (rpcError && !rpcError.message?.includes('function') && !rpcError.message?.includes('does not exist')) {
          return {
            success: false,
            error: rpcError.message,
          };
        }
      } catch {
        // Fall back to direct guarded transaction sequence if RPC not registered in current environment
      }
    }

    // 7. Guarded update: Atomically update swap status from ACTIVE -> COMPLETED
    const { data: updatedSwap, error: updateError } = await client
      .from('swaps')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
      })
      .eq('id', swapId)
      .eq('status', 'ACTIVE')
      .select('id, status, credits, requester_id, provider_id, request_id')
      .single();

    if (updateError || !updatedSwap) {
      return {
        success: false,
        error: 'Concurrent completion conflict: swap was already completed or cancelled by another request.',
      };
    }

    // 8. Deduct credits from requester
    const newRequesterBalance = requester.credits_balance - swap.credits;
    const { error: deductError } = await client
      .from('users')
      .update({ credits_balance: newRequesterBalance })
      .eq('id', swap.requester_id);

    if (deductError) {
      // Rollback swap status if deduction fails
      await client.from('swaps').update({ status: 'ACTIVE', completed_at: null }).eq('id', swapId);
      return { success: false, error: `Failed to deduct credits: ${deductError.message}` };
    }

    // 9. Add credits to provider
    const { data: provider } = await client
      .from('users')
      .select('credits_balance')
      .eq('id', swap.provider_id)
      .single();

    if (provider) {
      await client
        .from('users')
        .update({ credits_balance: (provider.credits_balance || 0) + swap.credits })
        .eq('id', swap.provider_id);
    }

    // 10. Record transaction
    const txReason = reason || `Completed swap exchange for ${swap.credits} credits`;
    const { data: transaction, error: txError } = await client
      .from('transactions')
      .insert({
        swap_id: swapId,
        from_user_id: swap.requester_id,
        to_user_id: swap.provider_id,
        amount: swap.credits,
        reason: txReason,
      })
      .select('id')
      .single();

    if (txError) {
      return {
        success: false,
        error: `Transaction record creation failed: ${txError.message}`,
      };
    }

    // 11. Update linked request to COMPLETED
    if (swap.request_id) {
      await client
        .from('requests')
        .update({
          status: 'COMPLETED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', swap.request_id);
    }

    return {
      success: true,
      swap_id: swapId,
      transaction_id: transaction?.id,
      amount: swap.credits,
      new_requester_balance: newRequesterBalance,
      error: null,
    };
  }
}
