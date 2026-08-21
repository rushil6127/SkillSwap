import { describe, it, expect, vi } from 'vitest';
import {
  validateCreateOfferInput,
  validateUpdateOfferStatusInput,
  sanitizeOfferFilters,
} from '../lib/validations/offers';
import { OffersService } from '../lib/services/offers-service';

const validRequestId = '11111111-1111-4111-a111-111111111111';
const mockCreatorId = '22222222-2222-4222-a222-222222222222';
const mockProviderId = '33333333-3333-4333-a333-333333333333';
const mockOfferId = '55555555-5555-4555-a555-555555555555';
const otherOfferId = '66666666-6666-4666-a666-666666666666';

describe('Offers Validation Tests', () => {
  it('validates a correct create offer input', () => {
    const result = validateCreateOfferInput({
      request_id: validRequestId,
      message: 'Hey, I have experience with this and can help you today!',
    });
    expect(result.success).toBe(true);
    expect(result.data?.request_id).toBe(validRequestId);
    expect(result.data?.message).toContain('Hey, I have experience');
  });

  it('rejects invalid or missing request ID', () => {
    const invalidResult = validateCreateOfferInput({
      request_id: 'invalid-id',
      message: 'Hello',
    });
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.errors?.request_id).toBeDefined();

    const missingResult = validateCreateOfferInput({
      message: 'Hello',
    });
    expect(missingResult.success).toBe(false);
    expect(missingResult.errors?.request_id).toBeDefined();
  });

  it('rejects an offer message exceeding 1000 characters', () => {
    const longMessage = 'a'.repeat(1001);
    const result = validateCreateOfferInput({
      request_id: validRequestId,
      message: longMessage,
    });
    expect(result.success).toBe(false);
    expect(result.errors?.message).toContain('cannot exceed 1000 characters');
  });

  it('validates offer status update actions (accept/reject)', () => {
    const acceptResult = validateUpdateOfferStatusInput({ status: 'ACCEPTED' });
    expect(acceptResult.success).toBe(true);
    expect(acceptResult.data?.status).toBe('ACCEPTED');

    const rejectResult = validateUpdateOfferStatusInput({ status: 'REJECTED' });
    expect(rejectResult.success).toBe(true);
    expect(rejectResult.data?.status).toBe('REJECTED');

    const pendingResult = validateUpdateOfferStatusInput({ status: 'PENDING' });
    expect(pendingResult.success).toBe(false);
    expect(pendingResult.errors?.status).toContain('back to PENDING');

    const invalidResult = validateUpdateOfferStatusInput({ status: 'UNKNOWN' });
    expect(invalidResult.success).toBe(false);
  });

  it('sanitizes offer filter parameters properly', () => {
    const filters = sanitizeOfferFilters({
      request_id: validRequestId,
      provider_id: mockProviderId,
      status: 'PENDING',
      limit: 150,
      offset: 10,
    });
    expect(filters.request_id).toBe(validRequestId);
    expect(filters.provider_id).toBe(mockProviderId);
    expect(filters.status).toBe('PENDING');
    expect(filters.limit).toBe(100); // capped at max 100
    expect(filters.offset).toBe(10);
  });
});

