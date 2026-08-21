import { describe, it, expect } from 'vitest';
import { validateCreateSwapInput, sanitizeSwapFilters } from '../lib/validations/swaps';
import { SwapsService } from '../lib/services/swaps-service';
import { OffersService } from '../lib/services/offers-service';

const mockRequestId = '11111111-1111-4111-a111-111111111111';
const mockRequesterId = '22222222-2222-4222-a222-222222222222';
const mockProviderId = '33333333-3333-4333-a333-333333333333';
const mockSwapId = '77777777-7777-4777-a777-777777777777';
const mockOfferId = '55555555-5555-4555-a555-555555555555';
const thirdPartyId = '99999999-9999-4999-a999-999999999999';

describe('Swaps Validation Tests', () => {
  it('validates a valid swap creation payload', () => {
    const result = validateCreateSwapInput({
      request_id: mockRequestId,
      requester_id: mockRequesterId,
      provider_id: mockProviderId,
      credits: 15,
    });
    expect(result.success).toBe(true);
    expect(result.data?.credits).toBe(15);
  });

  it('rejects same student as requester and provider', () => {
    const result = validateCreateSwapInput({
      request_id: mockRequestId,
      requester_id: mockRequesterId,
      provider_id: mockRequesterId,
      credits: 10,
    });
    expect(result.success).toBe(false);
    expect(result.errors?.participants).toContain('different students');
  });

  it('rejects invalid or non-integer credits', () => {
    const decimalResult = validateCreateSwapInput({
      request_id: mockRequestId,
      requester_id: mockRequesterId,
      provider_id: mockProviderId,
      credits: 10.5,
    });
    expect(decimalResult.success).toBe(false);
    expect(decimalResult.errors?.credits).toContain('positive whole integer');

    const zeroResult = validateCreateSwapInput({
      request_id: mockRequestId,
      requester_id: mockRequesterId,
      provider_id: mockProviderId,
      credits: 0,
    });
    expect(zeroResult.success).toBe(false);
  });

  it('sanitizes swap filters properly', () => {
    const filters = sanitizeSwapFilters({
      status: 'ACTIVE',
      role: 'requester',
      limit: 150,
      offset: 5,
    });
    expect(filters.status).toBe('ACTIVE');
    expect(filters.role).toBe('requester');
    expect(filters.limit).toBe(100);
    expect(filters.offset).toBe(5);
  });
});

