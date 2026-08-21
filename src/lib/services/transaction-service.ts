import { getSupabaseAdminClient } from '../supabase/admin';
import { getSupabaseBrowserClient } from '../supabase/client';
import { TransactionRow } from '../../types/database';

export class TransactionService {
  /**
   * Fetch transaction history for a user
   */
  static async getUserTransactions(
    userId: string,
    limit = 50
  ): Promise<{ transactions: TransactionRow[]; error: string | null }> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { transactions: [], error: error.message };
    }

    return { transactions: (data as TransactionRow[]) || [], error: null };
  }

  /**
   * Fetch current live SkillCredits balance for a user
   */
  static async getUserBalance(userId: string): Promise<{ balance: number; error: string | null }> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from('users')
      .select('credits_balance')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { balance: 0, error: error ? error.message : 'User not found' };
    }

    return { balance: data.credits_balance, error: null };
  }

  /**
   * Execute an atomic server-side credit transfer between users upon swap completion
   */
  static async transferCreditsAtomic(
    swapId: string | null,
    fromUserId: string,
    toUserId: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    if (amount <= 0) {
      return { success: false, error: 'Transfer amount must be greater than zero.' };
    }

    if (fromUserId === toUserId) {
      return { success: false, error: 'Cannot transfer credits to self.' };
    }

    try {
      const adminSupabase = getSupabaseAdminClient();

      const { data, error } = await adminSupabase.rpc('transfer_credits_atomic', {
        p_swap_id: swapId,
        p_from_user_id: fromUserId,
        p_to_user_id: toUserId,
        p_amount: amount,
        p_reason: reason,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        transactionId: data?.transaction_id,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to execute credit transfer';
      return { success: false, error: message };
    }
  }
}
