import { describe, it, expect } from 'vitest';
import { RatingsService } from '../lib/services/ratings-service';
import {
  validateCreateRatingInput,
  sanitizeRatingFilters,
} from '../lib/validations/ratings';

const mockSwapId = '77777777-7777-4777-a777-777777777777';
const mockRequesterId = '22222222-2222-4222-a222-222222222222';
const mockProviderId = '33333333-3333-4333-a333-333333333333';
const unauthorizedUserId = '99999999-9999-4999-a999-999999999999';
const mockRatingId = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

describe('Ratings Validation Unit Tests', () => {
  it('validates a valid rating input payload', () => {
    const result = validateCreateRatingInput({
      swap_id: mockSwapId,
      score: 5,
      comment: 'Excellent mentor, explained concepts clearly!',
    });
    expect(result.success).toBe(true);
    expect(result.data?.score).toBe(5);
    expect(result.data?.comment).toContain('Excellent mentor');
  });

  it('rejects invalid or missing swap UUID', () => {
    const invalidResult = validateCreateRatingInput({
      swap_id: 'invalid-id',
      score: 4,
    });
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.errors?.swap_id).toBeDefined();

    const missingResult = validateCreateRatingInput({
      score: 4,
    });
    expect(missingResult.success).toBe(false);
    expect(missingResult.errors?.swap_id).toBeDefined();
  });

  it('7 & 8. rejects score below 1 or above 5', () => {
    const belowResult = validateCreateRatingInput({
      swap_id: mockSwapId,
      score: 0,
    });
    expect(belowResult.success).toBe(false);
    expect(belowResult.errors?.score).toContain('between 1 and 5');

    const aboveResult = validateCreateRatingInput({
      swap_id: mockSwapId,
      score: 6,
    });
    expect(aboveResult.success).toBe(false);
    expect(aboveResult.errors?.score).toContain('between 1 and 5');
  });

  it('9. rejects non-integer scores (e.g. 4.5)', () => {
    const decimalResult = validateCreateRatingInput({
      swap_id: mockSwapId,
      score: 4.5,
    });
    expect(decimalResult.success).toBe(false);
    expect(decimalResult.errors?.score).toContain('whole integer');
  });

  it('rejects comments exceeding 1000 characters', () => {
    const longComment = 'a'.repeat(1001);
    const result = validateCreateRatingInput({
      swap_id: mockSwapId,
      score: 5,
      comment: longComment,
    });
    expect(result.success).toBe(false);
    expect(result.errors?.comment).toContain('cannot exceed 1000 characters');
  });

  it('sanitizes rating filters correctly', () => {
    const filters = sanitizeRatingFilters({
      user_id: mockProviderId,
      swap_id: mockSwapId,
      limit: 150,
      offset: 5,
    });
    expect(filters.user_id).toBe(mockProviderId);
    expect(filters.swap_id).toBe(mockSwapId);
    expect(filters.limit).toBe(100);
    expect(filters.offset).toBe(5);
  });
});