describe('SwapsService Business Logic & Lifecycle Tests', () => {
  const createMockSwapSupabase = (options: {
    swapStatus?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    requesterId?: string;
    providerId?: string;
  } = {}) => {
    const {
      swapStatus = 'ACTIVE',
      requesterId = mockRequesterId,
      providerId = mockProviderId,
    } = options;

    return {
      from: (table: string) => {
        return {
          select: (fields?: string, selectOpts?: any) => {
            const query: any = {
              eq: (col: string, val: any) => {
                if (table === 'swaps' && col === 'id' && val === mockSwapId) {
                  return {
                    single: async () => ({
                      data: {
                        id: mockSwapId,
                        request_id: mockRequestId,
                        requester_id: requesterId,
                        provider_id: providerId,
                        credits: 15,
                        status: swapStatus,
                        started_at: new Date().toISOString(),
                        completed_at: swapStatus === 'COMPLETED' ? new Date().toISOString() : null,
                        requester: { id: requesterId, name: 'Requester' },
                        provider: { id: providerId, name: 'Provider' },
                        request: { id: mockRequestId, title: 'React Help' },
                      },
                      error: null,
                    }),
                  };
                }
                return query;
              },
              or: () => query,
              in: () => query,
              order: () => query,
              range: () => query,
              then: (resolve: any) =>
                resolve({
                  data: [
                    {
                      id: mockSwapId,
                      request_id: mockRequestId,
                      requester_id: requesterId,
                      provider_id: providerId,
                      credits: 15,
                      status: swapStatus,
                    },
                  ],
                  error: null,
                  count: 1,
                }),
            };
            return query;
          },
          insert: (payload: any) => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: mockSwapId,
                  ...payload,
                  requester: { id: payload.requester_id, name: 'Requester' },
                  provider: { id: payload.provider_id, name: 'Provider' },
                  request: { id: payload.request_id, title: 'React Help' },
                },
                error: null,
              }),
            }),
          }),
          update: (payload: any) => ({
            eq: (col1: string, val1: any) => ({
              eq: (col2: string, val2: any) => ({
                select: () => ({
                  single: async () => ({
                    data: {
                      id: mockSwapId,
                      request_id: mockRequestId,
                      requester_id: requesterId,
                      provider_id: providerId,
                      credits: 15,
                      ...payload,
                    },
                    error: null,
                  }),
                }),
              }),
              select: () => ({
                single: async () => ({
                  data: {
                    id: mockSwapId,
                    request_id: mockRequestId,
                    requester_id: requesterId,
                    provider_id: providerId,
                    credits: 15,
                    ...payload,
                  },
                  error: null,
                }),
              }),
            }),
          }),
        };
      },
    } as any;
  };

  it('allows participants (requester or provider) to access swap details', async () => {
    const client = createMockSwapSupabase();

    const requesterAccess = await SwapsService.getSwapById(mockSwapId, mockRequesterId, client);
    expect(requesterAccess.error).toBeNull();
    expect(requesterAccess.swap?.id).toBe(mockSwapId);

    const providerAccess = await SwapsService.getSwapById(mockSwapId, mockProviderId, client);
    expect(providerAccess.error).toBeNull();
    expect(providerAccess.swap?.id).toBe(mockSwapId);
  });

  it('rejects unauthorized third party from accessing swap details', async () => {
    const client = createMockSwapSupabase();
    const result = await SwapsService.getSwapById(mockSwapId, thirdPartyId, client);

    expect(result.swap).toBeNull();
    expect(result.error).toContain('Unauthorized: You do not have access to this swap.');
  });

  it('completes an active swap when confirmed by requester', async () => {
    const client = createMockSwapSupabase({ swapStatus: 'ACTIVE' });
    const result = await SwapsService.completeSwap(mockSwapId, mockRequesterId, client);

    expect(result.error).toBeNull();
    expect(result.success).toBe(true);
    expect(result.swap?.status).toBe('COMPLETED');
  });

  it('prevents non-requester from completing the swap', async () => {
    const client = createMockSwapSupabase({ swapStatus: 'ACTIVE' });
    const result = await SwapsService.completeSwap(mockSwapId, mockProviderId, client);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Only the requester can confirm swap completion');
  });

  it('prevents completing a swap that is already completed', async () => {
    const client = createMockSwapSupabase({ swapStatus: 'COMPLETED' });
    const result = await SwapsService.completeSwap(mockSwapId, mockRequesterId, client);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Swap is already completed');
  });

  it('prevents completing a cancelled swap', async () => {
    const client = createMockSwapSupabase({ swapStatus: 'CANCELLED' });
    const result = await SwapsService.completeSwap(mockSwapId, mockRequesterId, client);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot complete a cancelled swap');
  });

  it('allows either participant to cancel an active swap', async () => {
    const client = createMockSwapSupabase({ swapStatus: 'ACTIVE' });

    const requesterCancel = await SwapsService.cancelSwap(mockSwapId, mockRequesterId, client);
    expect(requesterCancel.success).toBe(true);
    expect(requesterCancel.swap?.status).toBe('CANCELLED');

    const providerCancel = await SwapsService.cancelSwap(mockSwapId, mockProviderId, client);
    expect(providerCancel.success).toBe(true);
    expect(providerCancel.swap?.status).toBe('CANCELLED');
  });

  it('prevents cancelling an already completed swap', async () => {
    const client = createMockSwapSupabase({ swapStatus: 'COMPLETED' });
    const result = await SwapsService.cancelSwap(mockSwapId, mockRequesterId, client);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot cancel an already completed swap');
  });
});