describe('OffersService Business Logic & Security Tests', () => {
  const createMockSupabase = (options: {
    requestStatus?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    requestCreatorId?: string;
    existingOffer?: boolean;
    offerStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    guardedUpdateSuccess?: boolean;
  }) => {
    const {
      requestStatus = 'OPEN',
      requestCreatorId = mockCreatorId,
      existingOffer = false,
      offerStatus = 'PENDING',
      guardedUpdateSuccess = true,
    } = options;

    return {
      from: (table: string) => {
        return {
          select: (fields?: string, selectOpts?: any) => {
            const query: any = {
              eq: (col: string, val: any) => {
                if (table === 'users') {
                  return {
                    single: async () => ({
                      data: { id: val, name: 'Student', email: 'student@campus.edu' },
                      error: null,
                    }),
                  };
                }
                if (table === 'requests') {
                  if (val === validRequestId) {
                    return {
                      single: async () => ({
                        data: {
                          id: validRequestId,
                          creator_id: requestCreatorId,
                          status: requestStatus,
                          title: 'Test Request',
                        },
                        error: null,
                      }),
                    };
                  }
                  return { single: async () => ({ data: null, error: { message: 'Not found' } }) };
                }
                if (table === 'offers') {
                  if (col === 'request_id') {
                    return {
                      eq: (subCol: string, subVal: any) => {
                        if (subCol === 'provider_id' && existingOffer) {
                          return {
                            single: async () => ({
                              data: { id: mockOfferId, status: 'PENDING' },
                              error: null,
                            }),
                          };
                        }
                        return { single: async () => ({ data: null, error: null }) };
                      },
                      order: () => Promise.resolve({ data: [], error: null }),
                    };
                  }
                  if (col === 'id') {
                    return {
                      single: async () => ({
                        data: {
                          id: val,
                          request_id: validRequestId,
                          provider_id: mockProviderId,
                          status: offerStatus,
                          request: {
                            id: validRequestId,
                            creator_id: requestCreatorId,
                            status: requestStatus,
                          },
                        },
                        error: null,
                      }),
                    };
                  }
                }
                return query;
              },
              order: () => query,
              range: () => query,
              then: (resolve: any) => resolve({ data: [], error: null, count: 0 }),
            };
            return query;
          },
          insert: (payload: any) => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: mockOfferId,
                  ...payload,
                  created_at: new Date().toISOString(),
                  provider: { id: mockProviderId, name: 'Provider' },
                },
                error: null,
              }),
            }),
          }),
          update: (payload: any) => ({
            eq: (col1: string, val1: any) => {
              if (table === 'requests') {
                return {
                  eq: (col2: string, val2: any) => ({
                    select: () => ({
                      single: async () => {
                        if (!guardedUpdateSuccess) {
                          return { data: null, error: { message: 'Row not found' } };
                        }
                        return { data: { id: val1, status: 'IN_PROGRESS' }, error: null };
                      },
                    }),
                  }),
                };
              }
              if (table === 'offers') {
                return {
                  select: () => ({
                    single: async () => ({
                      data: {
                        id: val1,
                        status: payload.status,
                        provider: { id: mockProviderId, name: 'Provider' },
                      },
                      error: null,
                    }),
                  }),
                  eq: () => ({
                    neq: () => Promise.resolve({ data: [], error: null }),
                  }),
                };
              }
              return { select: () => ({ single: async () => ({ data: null, error: null }) }) };
            },
          }),
        };
      },
    } as any;
  };

  it('prevents a user from creating an offer on their own request', async () => {
    const client = createMockSupabase({
      requestCreatorId: mockProviderId, // Provider is the creator
    });

    const result = await OffersService.createOffer(
      mockProviderId,
      { request_id: validRequestId, message: 'Self offer' },
      client
    );

    expect(result.offer).toBeNull();
    expect(result.error).toContain('cannot make an offer on your own request');
  });

  it('prevents creating an offer on a non-OPEN request', async () => {
    const client = createMockSupabase({
      requestStatus: 'IN_PROGRESS',
    });

    const result = await OffersService.createOffer(
      mockProviderId,
      { request_id: validRequestId, message: 'Help' },
      client
    );

    expect(result.offer).toBeNull();
    expect(result.error).toContain('only be made on OPEN requests');
  });

  it('prevents duplicate offers from the same provider on the same request', async () => {
    const client = createMockSupabase({
      existingOffer: true,
    });

    const result = await OffersService.createOffer(
      mockProviderId,
      { request_id: validRequestId, message: 'Duplicate' },
      client
    );

    expect(result.offer).toBeNull();
    expect(result.error).toContain('already submitted an offer');
  });

  it('successfully creates an offer on an open request from another student', async () => {
    const client = createMockSupabase({});

    const result = await OffersService.createOffer(
      mockProviderId,
      { request_id: validRequestId, message: 'I can help!' },
      client
    );

    expect(result.error).toBeNull();
    expect(result.offer?.status).toBe('PENDING');
    expect(result.offer?.request_id).toBe(validRequestId);
  });

  it('prevents non-creators from accepting an offer', async () => {
    const client = createMockSupabase({
      requestCreatorId: mockCreatorId,
    });

    const unauthorizedUserId = '44444444-4444-4444-a444-444444444444';
    const result = await OffersService.acceptOffer(mockOfferId, unauthorizedUserId, client);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Only the request creator can accept');
  });

  it('prevents accepting an offer that is already accepted or rejected', async () => {
    const client = createMockSupabase({
      offerStatus: 'ACCEPTED',
    });

    const result = await OffersService.acceptOffer(mockOfferId, mockCreatorId, client);

    expect(result.success).toBe(false);
    expect(result.error).toContain('already accepted');
  });

  it('protects against race conditions when two offers are accepted concurrently via guarded update', async () => {
    const client = createMockSupabase({
      guardedUpdateSuccess: false, // Simulates another concurrent accept that already flipped status to IN_PROGRESS
    });

    const result = await OffersService.acceptOffer(mockOfferId, mockCreatorId, client);

    expect(result.success).toBe(false);
    expect(result.error).toContain('no longer open for acceptance');
  });

  it('successfully accepts an offer and transitions request and offer statuses', async () => {
    const client = createMockSupabase({
      guardedUpdateSuccess: true,
      offerStatus: 'PENDING',
    });

    const result = await OffersService.acceptOffer(mockOfferId, mockCreatorId, client);

    expect(result.error).toBeNull();
    expect(result.success).toBe(true);
    expect(result.offer?.status).toBe('ACCEPTED');
  });

  it('successfully allows the creator to reject a pending offer', async () => {
    const client = createMockSupabase({
      offerStatus: 'PENDING',
    });

    const result = await OffersService.rejectOffer(mockOfferId, mockCreatorId, client);

    expect(result.error).toBeNull();
    expect(result.success).toBe(true);
    expect(result.offer?.status).toBe('REJECTED');
  });

  it('allows request creator and offer provider to view offer by ID', async () => {
    const client = createMockSupabase({
      requestCreatorId: mockCreatorId,
    });

    // Creator can view
    const creatorView = await OffersService.getOfferById(mockOfferId, mockCreatorId, client);
    expect(creatorView.error).toBeNull();
    expect(creatorView.offer?.id).toBe(mockOfferId);

    // Provider can view
    const providerView = await OffersService.getOfferById(mockOfferId, mockProviderId, client);
    expect(providerView.error).toBeNull();
    expect(providerView.offer?.id).toBe(mockOfferId);
  });

  it('rejects unauthorized third-party from viewing an offer by ID', async () => {
    const client = createMockSupabase({
      requestCreatorId: mockCreatorId,
    });

    const thirdPartyUserId = '99999999-9999-4999-a999-999999999999';
    const result = await OffersService.getOfferById(mockOfferId, thirdPartyUserId, client);

    expect(result.offer).toBeNull();
    expect(result.error).toContain('Unauthorized: You do not have access to this offer.');
  });
});
