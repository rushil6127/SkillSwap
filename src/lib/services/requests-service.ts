import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '../supabase/client';
import { RequestRow, RequestStatus, SkillRow } from '../../types/database';
import {
  CreateRequestInput,
  PaginatedRequestsResponse,
  RequestDetail,
  RequestFilters,
  UpdateRequestInput,
} from '../../types/requests';
import {
  sanitizeRequestFilters,
  validateCreateRequestInput,
  validateUpdateRequestInput,
} from '../validations/requests';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class RequestsService {
  /**
   * Helper to obtain the appropriate Supabase client
   */
  private static getClient(customClient?: SupabaseClient): SupabaseClient {
    return customClient || getSupabaseBrowserClient();
  }

  /**
   * Create a new campus help request
   */
  static async createRequest(
    creatorId: string,
    input: CreateRequestInput,
    customClient?: SupabaseClient
  ): Promise<{ request: RequestDetail | null; error: string | null }> {
    if (!creatorId || !UUID_REGEX.test(creatorId)) {
      return { request: null, error: 'Valid authenticated creator ID is required.' };
    }

    const validation = validateCreateRequestInput(input);
    if (!validation.success || !validation.data) {
      const firstError = Object.values(validation.errors || {})[0] || 'Invalid request input.';
      return { request: null, error: firstError };
    }

    const client = this.getClient(customClient);

    // 1. Verify creator exists
    const { data: creatorUser, error: userError } = await client
      .from('users')
      .select('id, credits_balance')
      .eq('id', creatorId)
      .single();

    if (userError || !creatorUser) {
      return { request: null, error: 'Creator profile not found.' };
    }

    // 2. Verify skill exists in catalog
    const { data: skillRecord, error: skillError } = await client
      .from('skills')
      .select('id')
      .eq('id', validation.data.skill_id)
      .single();

    if (skillError || !skillRecord) {
      return { request: null, error: 'Selected skill was not found in the skills catalog.' };
    }

    // 3. Insert new request record
    const insertPayload = {
      creator_id: creatorId,
      title: validation.data.title,
      description: validation.data.description,
      skill_id: validation.data.skill_id,
      credits_offered: validation.data.credits_offered,
      deadline: validation.data.deadline,
      status: 'OPEN' as RequestStatus,
    };

    const { data: created, error: insertError } = await client
      .from('requests')
      .insert(insertPayload)
      .select('*, creator:users(id, name, email, avatar_url, college, department, year, rating), skill:skills(id, name, category)')
      .single();

    if (insertError || !created) {
      return { request: null, error: insertError ? insertError.message : 'Failed to create request.' };
    }

    return { request: created as unknown as RequestDetail, error: null };
  }

  /**
   * List and filter requests with pagination and full details
   */
  static async getRequests(
    rawFilters?: RequestFilters,
    customClient?: SupabaseClient
  ): Promise<PaginatedRequestsResponse> {
    const filters = sanitizeRequestFilters(rawFilters);
    const client = this.getClient(customClient);

    let query = client
      .from('requests')
      .select(
        '*, creator:users!inner(id, name, email, avatar_url, college, department, year, rating), skill:skills!inner(id, name, category)',
        { count: 'exact' }
      );

    // Apply status filter
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    // Apply skill filter
    if (filters.skill_id) {
      query = query.eq('skill_id', filters.skill_id);
    }

    // Apply category filter (via skill join)
    if (filters.category) {
      query = query.eq('skill.category', filters.category);
    }

    // Apply creator filter
    if (filters.creator_id) {
      query = query.eq('creator_id', filters.creator_id);
    }

    // Apply text search on title or description
    if (filters.search) {
      const term = `%${filters.search.trim()}%`;
      query = query.or(`title.ilike.${term},description.ilike.${term}`);
    }

    // Apply credit bounds
    if (filters.minCredits !== undefined) {
      query = query.gte('credits_offered', filters.minCredits);
    }
    if (filters.maxCredits !== undefined) {
      query = query.lte('credits_offered', filters.maxCredits);
    }

    // Apply sorting
    const orderByField = filters.orderBy || 'created_at';
    const ascending = filters.orderDirection === 'asc';
    query = query.order(orderByField, { ascending });

    // Apply pagination range
    const offset = filters.offset || 0;
    const limit = filters.limit || 20;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return {
        requests: [],
        total: 0,
        limit,
        offset,
        error: error.message,
      };
    }

    return {
      requests: (data as unknown as RequestDetail[]) || [],
      total: count || 0,
      limit,
      offset,
      error: null,
    };
  }

  /**
   * Get full details of a specific request by ID
   */
  static async getRequestById(
    requestId: string,
    customClient?: SupabaseClient
  ): Promise<{ request: RequestDetail | null; error: string | null }> {
    if (!requestId || !UUID_REGEX.test(requestId)) {
      return { request: null, error: 'Invalid request ID.' };
    }

    const client = this.getClient(customClient);
    const { data, error } = await client
      .from('requests')
      .select(
        '*, creator:users(id, name, email, avatar_url, college, department, year, rating), skill:skills(id, name, category)'
      )
      .eq('id', requestId)
      .single();

    if (error || !data) {
      return { request: null, error: error ? error.message : 'Request not found.' };
    }

    return { request: data as unknown as RequestDetail, error: null };
  }

  /**
   * Update an existing request (enforces ownership and status rules)
   */
  static async updateRequest(
    requestId: string,
    userId: string,
    input: UpdateRequestInput,
    customClient?: SupabaseClient
  ): Promise<{ request: RequestDetail | null; error: string | null }> {
    if (!requestId || !UUID_REGEX.test(requestId)) {
      return { request: null, error: 'Invalid request ID.' };
    }
    if (!userId || !UUID_REGEX.test(userId)) {
      return { request: null, error: 'Invalid user ID.' };
    }

    const validation = validateUpdateRequestInput(input);
    if (!validation.success || !validation.data) {
      const firstError = Object.values(validation.errors || {})[0] || 'Invalid update payload.';
      return { request: null, error: firstError };
    }

    const client = this.getClient(customClient);

    // 1. Fetch current request state
    const { data: existing, error: fetchError } = await client
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !existing) {
      return { request: null, error: 'Request not found.' };
    }

    // 2. Authorization check: must be owner
    if (existing.creator_id !== userId) {
      return { request: null, error: 'Unauthorized: You can only modify your own requests.' };
    }

    // 3. Status checks
    if (existing.status === 'COMPLETED') {
      return { request: null, error: 'Completed requests cannot be modified.' };
    }
    if (existing.status === 'CANCELLED') {
      return { request: null, error: 'Cancelled requests cannot be modified.' };
    }
    if (existing.status === 'IN_PROGRESS') {
      if (validation.data.skill_id && validation.data.skill_id !== existing.skill_id) {
        return { request: null, error: 'Cannot change skill requirement while a swap is in progress.' };
      }
      if (validation.data.credits_offered && validation.data.credits_offered !== existing.credits_offered) {
        return { request: null, error: 'Cannot change credit reward while a swap is in progress.' };
      }
    }

    // 4. If skill_id updated, verify it exists
    if (validation.data.skill_id && validation.data.skill_id !== existing.skill_id) {
      const { data: skillRecord, error: skillError } = await client
        .from('skills')
        .select('id')
        .eq('id', validation.data.skill_id)
        .single();

      if (skillError || !skillRecord) {
        return { request: null, error: 'Selected skill was not found in catalog.' };
      }
    }

    // 5. Apply update
    const updatePayload: Partial<RequestRow> = {
      ...validation.data,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error: updateError } = await client
      .from('requests')
      .update(updatePayload)
      .eq('id', requestId)
      .select(
        '*, creator:users(id, name, email, avatar_url, college, department, year, rating), skill:skills(id, name, category)'
      )
      .single();

    if (updateError || !updated) {
      return { request: null, error: updateError ? updateError.message : 'Failed to update request.' };
    }

    return { request: updated as unknown as RequestDetail, error: null };
  }

  /**
   * Cancel an open request
   */
  static async cancelRequest(
    requestId: string,
    userId: string,
    customClient?: SupabaseClient
  ): Promise<{ success: boolean; request: RequestRow | null; error: string | null }> {
    if (!requestId || !UUID_REGEX.test(requestId)) {
      return { success: false, request: null, error: 'Invalid request ID.' };
    }

    const client = this.getClient(customClient);

    // Fetch existing request
    const { data: existing, error: fetchError } = await client
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !existing) {
      return { success: false, request: null, error: 'Request not found.' };
    }

    if (existing.creator_id !== userId) {
      return { success: false, request: null, error: 'Unauthorized: You can only cancel your own requests.' };
    }

    if (existing.status === 'CANCELLED') {
      return { success: true, request: existing as RequestRow, error: null };
    }

    if (existing.status === 'COMPLETED') {
      return { success: false, request: null, error: 'Cannot cancel a completed request.' };
    }

    if (existing.status === 'IN_PROGRESS') {
      return {
        success: false,
        request: null,
        error: 'Cannot directly cancel a request with an active swap. The swap must be cancelled first.',
      };
    }

    const { data: updated, error: updateError } = await client
      .from('requests')
      .update({
        status: 'CANCELLED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError || !updated) {
      return { success: false, request: null, error: updateError ? updateError.message : 'Failed to cancel request.' };
    }

    return { success: true, request: updated as RequestRow, error: null };
  }

  /**
   * Delete an open or cancelled request
   */
  static async deleteRequest(
    requestId: string,
    userId: string,
    customClient?: SupabaseClient
  ): Promise<{ success: boolean; error: string | null }> {
    if (!requestId || !UUID_REGEX.test(requestId)) {
      return { success: false, error: 'Invalid request ID.' };
    }

    const client = this.getClient(customClient);

    const { data: existing, error: fetchError } = await client
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: 'Request not found.' };
    }

    if (existing.creator_id !== userId) {
      return { success: false, error: 'Unauthorized: You can only delete your own requests.' };
    }

    if (existing.status === 'IN_PROGRESS') {
      return { success: false, error: 'Cannot delete a request while a swap is in progress.' };
    }

    if (existing.status === 'COMPLETED') {
      return { success: false, error: 'Cannot delete a completed request to preserve transaction records.' };
    }

    const { error: deleteError } = await client.from('requests').delete().eq('id', requestId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true, error: null };
  }

  /**
   * Internal status updater for Marketplace Swap operations
   */
  static async updateRequestStatus(
    requestId: string,
    newStatus: RequestStatus,
    customClient?: SupabaseClient
  ): Promise<{ success: boolean; request: RequestRow | null; error: string | null }> {
    const client = this.getClient(customClient);

    const { data, error } = await client
      .from('requests')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      return { success: false, request: null, error: error.message };
    }

    return { success: true, request: data as RequestRow, error: null };
  }
}
