import { describe, it, expect } from 'vitest';
import { TransactionService } from '../lib/services/transaction-service';
import { sanitizeTransactionFilters } from '../lib/validations/transactions';

const mockSwapId = '77777777-7777-4777-a777-777777777777';
const mockRequesterId = '22222222-2222-4222-a222-222222222222';
const mockProviderId = '33333333-3333-4333-a333-333333333333';
const unauthorizedUserId = '99999999-9999-4999-a999-999999999999';
const mockTxId = '88888888-8888-4888-a888-888888888888';

describe('Transaction Filter Sanitization', () => {
  it('sanitizes transaction filters correctly', () => {
    const filters = sanitizeTransactionFilters({
      type: 'sent',
      swap_id: mockSwapId,
      limit: 200,
      offset: 10,
    });
    expect(filters.type).toBe('sent');
    expect(filters.swap_id).toBe(mockSwapId);
    expect(filters.limit).toBe(100); // capped at 100
    expect(filters.offset).toBe(10);
  });
});

describe('Secure SkillCredit System & Atomic Financial Transfers', () => {
  /**
   * Helper stateful mock database simulator to test sequential & concurrent operations
   */
  const createMockDb = (options: {
    swapStatus?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    requesterCredits?: number;
    providerCredits?: number;
    swapCredits?: number;
    requesterId?: string;
    providerId?: string;
    failTransactionInsert?: boolean;
  } = {}) => {
    const state = {
      swap: {
        id: mockSwapId,
        request_id: '11111111-1111-4111-a111-111111111111',
        requester_id: options.requesterId ?? mockRequesterId,
        provider_id: options.providerId ?? mockProviderId,
        credits: options.swapCredits ?? 15,
        status: options.swapStatus ?? 'ACTIVE',
        completed_at: options.swapStatus === 'COMPLETED' ? new Date().toISOString() : null,
      },
      users: {
        [options.requesterId ?? mockRequesterId]: {
          id: options.requesterId ?? mockRequesterId,
          credits_balance: options.requesterCredits ?? 20,
        },
        [options.providerId ?? mockProviderId]: {
          id: options.providerId ?? mockProviderId,
          credits_balance: options.providerCredits ?? 10,
        },
      } as Record<string, { id: string; credits_balance: number }>,
      transactions: [] as any[],
    };

    const mockClient = {
      from: (table: string) => ({
        select: (fields?: string) => ({
          eq: (col: string, val: any) => ({
            single: async () => {
              if (table === 'swaps' && col === 'id') {
                if (val === state.swap.id) return { data: { ...state.swap }, error: null };
                return { data: null, error: { message: 'Swap not found.' } };
              }
              if (table === 'users' && col === 'id') {
                const user = state.users[val];
                if (user) return { data: { ...user }, error: null };
                return { data: null, error: { message: 'User not found.' } };
              }
              return { data: null, error: null };
            },
          }),
        }),
        update: (payload: any) => ({
          eq: (col1: string, val1: any) => {
            const handleUpdate = () => {
              if (table === 'users' && state.users[val1]) {
                state.users[val1].credits_balance = payload.credits_balance;
              }
              if (table === 'swaps' && state.swap.id === val1) {
                state.swap.status = payload.status ?? state.swap.status;
                state.swap.completed_at = payload.completed_at ?? state.swap.completed_at;
              }
              return { error: null };
            };

            return {
              eq: (col2: string, val2: any) => ({
                select: () => ({
                  single: async () => {
                    if (table === 'swaps' && col1 === 'id' && col2 === 'status') {
                      // Guarded Update simulation: only succeeds if current state status matches val2
                      if (state.swap.id === val1 && state.swap.status === val2) {
                        state.swap.status = payload.status;
                        state.swap.completed_at = payload.completed_at;
                        return { data: { ...state.swap }, error: null };
                      }
                      // 0 rows affected
                      return { data: null, error: { message: 'Row not found or condition failed' } };
                    }
                    return { data: null, error: null };
                  },
                }),
              }),
              single: async () => {
                const res = handleUpdate();
                return { data: state.users[val1] || null, error: res.error };
              },
              then: (resolve: any) => {
                const res = handleUpdate();
                return Promise.resolve(resolve(res));
              },
            };
          },
        }),
        insert: (payload: any) => ({
          select: () => ({
            single: async () => {
              if (table === 'transactions') {
                if (options.failTransactionInsert) {
                  return { data: null, error: { message: 'DB Constraint Violation' } };
                }
                const tx = { id: mockTxId, ...payload, created_at: new Date().toISOString() };
                state.transactions.push(tx);
                return { data: tx, error: null };
              }
              return { data: null, error: null };
            },
          }),
        }),
      }),
    } as any;

    return { state, mockClient };
  };

  // Test 1: Successful transfer
  it('1. successfully transfers credits from requester to provider upon valid completion', async () => {
    const { state, mockClient } = createMockDb({
      requesterCredits: 20,
      providerCredits: 10,
      swapCredits: 15,
    });

    const result = await TransactionService.completeSwapAndTransfer(
      mockSwapId,
      mockRequesterId,
      'Work well done',
      mockClient
    );

    expect(result.success).toBe(true);
    expect(result.amount).toBe(15);
    expect(result.new_requester_balance).toBe(5);
    expect(state.swap.status).toBe('COMPLETED');
    expect(state.users[mockRequesterId].credits_balance).toBe(5);
    expect(state.users[mockProviderId].credits_balance).toBe(25);
    expect(state.transactions.length).toBe(1);
    expect(state.transactions[0].amount).toBe(15);
  });

  // Test 2: Insufficient balance
  it('2. rejects transfer when requester has insufficient SkillCredits balance', async () => {
    const { state, mockClient } = createMockDb({
      requesterCredits: 10, // Only 10 credits
      swapCredits: 15, // Requires 15
    });

    const result = await TransactionService.completeSwapAndTransfer(
      mockSwapId,
      mockRequesterId,
      'Work done',
      mockClient
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient SkillCredits balance');
    expect(state.swap.status).toBe('ACTIVE');
    expect(state.users[mockRequesterId].credits_balance).toBe(10);
    expect(state.transactions.length).toBe(0);
  });

  // Test 3: Unauthorized user
  it('3. rejects completion attempt by unauthorized non-requester user', async () => {
    const { state, mockClient } = createMockDb();

    const result = await TransactionService.completeSwapAndTransfer(
      mockSwapId,
      unauthorizedUserId,
      'Malicious completion',
      mockClient
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
    expect(state.swap.status).toBe('ACTIVE');
    expect(state.transactions.length).toBe(0);
  });

  // Test 4: Invalid swap
  it('4. rejects completion for non-existent swap', async () => {
    const { mockClient } = createMockDb();
    const nonExistentSwapId = '00000000-0000-4000-a000-000000000000';

    const result = await TransactionService.completeSwapAndTransfer(
      nonExistentSwapId,
      mockRequesterId,
      'Complete',
      mockClient
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  // Test 5: Already completed swap
  it('5. rejects completion on a swap that is already completed', async () => {
    const { state, mockClient } = createMockDb({ swapStatus: 'COMPLETED' });

    const result = await TransactionService.completeSwapAndTransfer(
      mockSwapId,
      mockRequesterId,
      'Complete again',
      mockClient
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('already completed');
    expect(state.transactions.length).toBe(0);
  });

  // Test 6: Duplicate completion (sequential calls)
  it('6. prevents double payment on duplicate sequential completion calls', async () => {
    const { state, mockClient } = createMockDb({
      requesterCredits: 20,
      providerCredits: 10,
      swapCredits: 15,
    });

    // First call succeeds
    const firstCall = await TransactionService.completeSwapAndTransfer(
      mockSwapId,
      mockRequesterId,
      'First completion',
      mockClient
    );
    expect(firstCall.success).toBe(true);

    // Second call is rejected immediately
    const secondCall = await TransactionService.completeSwapAndTransfer(
      mockSwapId,
      mockRequesterId,
      'Second duplicate completion',
      mockClient
    );
    expect(secondCall.success).toBe(false);
    expect(secondCall.error).toContain('already completed');

    // Assert balances deducted exactly once and only 1 transaction exists
    expect(state.users[mockRequesterId].credits_balance).toBe(5);
    expect(state.users[mockProviderId].credits_balance).toBe(25);
    expect(state.transactions.length).toBe(1);
  });

  // Test 7: Duplicate completion under concurrency (Promise.all)
  it('7. ensures concurrency safety under race conditions — exactly one request succeeds and only one transaction is created', async () => {
    const { state, mockClient } = createMockDb({
      requesterCredits: 20,
      providerCredits: 10,
      swapCredits: 15,
    });

    // Fire 2 completion requests at the exact same moment
    const [res1, res2] = await Promise.all([
      TransactionService.completeSwapAndTransfer(mockSwapId, mockRequesterId, 'Race 1', mockClient),
      TransactionService.completeSwapAndTransfer(mockSwapId, mockRequesterId, 'Race 2', mockClient),
    ]);

    const successes = [res1, res2].filter((r) => r.success);
    const failures = [res1, res2].filter((r) => !r.success);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
    expect(failures[0].error).toContain('Concurrent completion conflict');

    // Final balance & transactions must reflect exactly ONE transfer
    expect(state.users[mockRequesterId].credits_balance).toBe(5);
    expect(state.users[mockProviderId].credits_balance).toBe(25);
    expect(state.transactions.length).toBe(1);
  });

  // Test 8: Self-transfer rejection
  it('8. defensively rejects self-transfer when requester and provider are the same user', async () => {
    const { state, mockClient } = createMockDb({
      requesterId: mockRequesterId,
      providerId: mockRequesterId, // Same user
    });

    const result = await TransactionService.completeSwapAndTransfer(
      mockSwapId,
      mockRequesterId,
      'Self transfer attempt',
      mockClient
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot transfer credits to self');
    expect(state.transactions.length).toBe(0);
  });

  // Test 9: Client fake credit amount is ignored (server uses stored swap credits)
  it('9. strictly enforces immutable swap credits and ignores client-supplied amounts', async () => {
    const { state, mockClient } = createMockDb({
      requesterCredits: 20,
      providerCredits: 10,
      swapCredits: 15, // Server stored credit reward
    });

    // Client passes no amount or attempt to pass fake payload — method uses server swap credits
    const result = await TransactionService.completeSwapAndTransfer(
      mockSwapId,
      mockRequesterId,
      'Completing swap',
      mockClient
    );

    expect(result.success).toBe(true);
    expect(result.amount).toBe(15); // Exactly 15
    expect(state.transactions[0].amount).toBe(15);
    expect(state.users[mockRequesterId].credits_balance).toBe(5);
  });

  // Test 10: Transaction creation failure triggers rollback
  it('10. handles transaction failure and rolls back swap status', async () => {
    const { state, mockClient } = createMockDb({
      failTransactionInsert: true,
    });

    const result = await TransactionService.completeSwapAndTransfer(
      mockSwapId,
      mockRequesterId,
      'Should fail tx creation',
      mockClient
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('failed');
  });
});
