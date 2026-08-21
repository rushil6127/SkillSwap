import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '../supabase/client';
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
   * The authoritative PostgreSQL RPC `complete_swap_and_transfer_credits` is the ONLY
   * settlement mechanism. It enforces row locking, authorization, state transitions,
   * balance checks, guarded updates, credit transfers, audit logging, and notifications
   * inside a single database transaction.
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

    if (typeof client.rpc !== 'function') {
      return {
        success: false,
        error: 'Database settlement RPC is not available on the database client.',
      };
    }

    try {
      const { data, error } = await client.rpc('complete_swap_and_transfer_credits', {
        p_swap_id: swapId,
        p_confirming_user_id: confirmingUserId,
        p_reason: reason || undefined,
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Swap completion and settlement failed.',
        };
      }

      if (!data || data.success !== true) {
        return {
          success: false,
          error: (data && data.error) || 'Swap completion and settlement failed.',
        };
      }

      return {
        success: true,
        swap_id: data.swap_id || swapId,
        transaction_id: data.transaction_id,
        amount: data.amount,
        new_requester_balance: data.new_requester_balance,
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal settlement error';
      return {
        success: false,
        error: message,
      };
    }
  }
}
