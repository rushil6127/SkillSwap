import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '../supabase/client';
import { CreateRatingInput, RatingDetail, RatingFilters } from '../../types/ratings';
import { sanitizeRatingFilters, validateCreateRatingInput } from '../validations/ratings';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class RatingsService {
  /**
   * Helper to obtain the appropriate Supabase client
   */
  private static getClient(customClient?: SupabaseClient): SupabaseClient {
    return customClient || getSupabaseBrowserClient();
  }

  /**
   * Submit a rating for a completed swap.
   *
   * Enforces:
   * 1. Authenticated reviewer identity (never client-supplied).
   * 2. Swap must exist and be in COMPLETED state.
   * 3. Reviewer must be a participant in the swap.
   * 4. Reviewee is strictly derived as the other participant.
   * 5. Reviewer cannot rate themselves.
   * 6. Unique rating constraint (reviewer may only rate a swap once).
   * 7. Automatically updates reviewee's aggregate reputation rating.
   */
  static async createRating(
    reviewerId: string,
    input: CreateRatingInput,
    customClient?: SupabaseClient
  ): Promise<{ rating: RatingDetail | null; error: string | null }> {
    if (!reviewerId || !UUID_REGEX.test(reviewerId)) {
      return { rating: null, error: 'Valid authenticated reviewer ID is required.' };
    }

    const validation = validateCreateRatingInput(input);
    if (!validation.success || !validation.data) {
      const firstError = Object.values(validation.errors || {})[0] || 'Invalid rating input.';
      return { rating: null, error: firstError };
    }

    const client = this.getClient(customClient);

    // 1. Fetch swap details
    const { data: swap, error: swapError } = await client
      .from('swaps')
      .select('id, requester_id, provider_id, status')
      .eq('id', validation.data.swap_id)
      .single();

    if (swapError || !swap) {
      return { rating: null, error: 'Swap not found.' };
    }

    // 2. Validate swap status is COMPLETED
    if (swap.status !== 'COMPLETED') {
      return {
        rating: null,
        error: `Cannot submit a rating for a swap that is not completed. Current status: ${swap.status}.`,
      };
    }

    // 3. Authorization: Reviewer must be a participant
    const isRequester = swap.requester_id === reviewerId;
    const isProvider = swap.provider_id === reviewerId;

    if (!isRequester && !isProvider) {
      return {
        rating: null,
        error: 'Unauthorized: Only participants of this swap can submit a rating.',
      };
    }

    // 4. Derive reviewee identity (the other participant)
    const revieweeId = isRequester ? swap.provider_id : swap.requester_id;

    // 5. Defensive self-rating check
    if (reviewerId === revieweeId) {
      return { rating: null, error: 'You cannot rate yourself.' };
    }

    // 6. Check if reviewer already rated this swap
    const { data: existingRating } = await client
      .from('ratings')
      .select('id')
      .eq('swap_id', validation.data.swap_id)
      .eq('reviewer_id', reviewerId)
      .single();

    if (existingRating) {
      return { rating: null, error: 'You have already submitted a rating for this swap.' };
    }

    // 7. Insert rating record
    const { data: createdRating, error: insertError } = await client
      .from('ratings')
      .insert({
        swap_id: validation.data.swap_id,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        score: validation.data.score,
        comment: validation.data.comment,
      })
      .select(
        '*, reviewer:users!reviewer_id(id, name, email, avatar_url, college, department, year, rating), reviewee:users!reviewee_id(id, name, email, avatar_url, college, department, year, rating), swap:swaps(id, credits, status, started_at, completed_at)'
      )
      .single();

    if (insertError || !createdRating) {
      return {
        rating: null,
        error: insertError ? insertError.message : 'Failed to submit rating.',
      };
    }

    // 8. Recompute reviewee's aggregate reputation rating
    await this.recalculateUserAggregateRating(revieweeId, client);

    // 9. Send notification to reviewee
    await client.from('notifications').insert({
      user_id: revieweeId,
      type: 'RATING_RECEIVED',
      title: 'New Rating Received! ⭐',
      message: `You received a ${validation.data.score}-star rating for your completed swap!`,
    });

    return {
      rating: createdRating as unknown as RatingDetail,
      error: null,
    };
  }

  /**
   * Recalculates and updates the aggregate rating for a user safely on the server
   */
  static async recalculateUserAggregateRating(
    userId: string,
    customClient?: SupabaseClient
  ): Promise<{ rating: number; error: string | null }> {
    if (!userId || !UUID_REGEX.test(userId)) {
      return { rating: 5.0, error: 'Invalid user ID.' };
    }

    const client = this.getClient(customClient);

    const { data: ratings, error } = await client
      .from('ratings')
      .select('score')
      .eq('reviewee_id', userId);

    if (error) {
      return { rating: 5.0, error: error.message };
    }

    let avgRating = 5.0;
    if (ratings && ratings.length > 0) {
      const totalScore = ratings.reduce((sum: number, r: { score: number }) => sum + r.score, 0);
      avgRating = Math.round((totalScore / ratings.length) * 100) / 100;
      // Clamp between 1.00 and 5.00
      avgRating = Math.max(1.0, Math.min(5.0, avgRating));
    }

    const { error: updateError } = await client
      .from('users')
      .update({ rating: avgRating })
      .eq('id', userId);

    if (updateError) {
      return { rating: avgRating, error: updateError.message };
    }

    return { rating: avgRating, error: null };
  }

  /**
   * Get ratings received by a specific user with pagination
   */
  static async getUserRatings(
    userId: string,
    rawFilters?: RatingFilters,
    customClient?: SupabaseClient
  ): Promise<{ ratings: RatingDetail[]; total: number; error: string | null }> {
    if (!userId || !UUID_REGEX.test(userId)) {
      return { ratings: [], total: 0, error: 'Invalid user ID.' };
    }

    const filters = sanitizeRatingFilters(rawFilters);
    const client = this.getClient(customClient);

    let query = client
      .from('ratings')
      .select(
        '*, reviewer:users!reviewer_id(id, name, email, avatar_url, college, department, year, rating), reviewee:users!reviewee_id(id, name, email, avatar_url, college, department, year, rating), swap:swaps(id, credits, status, started_at, completed_at)',
        { count: 'exact' }
      )
      .eq('reviewee_id', userId);

    if (filters.swap_id) {
      query = query.eq('swap_id', filters.swap_id);
    }

    query = query.order('created_at', { ascending: false });

    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return { ratings: [], total: 0, error: error.message };
    }

    return {
      ratings: (data as unknown as RatingDetail[]) || [],
      total: count || 0,
      error: null,
    };
  }

  /**
   * Get ratings associated with a specific swap
   */
  static async getSwapRatings(
    swapId: string,
    customClient?: SupabaseClient
  ): Promise<{ ratings: RatingDetail[]; error: string | null }> {
    if (!swapId || !UUID_REGEX.test(swapId)) {
      return { ratings: [], error: 'Invalid swap ID.' };
    }

    const client = this.getClient(customClient);

    const { data, error } = await client
      .from('ratings')
      .select(
        '*, reviewer:users!reviewer_id(id, name, email, avatar_url, college, department, year, rating), reviewee:users!reviewee_id(id, name, email, avatar_url, college, department, year, rating), swap:swaps(id, credits, status, started_at, completed_at)'
      )
      .eq('swap_id', swapId)
      .order('created_at', { ascending: false });

    if (error) {
      return { ratings: [], error: error.message };
    }

    return {
      ratings: (data as unknown as RatingDetail[]) || [],
      error: null,
    };
  }

  /**
   * Get a single rating by ID
   */
  static async getRatingById(
    ratingId: string,
    customClient?: SupabaseClient
  ): Promise<{ rating: RatingDetail | null; error: string | null }> {
    if (!ratingId || !UUID_REGEX.test(ratingId)) {
      return { rating: null, error: 'Invalid rating ID.' };
    }

    const client = this.getClient(customClient);

    const { data, error } = await client
      .from('ratings')
      .select(
        '*, reviewer:users!reviewer_id(id, name, email, avatar_url, college, department, year, rating), reviewee:users!reviewee_id(id, name, email, avatar_url, college, department, year, rating), swap:swaps(id, credits, status, started_at, completed_at)'
      )
      .eq('id', ratingId)
      .single();

    if (error || !data) {
      return { rating: null, error: error ? error.message : 'Rating not found.' };
    }

    return { rating: data as unknown as RatingDetail, error: null };
  }
}
