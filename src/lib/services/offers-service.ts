import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '../supabase/client';
import { OfferRow, OfferStatus } from '../../types/database';
import { CreateOfferInput, OfferDetail, OfferFilters } from '../../types/offers';
import { SwapDetail } from '../../types/swaps';
import { sanitizeOfferFilters, validateCreateOfferInput } from '../validations/offers';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class OffersService {
  /**
   * Helper to obtain the appropriate Supabase client
   */
  private static getClient(customClient?: SupabaseClient): SupabaseClient {
    return customClient || getSupabaseBrowserClient();
  }

  /**
   * Submit a new offer on an open request
   */
  static async createOffer(
    providerId: string,
    input: CreateOfferInput,
    customClient?: SupabaseClient
  ): Promise<{ offer: OfferDetail | null; error: string | null }> {
    if (!providerId || !UUID_REGEX.test(providerId)) {
      return { offer: null, error: 'Valid authenticated provider ID is required.' };
    }

    const validation = validateCreateOfferInput(input);
    if (!validation.success || !validation.data) {
      const firstError = Object.values(validation.errors || {})[0] || 'Invalid offer input.';
      return { offer: null, error: firstError };
    }

    const client = this.getClient(customClient);

    // 1. Verify provider user exists
    const { data: providerUser, error: userError } = await client
      .from('users')
      .select('id')
      .eq('id', providerId)
      .single();

    if (userError || !providerUser) {
      return { offer: null, error: 'Provider profile not found.' };
    }

    // 2. Fetch the target request to validate status & ownership
    const { data: request, error: reqError } = await client
      .from('requests')
      .select('id, creator_id, status')
      .eq('id', validation.data.request_id)
      .single();

    if (reqError || !request) {
      return { offer: null, error: 'Request not found.' };
    }

    // Business Rule: Offers can only be made on OPEN requests
    if (request.status !== 'OPEN') {
      return { offer: null, error: 'Offers can only be made on OPEN requests.' };
    }

    // Business Rule: User cannot offer help on their own request
    if (request.creator_id === providerId) {
      return { offer: null, error: 'You cannot make an offer on your own request.' };
    }

    // Business Rule: Check if an offer already exists from this provider
    const { data: existingOffer } = await client
      .from('offers')
      .select('id, status')
      .eq('request_id', validation.data.request_id)
      .eq('provider_id', providerId)
      .single();

    if (existingOffer) {
      return { offer: null, error: 'You have already submitted an offer for this request.' };
    }

    // 3. Insert offer record
    const insertPayload = {
      request_id: validation.data.request_id,
      provider_id: providerId,
      message: validation.data.message,
      status: 'PENDING' as OfferStatus,
    };

    const { data: created, error: insertError } = await client
      .from('offers')
      .insert(insertPayload)
      .select('*, provider:users(id, name, email, avatar_url, college, department, year, rating)')
      .single();

    if (insertError || !created) {
      return { offer: null, error: insertError ? insertError.message : 'Failed to submit offer.' };
    }

    return { offer: created as unknown as OfferDetail, error: null };
  }

  /**
   * Get all offers submitted for a specific request.
   * - Request creator sees all offers.
   * - Other students only see their own offer.
   */
  static async getOffersByRequestId(
    requestId: string,
    requestingUserId: string,
    customClient?: SupabaseClient
  ): Promise<{ offers: OfferDetail[]; error: string | null }> {
    if (!requestId || !UUID_REGEX.test(requestId)) {
      return { offers: [], error: 'Invalid request ID.' };
    }
    if (!requestingUserId || !UUID_REGEX.test(requestingUserId)) {
      return { offers: [], error: 'Invalid user ID.' };
    }

    const client = this.getClient(customClient);

    // Fetch the request to verify creator authorization
    const { data: request, error: reqError } = await client
      .from('requests')
      .select('id, creator_id')
      .eq('id', requestId)
      .single();

    if (reqError || !request) {
      return { offers: [], error: 'Request not found.' };
    }

    let query = client
      .from('offers')
      .select('*, provider:users(id, name, email, avatar_url, college, department, year, rating)')
      .eq('request_id', requestId);

    // If not creator, only return the user's own offer
    if (request.creator_id !== requestingUserId) {
      query = query.eq('provider_id', requestingUserId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return { offers: [], error: error.message };
    }

    return { offers: (data as unknown as OfferDetail[]) || [], error: null };
  }

  /**
   * Get all offers created by a specific provider user
   */
  static async getUserOffers(
    providerId: string,
    rawFilters?: OfferFilters,
    customClient?: SupabaseClient
  ): Promise<{ offers: OfferDetail[]; total: number; error: string | null }> {
    if (!providerId || !UUID_REGEX.test(providerId)) {
      return { offers: [], total: 0, error: 'Invalid provider user ID.' };
    }

    const filters = sanitizeOfferFilters(rawFilters);
    const client = this.getClient(customClient);

    let query = client
      .from('offers')
      .select(
        '*, provider:users(id, name, email, avatar_url, college, department, year, rating), request:requests(*, creator:users(id, name, email, avatar_url, college, department, year, rating), skill:skills(id, name, category))',
        { count: 'exact' }
      )
      .eq('provider_id', providerId);

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters.request_id) {
      query = query.eq('request_id', filters.request_id);
    }

    query = query.order('created_at', { ascending: false });

    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return { offers: [], total: 0, error: error.message };
    }

    return {
      offers: (data as unknown as OfferDetail[]) || [],
      total: count || 0,
      error: null,
    };
  }

  /**
   * Get a single offer by ID with full details (Creator or Provider only)
   */
  static async getOfferById(
    offerId: string,
    requestingUserId: string,
    customClient?: SupabaseClient
  ): Promise<{ offer: OfferDetail | null; error: string | null }> {
    if (!offerId || !UUID_REGEX.test(offerId)) {
      return { offer: null, error: 'Invalid offer ID.' };
    }
    if (!requestingUserId || !UUID_REGEX.test(requestingUserId)) {
      return { offer: null, error: 'Invalid user ID.' };
    }

    const client = this.getClient(customClient);
    const { data, error } = await client
      .from('offers')
      .select(
        '*, provider:users(id, name, email, avatar_url, college, department, year, rating), request:requests(*, creator:users(id, name, email, avatar_url, college, department, year, rating), skill:skills(id, name, category))'
      )
      .eq('id', offerId)
      .single();

    if (error || !data) {
      return { offer: null, error: error ? error.message : 'Offer not found.' };
    }

    const request = (data as any).request;
    const isCreator = request?.creator_id === requestingUserId;
    const isProvider = (data as any).provider_id === requestingUserId;

    if (!isCreator && !isProvider) {
      return { offer: null, error: 'Unauthorized: You do not have access to this offer.' };
    }

    return { offer: data as unknown as OfferDetail, error: null };
  }

  /**
   * Accept an offer on a request.
   *
   * Enforces:
   * 1. Only request creator can accept.
   * 2. Offer must be in PENDING status.
   * 3. Concurrency Guard: Atomically updates request from OPEN -> IN_PROGRESS.
   *    If another offer was accepted concurrently, the guarded update fails.
   * 4. Updates offer to ACCEPTED and rejects other pending offers on the request.
   */
  static async acceptOffer(
    offerId: string,
    creatorUserId: string,
    customClient?: SupabaseClient
  ): Promise<{ success: boolean; offer: OfferDetail | null; swap?: SwapDetail | null; error: string | null }> {
    if (!offerId || !UUID_REGEX.test(offerId)) {
      return { success: false, offer: null, error: 'Invalid offer ID.' };
    }
    if (!creatorUserId || !UUID_REGEX.test(creatorUserId)) {
      return { success: false, offer: null, error: 'Invalid creator user ID.' };
    }

    const client = this.getClient(customClient);

    // 1. Fetch offer and request
    const { data: offer, error: fetchError } = await client
      .from('offers')
      .select('*, request:requests(*)')
      .eq('id', offerId)
      .single();

    if (fetchError || !offer) {
      return { success: false, offer: null, error: 'Offer not found.' };
    }

    const request = offer.request as any;
    if (!request) {
      return { success: false, offer: null, error: 'Associated request not found.' };
    }

    // 2. Authorization: Only the request creator can accept
    if (request.creator_id !== creatorUserId) {
      return {
        success: false,
        offer: null,
        error: 'Unauthorized: Only the request creator can accept this offer.',
      };
    }

    // 3. Status validation: Offer must be PENDING
    if (offer.status !== 'PENDING') {
      return {
        success: false,
        offer: null,
        error: `Cannot accept an offer that is already ${offer.status.toLowerCase()}.`,
      };
    }

    // 4. Concurrency Guard: Atomic guarded update on requests (WHERE id = $1 AND status = 'OPEN')
    const { data: updatedRequest, error: reqUpdateError } = await client
      .from('requests')
      .update({
        status: 'IN_PROGRESS',
        updated_at: new Date().toISOString(),
      })
      .eq('id', offer.request_id)
      .eq('status', 'OPEN')
      .select('id, status')
      .single();

    if (reqUpdateError || !updatedRequest) {
      return {
        success: false,
        offer: null,
        error: 'Request is no longer open for acceptance. Another offer may have been accepted or the request was cancelled.',
      };
    }

    // 5. Update accepted offer to ACCEPTED
    const { data: updatedOffer, error: offerUpdateError } = await client
      .from('offers')
      .update({
        status: 'ACCEPTED',
      })
      .eq('id', offerId)
      .select('*, provider:users(id, name, email, avatar_url, college, department, year, rating)')
      .single();

    if (offerUpdateError || !updatedOffer) {
      return {
        success: false,
        offer: null,
        error: offerUpdateError ? offerUpdateError.message : 'Failed to update offer status.',
      };
    }

    // 6. Create the Swap row with ACTIVE status and immutable credit reward copied from the request
    const { data: createdSwap, error: swapError } = await client
      .from('swaps')
      .insert({
        request_id: offer.request_id,
        requester_id: creatorUserId,
        provider_id: offer.provider_id,
        credits: request.credits_offered,
        status: 'ACTIVE',
        started_at: new Date().toISOString(),
        completed_at: null,
      })
      .select(
        '*, requester:users!requester_id(id, name, email, avatar_url, college, department, year, rating), provider:users!provider_id(id, name, email, avatar_url, college, department, year, rating), request:requests(*, creator:users(id, name, email, avatar_url, college, department, year, rating), skill:skills(id, name, category))'
      )
      .single();

    if (swapError) {
      return {
        success: false,
        offer: null,
        error: swapError.message || 'Failed to create active swap.',
      };
    }

    // 7. Automatically reject all other pending offers for this request
    await client
      .from('offers')
      .update({ status: 'REJECTED' })
      .eq('request_id', offer.request_id)
      .eq('status', 'PENDING')
      .neq('id', offerId);

    return {
      success: true,
      offer: updatedOffer as unknown as OfferDetail,
      swap: createdSwap as unknown as SwapDetail,
      error: null,
    };
  }

  /**
   * Reject an offer on a request.
   *
   * Enforces:
   * 1. Only request creator can reject.
   * 2. Offer must be in PENDING status.
   */
  static async rejectOffer(
    offerId: string,
    creatorUserId: string,
    customClient?: SupabaseClient
  ): Promise<{ success: boolean; offer: OfferDetail | null; error: string | null }> {
    if (!offerId || !UUID_REGEX.test(offerId)) {
      return { success: false, offer: null, error: 'Invalid offer ID.' };
    }
    if (!creatorUserId || !UUID_REGEX.test(creatorUserId)) {
      return { success: false, offer: null, error: 'Invalid creator user ID.' };
    }

    const client = this.getClient(customClient);

    // 1. Fetch offer and request
    const { data: offer, error: fetchError } = await client
      .from('offers')
      .select('*, request:requests(id, creator_id, status)')
      .eq('id', offerId)
      .single();

    if (fetchError || !offer) {
      return { success: false, offer: null, error: 'Offer not found.' };
    }

    const request = offer.request as any;
    if (!request) {
      return { success: false, offer: null, error: 'Associated request not found.' };
    }

    // 2. Authorization check
    if (request.creator_id !== creatorUserId) {
      return {
        success: false,
        offer: null,
        error: 'Unauthorized: Only the request creator can reject this offer.',
      };
    }

    // 3. Status check
    if (offer.status !== 'PENDING') {
      return {
        success: false,
        offer: null,
        error: `Cannot reject an offer that is already ${offer.status.toLowerCase()}.`,
      };
    }

    // 4. Update status to REJECTED
    const { data: updatedOffer, error: updateError } = await client
      .from('offers')
      .update({
        status: 'REJECTED',
      })
      .eq('id', offerId)
      .select('*, provider:users(id, name, email, avatar_url, college, department, year, rating)')
      .single();

    if (updateError || !updatedOffer) {
      return {
        success: false,
        offer: null,
        error: updateError ? updateError.message : 'Failed to reject offer.',
      };
    }

    return {
      success: true,
      offer: updatedOffer as unknown as OfferDetail,
      error: null,
    };
  }
}
