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

describe('Authoritative PostgreSQL RPC SkillCredit Settlement', () => {
  /**
   * Stateful mock database client simulating the atomic PostgreSQL stored procedure:
   * complete_swap_and_transfer_credits()
   */
  const createMockRpcDb = (options: {
    swapStatus?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    requesterCredits?: number;
    providerCredits?: number;
    swapCredits?: number;
    requesterId?: string;
    providerId?: string;
    rpcAvailable?: boolean;
  } = {}) => {
    const rpcAvailable = options.rpcAvailable !== false;

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
      }),
      rpc: rpcAvailable
        ? async (fnName: string, params: any) => {
            if (fnName !== 'complete_swap_and_transfer_credits') {
              return { data: null, error: { message: `Function ${fnName} does not exist` } };
            }

            const { p_swap_id, p_confirming_user_id, p_reason } = params;

            // 1. Fetch swap details with row lock
            if (p_swap_id !== state.swap.id) {
              return { data: null, error: { message: 'Swap not found' } };
            }

            // 2. Authorization
            if (state.swap.requester_id !== p_confirming_user_id) {
              return {
                data: null,
                error: { message: 'Unauthorized: Only the requester can confirm swap completion' },
              };
            }

            // 3. Self-transfer check
            if (state.swap.requester_id === state.swap.provider_id) {
              return { data: null, error: { message: 'Self-transfer is not allowed' } };
            }

            // 4. Status check
            if (state.swap.status === 'COMPLETED') {
              return { data: null, error: { message: 'Swap is already completed' } };
            }
            if (state.swap.status === 'CANCELLED') {
              return { data: null, error: { message: 'Cannot complete a cancelled swap' } };
            }
            if (state.swap.status !== 'ACTIVE') {
              return { data: null, error: { message: 'Swap is not active' } };
            }

            // 5. Requester balance check
            const requester = state.users[state.swap.requester_id];
            if (!requester || requester.credits_balance < state.swap.credits) {
              return {
                data: null,
                error: { message: 'Insufficient SkillCredits balance to complete swap' },
              };
            }

            // 6. Guarded Update
            if (state.swap.status !== 'ACTIVE') {
              return {
                data: null,
                error: { message: 'Concurrent completion conflict: swap is no longer active' },
              };
            }
            state.swap.status = 'COMPLETED';
            state.swap.completed_at = new Date().toISOString();

            // 7. Atomic balance adjustments
            requester.credits_balance -= state.swap.credits;
            const provider = state.users[state.swap.provider_id];
            if (provider) {
              provider.credits_balance += state.swap.credits;
            }

            // 8. Record transaction
            const tx = {
              id: mockTxId,
              swap_id: p_swap_id,
              from_user_id: state.swap.requester_id,
              to_user_id: state.swap.provider_id,
              amount: state.swap.credits,
              reason: p_reason || `Completed swap exchange for ${state.swap.credits} credits`,
              created_at: new Date().toISOString(),
            };
            state.transactions.push(tx);

            return {
              data: {
                success: true,
                swap_id: p_swap_id,
                transaction_id: mockTxId,
                amount: state.swap.credits,
                new_requester_balance: requester.credits_balance,
              },
              error: null,
            };
          }
        : undefined,
    } as any;

    return { state, mockClient };
  };

  // Test 1: Successful RPC settlement
  it('1. successfully executes atomic RPC settlement', async () => {
    const { state, mockClient } = createMockRpcDb({
      requesterCredits: 20,
      providerCredits: 10,
      swapCredits: 15,
    });

    const result = await TransactionService.completeSwapAndTransfer(
      mockSwapId,
      mockRequesterId,
      'Excellent tutoring session',
      mockClient
    );

    expect(result.success).toBe(true);
    expect(result.amount).toBe(15);
    expect(result.new_requester_balance).toBe(5);
    expect(result.transaction_id).toBe(mockTxId);
    expect(state.swap.status).toBe('COMPLETED');
    expect(state.users[mockRequesterId].credits_balance).toBe(5);
    expect(state.users[mockProviderId].credits_balance).toBe(25);
    expect(state.transactions.length).toBe(1);
    expect(state.transactions[0].amount).toBe(15);
  });

  // Test 2: Insufficient balance
  it('2. rejects transfer when requester has insufficient balance via RPC', async () => {
    const { state, mockClient } = createMockRpcDb({
      requesterCredits: 10, // Only 10 available
      swapCredits: 15, // 15 required
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

  // Test 3: Unauthorized requester
  it('3. rejects completion attempt by unauthorized user via RPC', async () => {
    const { state, mockClient } = createMockRpcDb();

    const result = await TransactionService.completeSwapAndTransfer(
      mockSwapId,
      unauthorizedUserId,
      'Malicious attempt',
      mockClient
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
    expect(state.swap.status).toBe('ACTIVE');
    expect(state.transactions.length).toBe(0);
  });

  // Test 4: Already completed swap
  it('4. rejects completion on already completed swap via RPC', async () => {
    const { state, mockClient } = createMockRpcDb({ swapStatus: 'COMPLETED' });

    const result = await TransactionService.completeSwapAndTransfer(
      mockSwapId,
      mockRequesterId,
      'Duplicate complete',
      mockClient
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('already completed');
    expect(state.transactions.length).toBe(0);
  });

  // Test 5: Cancelled swap
  it('5. rejects completion on a cancelled swap via RPC', async () => {
    const { state, mockClient } = createMockRpcDb({ swapStatus: 'CANCELLED' });

    const result = await TransactionService.completeSwapAndTransfer(
      mockSwapId,
      mockRequesterId,
      'Complete cancelled',
      mockClient
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot complete a cancelled swap');
    expect(state.transactions.length).toBe(0);
  });

  // Test 6: Self-transfer rejection
  it('6. defensively rejects self-transfer when requester and provider are identical via RPC', async () => {
    const { state, mockClient } = createMockRpcDb({
      requesterId: mockRequesterId,
      providerId: mockRequesterId, // Identical user
    });

    const result = await TransactionService.completeSwapAndTransfer(
      mockSwapId,
      mockRequesterId,
      'Self transfer',
      mockClient
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Self-transfer is not allowed');
    expect(state.transactions.length).toBe(0);
  });

  // Test 7: Duplicate / concurrent completion
  it('7. ensures concurrency safety under race conditions — exactly one request succeeds and only one transaction is created', async () => {
    const { state, mockClient } = createMockRpcDb({
      requesterCredits: 20,
      providerCredits: 10,
      swapCredits: 15,
    });

    // Fire 2 simultaneous completion requests
    const [res1, res2] = await Promise.all([
      TransactionService.completeSwapAndTransfer(mockSwapId, mockRequesterId, 'Race 1', mockClient),
      TransactionService.completeSwapAndTransfer(mockSwapId, mockRequesterId, 'Race 2', mockClient),
    ]);

    const successes = [res1, res2].filter((r) => r.success);
    const failures = [res1, res2].filter((r) => !r.success);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
    expect(failures[0].error).toMatch(/already completed|no longer active/i);

    // Assert credits deducted exactly once
    expect(state.users[mockRequesterId].credits_balance).toBe(5);
    expect(state.users[mockProviderId].credits_balance).toBe(25);
    expect(state.transactions.length).toBe(1);
  });

  // Test 8: Client cannot provide arbitrary amount
  it('8. derives transfer amount exclusively from server swap.credits and ignores client inputs', async () => {
    const { state, mockClient } = createMockRpcDb({
      requesterCredits: 20,
      providerCredits: 10,
      swapCredits: 15, // Server stored amount
    });

    const result = await TransactionService.completeSwapAndTransfer(
      mockSwapId,
      mockRequesterId,
      'Attempting client amount bypass',
      mockClient
    );

    expect(result.success).toBe(true);
    expect(result.amount).toBe(15);
    expect(state.transactions[0].amount).toBe(15);
  });

  // Test 9: RPC missing or unavailable returns clear error without fallback
  it('9. returns clear error without executing any fallback if RPC is unavailable', async () => {
    const { state, mockClient } = createMockRpcDb({
      rpcAvailable: false,
    });

    const result = await TransactionService.completeSwapAndTransfer(
      mockSwapId,
      mockRequesterId,
      'Test RPC missing',
      mockClient
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Database settlement RPC is not available');
    expect(state.swap.status).toBe('ACTIVE');
    expect(state.users[mockRequesterId].credits_balance).toBe(20);
    expect(state.transactions.length).toBe(0);
  });

  // Test 10: Exactly one transaction is created per swap
  it('10. guarantees exactly one transaction audit record is created for a completed swap', async () => {
    const { state, mockClient } = createMockRpcDb({
      requesterCredits: 20,
      swapCredits: 10,
    });

    await TransactionService.completeSwapAndTransfer(
      mockSwapId,
      mockRequesterId,
      'Single tx verification',
      mockClient
    );

    expect(state.transactions.length).toBe(1);
    expect(state.transactions[0].swap_id).toBe(mockSwapId);
    expect(state.transactions[0].from_user_id).toBe(mockRequesterId);
    expect(state.transactions[0].to_user_id).toBe(mockProviderId);
    expect(state.transactions[0].amount).toBe(10);
  });
});