describe('RatingsService Business Logic & Authorization Tests', () => {
  /**
   * Stateful mock database client to test ratings operations and aggregate reputation recalculations
   */
  const createMockRatingsDb = (options: {
    swapStatus?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    requesterId?: string;
    providerId?: string;
    existingRatings?: Array<{
      id: string;
      swap_id: string;
      reviewer_id: string;
      reviewee_id: string;
      score: number;
    }>;
  } = {}) => {
    const state = {
      swap: {
        id: mockSwapId,
        requester_id: options.requesterId ?? mockRequesterId,
        provider_id: options.providerId ?? mockProviderId,
        credits: 15,
        status: options.swapStatus ?? 'COMPLETED',
      },
      users: {
        [options.requesterId ?? mockRequesterId]: {
          id: options.requesterId ?? mockRequesterId,
          name: 'Priya (Requester)',
          rating: 5.0,
        },
        [options.providerId ?? mockProviderId]: {
          id: options.providerId ?? mockProviderId,
          name: 'Rahul (Provider)',
          rating: 5.0,
        },
      } as Record<string, { id: string; name: string; rating: number }>,
      ratings: options.existingRatings ? [...options.existingRatings] : [],
      notifications: [] as any[],
    };

    const mockClient = {
      from: (table: string) => ({
        select: (fields?: string) => ({
          eq: (col1: string, val1: any) => {
            const query: any = {
              eq: (col2: string, val2: any) => ({
                single: async () => {
                  if (table === 'ratings') {
                    const match = state.ratings.find(
                      (r: any) => r[col1] === val1 && r[col2] === val2
                    );
                    if (match) return { data: { ...match }, error: null };
                    return { data: null, error: null };
                  }
                  return { data: null, error: null };
                },
              }),
              single: async () => {
                if (table === 'swaps' && col1 === 'id') {
                  if (val1 === state.swap.id) return { data: { ...state.swap }, error: null };
                  return { data: null, error: { message: 'Swap not found.' } };
                }
                if (table === 'users' && col1 === 'id') {
                  const u = state.users[val1];
                  if (u) return { data: { ...u }, error: null };
                  return { data: null, error: { message: 'User not found.' } };
                }
                if (table === 'ratings' && col1 === 'id') {
                  const r = state.ratings.find((item: any) => item.id === val1);
                  if (r) return { data: { ...r }, error: null };
                  return { data: null, error: { message: 'Rating not found.' } };
                }
                return { data: null, error: null };
              },
              then: (resolve: any) => {
                if (table === 'ratings' && col1 === 'reviewee_id') {
                  const filtered = state.ratings.filter((r) => r.reviewee_id === val1);
                  return Promise.resolve(resolve({ data: filtered, error: null }));
                }
                if (table === 'ratings' && col1 === 'swap_id') {
                  const filtered = state.ratings.filter((r) => r.swap_id === val1);
                  return Promise.resolve(resolve({ data: filtered, error: null }));
                }
                return Promise.resolve(resolve({ data: [], error: null }));
              },
            };
            return query;
          },
          order: () => ({
            range: () => Promise.resolve({ data: state.ratings, error: null, count: state.ratings.length }),
            then: (resolve: any) => resolve({ data: state.ratings, error: null }),
          }),
        }),
        insert: (payload: any) => ({
          select: () => ({
            single: async () => {
              if (table === 'ratings') {
                const newRating = {
                  id: mockRatingId,
                  ...payload,
                  created_at: new Date().toISOString(),
                  reviewer: state.users[payload.reviewer_id] || { id: payload.reviewer_id, name: 'User' },
                  reviewee: state.users[payload.reviewee_id] || { id: payload.reviewee_id, name: 'User' },
                  swap: { id: payload.swap_id, credits: 15, status: 'COMPLETED' },
                };
                state.ratings.push(newRating);
                return { data: newRating, error: null };
              }
              if (table === 'notifications') {
                state.notifications.push(payload);
                return { data: payload, error: null };
              }
              return { data: null, error: null };
            },
          }),
          then: (resolve: any) => {
            if (table === 'notifications') {
              state.notifications.push(payload);
            }
            return Promise.resolve(resolve({ error: null }));
          },
        }),
        update: (payload: any) => ({
          eq: (col: string, val: any) => {
            if (table === 'users' && col === 'id' && state.users[val]) {
              state.users[val].rating = payload.rating;
            }
            return Promise.resolve({ error: null });
          },
        }),
      }),
    } as any;

    return { state, mockClient };
  };

  // Test 1: Valid rating after completed swap
  it('1. allows a participant to submit a valid rating for a completed swap', async () => {
    const { state, mockClient } = createMockRatingsDb({ swapStatus: 'COMPLETED' });

    const result = await RatingsService.createRating(
      mockRequesterId,
      {
        swap_id: mockSwapId,
        score: 5,
        comment: 'Great teaching session!',
      },
      mockClient
    );

    expect(result.error).toBeNull();
    expect(result.rating?.score).toBe(5);
    expect(result.rating?.reviewer_id).toBe(mockRequesterId);
    expect(result.rating?.reviewee_id).toBe(mockProviderId);
    expect(state.ratings.length).toBe(1);
    expect(state.users[mockProviderId].rating).toBe(5.0);
  });

  // Test 2: Unauthenticated user rejected
  it('2. rejects rating submission without a valid authenticated reviewer ID', async () => {
    const { mockClient } = createMockRatingsDb();

    const result = await RatingsService.createRating(
      '',
      { swap_id: mockSwapId, score: 5 },
      mockClient
    );

    expect(result.rating).toBeNull();
    expect(result.error).toContain('Valid authenticated reviewer ID is required');
  });

  // Test 3: Non-participant rejected
  it('3. rejects rating submission by a non-participant of the swap', async () => {
    const { state, mockClient } = createMockRatingsDb({ swapStatus: 'COMPLETED' });

    const result = await RatingsService.createRating(
      unauthorizedUserId,
      { swap_id: mockSwapId, score: 5 },
      mockClient
    );

    expect(result.rating).toBeNull();
    expect(result.error).toContain('Unauthorized: Only participants of this swap can submit a rating');
    expect(state.ratings.length).toBe(0);
  });

  // Test 4: Self-rating rejected
  it('4. defensively rejects rating yourself', async () => {
    const { mockClient } = createMockRatingsDb({
      requesterId: mockRequesterId,
      providerId: mockRequesterId, // Same participant
      swapStatus: 'COMPLETED',
    });

    const result = await RatingsService.createRating(
      mockRequesterId,
      { swap_id: mockSwapId, score: 5 },
      mockClient
    );

    expect(result.rating).toBeNull();
    expect(result.error).toContain('cannot rate yourself');
  });

  // Test 5: Rating before swap completion rejected
  it('5. rejects rating submission when swap is in ACTIVE state', async () => {
    const { state, mockClient } = createMockRatingsDb({ swapStatus: 'ACTIVE' });

    const result = await RatingsService.createRating(
      mockRequesterId,
      { swap_id: mockSwapId, score: 5 },
      mockClient
    );

    expect(result.rating).toBeNull();
    expect(result.error).toContain('Cannot submit a rating for a swap that is not completed');
    expect(state.ratings.length).toBe(0);
  });

  // Test 6: Cancelled swap rejected
  it('6. rejects rating submission when swap is CANCELLED', async () => {
    const { state, mockClient } = createMockRatingsDb({ swapStatus: 'CANCELLED' });

    const result = await RatingsService.createRating(
      mockRequesterId,
      { swap_id: mockSwapId, score: 5 },
      mockClient
    );

    expect(result.rating).toBeNull();
    expect(result.error).toContain('Cannot submit a rating for a swap that is not completed');
    expect(state.ratings.length).toBe(0);
  });

  // Test 10: Duplicate rating rejected
  it('10. prevents duplicate ratings by the same reviewer for the same swap', async () => {
    const { state, mockClient } = createMockRatingsDb({
      swapStatus: 'COMPLETED',
      existingRatings: [
        {
          id: 'rating-1',
          swap_id: mockSwapId,
          reviewer_id: mockRequesterId,
          reviewee_id: mockProviderId,
          score: 5,
        },
      ],
    });

    const result = await RatingsService.createRating(
      mockRequesterId,
      { swap_id: mockSwapId, score: 4 },
      mockClient
    );

    expect(result.rating).toBeNull();
    expect(result.error).toContain('already submitted a rating');
    expect(state.ratings.length).toBe(1);
  });

  // Test 11: Client cannot spoof reviewer_id
  it('11. strictly enforces reviewer_id from authenticated session regardless of client body payload', async () => {
    const { mockClient } = createMockRatingsDb({ swapStatus: 'COMPLETED' });

    // Client body contains spoofed reviewer_id attempt
    const spoofedInput: any = {
      swap_id: mockSwapId,
      score: 4,
      reviewer_id: unauthorizedUserId, // Spoofed field
    };

    const result = await RatingsService.createRating(
      mockRequesterId,
      spoofedInput,
      mockClient
    );

    expect(result.error).toBeNull();
    expect(result.rating?.reviewer_id).toBe(mockRequesterId); // Reviewer is strictly authenticated user
  });

  // Test 12: Rating for nonexistent swap rejected
  it('12. rejects rating submission for nonexistent swap', async () => {
    const { mockClient } = createMockRatingsDb();
    const nonExistentSwapId = '00000000-0000-4000-a000-000000000000';

    const result = await RatingsService.createRating(
      mockRequesterId,
      { swap_id: nonExistentSwapId, score: 5 },
      mockClient
    );

    expect(result.rating).toBeNull();
    expect(result.error).toContain('Swap not found');
  });

  // Test 13: Aggregate rating updates reviewee's aggregate reputation score
  it('13. updates reviewee aggregate rating safely on server upon receiving a rating', async () => {
    const { state, mockClient } = createMockRatingsDb({ swapStatus: 'COMPLETED' });

    await RatingsService.createRating(
      mockRequesterId,
      { swap_id: mockSwapId, score: 4 },
      mockClient
    );

    expect(state.users[mockProviderId].rating).toBe(4.0);
  });

  // Test 14: Multiple ratings correctly compute the average aggregate rating
  it('14. computes correct aggregate average rating when multiple ratings are submitted', async () => {
    const { state, mockClient } = createMockRatingsDb({
      swapStatus: 'COMPLETED',
      existingRatings: [
        {
          id: 'rating-1',
          swap_id: 'swap-1',
          reviewer_id: 'user-a',
          reviewee_id: mockProviderId,
          score: 5,
        },
        {
          id: 'rating-2',
          swap_id: 'swap-2',
          reviewer_id: 'user-b',
          reviewee_id: mockProviderId,
          score: 4,
        },
      ],
    });

    const newRating = {
      id: 'rating-3',
      swap_id: mockSwapId,
      reviewer_id: mockRequesterId,
      reviewee_id: mockProviderId,
      score: 3,
    };
    state.ratings.push(newRating);

    const recalc = await RatingsService.recalculateUserAggregateRating(
      mockProviderId,
      mockClient
    );

    // (5 + 4 + 3) / 3 = 4.00
    expect(recalc.rating).toBe(4.0);
    expect(state.users[mockProviderId].rating).toBe(4.0);
  });
});
