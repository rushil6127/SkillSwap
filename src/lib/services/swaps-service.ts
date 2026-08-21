import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '../supabase/client';
import { CreateSwapInput, SwapDetail, SwapFilters } from '../../types/swaps';
import { sanitizeSwapFilters, validateCreateSwapInput } from '../validations/swaps';
import { TransactionService } from './transaction-service';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class SwapsService {
  /**
   * Helper to obtain the appropriate Supabase client
   */
  private static getClient(customClient?: SupabaseClient): SupabaseClient {
    return customClient || getSupabaseBrowserClient();
  }

  /**
   * Initialize a new swap between a requester and provider
   */
  static async createSwap(
    input: CreateSwapInput,
    customClient?: SupabaseClient
  ): Promise<{ swap: SwapDetail | null; error: string | null }> {
    const validation = validateCreateSwapInput(input);
    if (!validation.success || !validation.data) {
      const firstError = Object.values(validation.errors || {})[0] || 'Invalid swap input.';
      return { swap: null, error: firstError };
    }

    const client = this.getClient(customClient);

    const insertPayload = {
      request_id: validation.data.request_id,
      requester_id: validation.data.requester_id,
      provider_id: validation.data.provider_id,
      credits: validation.data.credits,
      status: 'ACTIVE' as const,
      started_at: new Date().toISOString(),
      completed_at: null,
    };

    const { data: created, error: insertError } = await client
      .from('swaps')
      .insert(insertPayload)
      .select(
        '*, requester:users!requester_id(id, name, email, avatar_url, college, department, year, rating), provider:users!provider_id(id, name, email, avatar_url, college, department, year, rating), request:requests(*, creator:users(id, name, email, avatar_url, college, department, year, rating), skill:skills(id, name, category))'
      )
      .single();

    if (insertError || !created) {
      return { swap: null, error: insertError ? insertError.message : 'Failed to create swap.' };
    }

    return { swap: created as unknown as SwapDetail, error: null };
  }

  /**
   * Get full details of a specific swap by ID (Participants only)
   */
  static async getSwapById(
    swapId: string,
    requestingUserId: string,
    customClient?: SupabaseClient
  ): Promise<{ swap: SwapDetail | null; error: string | null }> {
    if (!swapId || !UUID_REGEX.test(swapId)) {
      return { swap: null, error: 'Invalid swap ID.' };
    }
    if (!requestingUserId || !UUID_REGEX.test(requestingUserId)) {
      return { swap: null, error: 'Invalid user ID.' };
    }

    const client = this.getClient(customClient);

    const { data, error } = await client
      .from('swaps')
      .select(
        '*, requester:users!requester_id(id, name, email, avatar_url, college, department, year, rating), provider:users!provider_id(id, name, email, avatar_url, college, department, year, rating), request:requests(*, creator:users(id, name, email, avatar_url, college, department, year, rating), skill:skills(id, name, category))'
      )
      .eq('id', swapId)
      .single();

    if (error || !data) {
      return { swap: null, error: error ? error.message : 'Swap not found.' };
    }

    const isRequester = data.requester_id === requestingUserId;
    const isProvider = data.provider_id === requestingUserId;

    if (!isRequester && !isProvider) {
      return { swap: null, error: 'Unauthorized: You do not have access to this swap.' };
    }

    return { swap: data as unknown as SwapDetail, error: null };
  }

  /**
   * Get all swaps for a user (either as requester, provider, or both)
   */
  static async getUserSwaps(
    userId: string,
    rawFilters?: SwapFilters,
    customClient?: SupabaseClient
  ): Promise<{ swaps: SwapDetail[]; total: number; error: string | null }> {
    if (!userId || !UUID_REGEX.test(userId)) {
      return { swaps: [], total: 0, error: 'Invalid user ID.' };
    }

    const filters = sanitizeSwapFilters(rawFilters);
    const client = this.getClient(customClient);

    let query = client
      .from('swaps')
      .select(
        '*, requester:users!requester_id(id, name, email, avatar_url, college, department, year, rating), provider:users!provider_id(id, name, email, avatar_url, college, department, year, rating), request:requests(*, creator:users(id, name, email, avatar_url, college, department, year, rating), skill:skills(id, name, category))',
        { count: 'exact' }
      );

    // Apply role filter
    if (filters.role === 'requester') {
      query = query.eq('requester_id', userId);
    } else if (filters.role === 'provider') {
      query = query.eq('provider_id', userId);
    } else {
      query = query.or(`requester_id.eq.${userId},provider_id.eq.${userId}`);
    }

    // Apply status filter
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    query = query.order('started_at', { ascending: false });

    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return { swaps: [], total: 0, error: error.message };
    }

    return {
      swaps: (data as unknown as SwapDetail[]) || [],
      total: count || 0,
      error: null,
    };
  }

  /**
   * Complete an active swap and execute atomic SkillCredit transfer (Requester only)
   */
  static async completeSwap(
    swapId: string,
    userId: string,
    reasonOrClient?: string | SupabaseClient,
    customClient?: SupabaseClient
  ): Promise<{ success: boolean; swap: SwapDetail | null; transactionId?: string; error: string | null }> {
    if (!swapId || !UUID_REGEX.test(swapId)) {
      return { success: false, swap: null, error: 'Invalid swap ID.' };
    }
    if (!userId || !UUID_REGEX.test(userId)) {
      return { success: false, swap: null, error: 'Invalid user ID.' };
    }

    const reason = typeof reasonOrClient === 'string' ? reasonOrClient : undefined;
    const client =
      typeof reasonOrClient === 'object' && reasonOrClient !== null
        ? (reasonOrClient as SupabaseClient)
        : this.getClient(customClient);

    // Execute atomic completion & financial credit transfer
    const transferResult = await TransactionService.completeSwapAndTransfer(
      swapId,
      userId,
      reason,
      client
    );

    if (!transferResult.success) {
      return {
        success: false,
        swap: null,
        error: transferResult.error || 'Failed to complete swap.',
      };
    }

    // Fetch updated swap details
    const { data: updatedSwap } = await client
      .from('swaps')
      .select(
        '*, requester:users!requester_id(id, name, email, avatar_url, college, department, year, rating), provider:users!provider_id(id, name, email, avatar_url, college, department, year, rating), request:requests(*, creator:users(id, name, email, avatar_url, college, department, year, rating), skill:skills(id, name, category))'
      )
      .eq('id', swapId)
      .single();

    return {
      success: true,
      swap: (updatedSwap as unknown as SwapDetail) || null,
      transactionId: transferResult.transaction_id,
      error: null,
    };
  }

  /**
   * Cancel an active swap (Requester or Provider)
   */
  static async cancelSwap(
    swapId: string,
    userId: string,
    customClient?: SupabaseClient
  ): Promise<{ success: boolean; swap: SwapDetail | null; error: string | null }> {
    if (!swapId || !UUID_REGEX.test(swapId)) {
      return { success: false, swap: null, error: 'Invalid swap ID.' };
    }
    if (!userId || !UUID_REGEX.test(userId)) {
      return { success: false, swap: null, error: 'Invalid user ID.' };
    }

    const client = this.getClient(customClient);

    // 1. Fetch swap
    const { data: swap, error: fetchError } = await client
      .from('swaps')
      .select('*')
      .eq('id', swapId)
      .single();

    if (fetchError || !swap) {
      return { success: false, swap: null, error: 'Swap not found.' };
    }

    // 2. Authorization: Must be a participant
    if (swap.requester_id !== userId && swap.provider_id !== userId) {
      return {
        success: false,
        swap: null,
        error: 'Unauthorized: Only swap participants can cancel the swap.',
      };
    }

    // 3. State checks
    if (swap.status === 'COMPLETED') {
      return { success: false, swap: null, error: 'Cannot cancel an already completed swap.' };
    }
    if (swap.status === 'CANCELLED') {
      return { success: false, swap: null, error: 'Swap is already cancelled.' };
    }

    // 4. Update swap to CANCELLED
    const { data: updatedSwap, error: updateError } = await client
      .from('swaps')
      .update({
        status: 'CANCELLED',
      })
      .eq('id', swapId)
      .eq('status', 'ACTIVE')
      .select(
        '*, requester:users!requester_id(id, name, email, avatar_url, college, department, year, rating), provider:users!provider_id(id, name, email, avatar_url, college, department, year, rating), request:requests(*, creator:users(id, name, email, avatar_url, college, department, year, rating), skill:skills(id, name, category))'
      )
      .single();

    if (updateError || !updatedSwap) {
      return {
        success: false,
        swap: null,
        error: updateError ? updateError.message : 'Failed to cancel swap.',
      };
    }

    // 5. Update linked request to CANCELLED
    await client
      .from('requests')
      .update({
        status: 'CANCELLED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', swap.request_id);

    return {
      success: true,
      swap: updatedSwap as unknown as SwapDetail,
      error: null,
    };
  }
}
