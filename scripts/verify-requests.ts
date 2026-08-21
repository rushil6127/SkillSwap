import {
  validateCreateRequestInput,
  validateUpdateRequestInput,
  sanitizeRequestFilters,
} from '../src/lib/validations/requests';
import { RequestsService } from '../src/lib/services/requests-service';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('\n--- 1. Validation Tests ---');

  const validSkillId = '11111111-1111-4111-a111-111111111111';
  const futureDeadline = new Date(Date.now() + 86400000).toISOString();
  const pastDeadline = new Date(Date.now() - 86400000).toISOString();

  // Test 1: Valid creation input
  const validResult = validateCreateRequestInput({
    title: 'Need help with React auth debugging',
    description: 'Looking for someone to help debug my JWT authentication token issue.',
    skill_id: validSkillId,
    credits_offered: 15,
    deadline: futureDeadline,
  });
  assert(validResult.success === true, 'Valid create request input passes validation');
  assert(validResult.data?.credits_offered === 15, 'Credits amount preserved as whole integer');

  // Test 2: Past deadline rejection
  const pastResult = validateCreateRequestInput({
    title: 'Past deadline task',
    description: 'Should fail because deadline is in the past.',
    skill_id: validSkillId,
    credits_offered: 10,
    deadline: pastDeadline,
  });
  assert(pastResult.success === false, 'Past deadline is rejected');
  assert(Boolean(pastResult.errors?.deadline), 'Deadline error message provided');

  // Test 3: Decimal credits rejection
  const decimalResult = validateCreateRequestInput({
    title: 'Decimal credits task',
    description: 'Should fail because credits cannot have decimals.',
    skill_id: validSkillId,
    credits_offered: 10.5,
    deadline: futureDeadline,
  });
  assert(decimalResult.success === false, 'Decimal credits rejected');
  assert(decimalResult.errors?.credits_offered?.includes('whole integer') === true, 'Appropriate error for non-integer credits');

  // Test 4: Zero / negative credits rejection
  const negativeResult = validateCreateRequestInput({
    title: 'Zero credits task',
    description: 'Should fail because credits must be > 0.',
    skill_id: validSkillId,
    credits_offered: 0,
    deadline: futureDeadline,
  });
  assert(negativeResult.success === false, 'Zero/negative credits rejected');

  // Test 5: Invalid UUID rejection
  const invalidUuidResult = validateCreateRequestInput({
    title: 'Invalid skill id',
    description: 'Should fail because skill id is not a valid UUID.',
    skill_id: 'not-a-uuid',
    credits_offered: 10,
    deadline: futureDeadline,
  });
  assert(invalidUuidResult.success === false, 'Invalid UUID rejected');

  // Test 6: Short title / description rejection
  const shortResult = validateCreateRequestInput({
    title: 'ab',
    description: 'short',
    skill_id: validSkillId,
    credits_offered: 10,
    deadline: futureDeadline,
  });
  assert(shortResult.success === false, 'Short title & description rejected');
  assert(Boolean(shortResult.errors?.title && shortResult.errors?.description), 'Both title and description errors returned');

  // Test 7: Update validation
  const updateResult = validateUpdateRequestInput({
    title: 'Updated title for request',
    credits_offered: 20,
    status: 'OPEN',
  });
  assert(updateResult.success === true, 'Valid update input passes validation');
  assert(updateResult.data?.credits_offered === 20, 'Updated credits value accepted');

  const invalidUpdateStatus = validateUpdateRequestInput({
    status: 'INVALID_STATUS' as any,
  });
  assert(invalidUpdateStatus.success === false, 'Invalid status in update is rejected');

  // Test 8: Filter sanitization
  const sanitized = sanitizeRequestFilters({
    status: 'OPEN',
    limit: 50,
    offset: 10,
    minCredits: 5,
    maxCredits: 25,
    search: ' react ',
    orderBy: 'credits_offered',
    orderDirection: 'asc',
  });
  assert(sanitized.status === 'OPEN', 'Status filter preserved');
  assert(sanitized.limit === 50, 'Limit sanitized');
  assert(sanitized.offset === 10, 'Offset sanitized');
  assert(sanitized.minCredits === 5, 'Min credits sanitized');
  assert(sanitized.search === 'react', 'Search trimmed');
  assert(sanitized.orderBy === 'credits_offered', 'Order by preserved');
  assert(sanitized.orderDirection === 'asc', 'Order direction preserved');

  console.log('\n--- 2. RequestsService Mock Unit Tests ---');

  const mockCreatorId = '22222222-2222-4222-a222-222222222222';
  const otherUserId = '33333333-3333-4333-a333-333333333333';
  const mockRequestId = '44444444-4444-4444-a444-444444444444';

  // Mock Supabase client to test service logic & authorization
  const createMockClient = (mockState: any) => {
    return {
      from: (table: string) => {
        return {
          select: (fields?: string, options?: any) => {
            const queryObj: any = {
              eq: (col: string, val: any) => {
                if (table === 'users') {
                  if (val === mockCreatorId) return { single: async () => ({ data: { id: mockCreatorId, credits_balance: 20 }, error: null }) };
                  return { single: async () => ({ data: null, error: { message: 'User not found' } }) };
                }
                if (table === 'skills') {
                  if (val === validSkillId) return { single: async () => ({ data: { id: validSkillId, name: 'React', category: 'Technology' }, error: null }) };
                  return { single: async () => ({ data: null, error: { message: 'Skill not found' } }) };
                }
                if (table === 'requests') {
                  if (val === mockRequestId) {
                    return {
                      single: async () => ({
                        data: mockState.request || {
                          id: mockRequestId,
                          creator_id: mockCreatorId,
                          title: 'Initial Request',
                          description: 'Initial description with enough characters',
                          skill_id: validSkillId,
                          credits_offered: 10,
                          deadline: futureDeadline,
                          status: 'OPEN',
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                          creator: { id: mockCreatorId, name: 'Priya', email: 'priya@campus.edu', avatar_url: null, college: 'Engineering', department: 'CS', year: 3, rating: 5 },
                          skill: { id: validSkillId, name: 'React', category: 'Technology' },
                        },
                        error: null,
                      }),
                    };
                  }
                  return { single: async () => ({ data: null, error: { message: 'Request not found' } }) };
                }
                return queryObj;
              },
              in: () => queryObj,
              or: () => queryObj,
              gte: () => queryObj,
              lte: () => queryObj,
              order: () => queryObj,
              range: () => queryObj,
              then: (resolve: any) => resolve({ data: [mockState.request], error: null, count: 1 }),
            };
            return queryObj;
          },
          insert: (payload: any) => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: mockRequestId,
                  ...payload,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  creator: { id: mockCreatorId, name: 'Priya', email: 'priya@campus.edu', avatar_url: null, college: 'Engineering', department: 'CS', year: 3, rating: 5 },
                  skill: { id: validSkillId, name: 'React', category: 'Technology' },
                },
                error: null,
              }),
            }),
          }),
          update: (payload: any) => ({
            eq: () => ({
              select: () => ({
                single: async () => ({
                  data: {
                    id: mockRequestId,
                    creator_id: mockCreatorId,
                    ...payload,
                    creator: { id: mockCreatorId, name: 'Priya', email: 'priya@campus.edu', avatar_url: null, college: 'Engineering', department: 'CS', year: 3, rating: 5 },
                    skill: { id: validSkillId, name: 'React', category: 'Technology' },
                  },
                  error: null,
                }),
              }),
            }),
          }),
          delete: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      },
    } as any;
  };

  // Test 9: Create request via service
  const mockClient = createMockClient({});
  const created = await RequestsService.createRequest(
    mockCreatorId,
    {
      title: 'Need help with React auth debugging',
      description: 'Looking for someone to help debug my JWT authentication token issue.',
      skill_id: validSkillId,
      credits_offered: 10,
      deadline: futureDeadline,
    },
    mockClient
  );
  assert(created.error === null, 'Create request service succeeds with valid data');
  assert(created.request?.title === 'Need help with React auth debugging', 'Created request returns populated title');
  assert(created.request?.status === 'OPEN', 'Created request starts in OPEN status');

  // Test 10: Unauthorized update attempt
  const unauthorizedUpdate = await RequestsService.updateRequest(
    mockRequestId,
    otherUserId, // not owner
    { title: 'Hacked title' },
    mockClient
  );
  assert(unauthorizedUpdate.error?.includes('Unauthorized') === true, 'Unauthorized update is rejected');

  // Test 11: Authorized update
  const authorizedUpdate = await RequestsService.updateRequest(
    mockRequestId,
    mockCreatorId, // owner
    { title: 'Updated React title' },
    mockClient
  );
  assert(authorizedUpdate.error === null, 'Owner can successfully update own request');
  assert(authorizedUpdate.request?.title === 'Updated React title', 'Updated title returned');

  // Test 12: Cancel / Delete authorization & state checks
  const completedStateClient = createMockClient({
    request: {
      id: mockRequestId,
      creator_id: mockCreatorId,
      status: 'COMPLETED',
    },
  });

  const cancelCompleted = await RequestsService.cancelRequest(
    mockRequestId,
    mockCreatorId,
    completedStateClient
  );
  assert(cancelCompleted.success === false, 'Cannot cancel already completed request');
  assert(cancelCompleted.error?.includes('completed') === true, 'Appropriate error when trying to cancel completed request');

  const deleteCompleted = await RequestsService.deleteRequest(
    mockRequestId,
    mockCreatorId,
    completedStateClient
  );
  assert(deleteCompleted.success === false, 'Cannot delete completed request');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
