import { describe, it, expect } from 'vitest';
import {
  validateCreateRequestInput,
  validateUpdateRequestInput,
  sanitizeRequestFilters,
} from '../lib/validations/requests';
import { RequestsService } from '../lib/services/requests-service';

const validSkillId = '11111111-1111-4111-a111-111111111111';
const mockCreatorId = '22222222-2222-4222-a222-222222222222';
const otherUserId = '33333333-3333-4333-a333-333333333333';
const mockRequestId = '44444444-4444-4444-a444-444444444444';
const futureDeadline = new Date(Date.now() + 86400000).toISOString();
const pastDeadline = new Date(Date.now() - 86400000).toISOString();

describe('Requests Validation Tests', () => {
  it('validates a correct create request input', () => {
    const result = validateCreateRequestInput({
      title: 'Need help with React auth debugging',
      description: 'Looking for someone to help debug my JWT authentication token issue.',
      skill_id: validSkillId,
      credits_offered: 15,
      deadline: futureDeadline,
    });
    expect(result.success).toBe(true);
    expect(result.data?.credits_offered).toBe(15);
  });

  it('rejects a past deadline', () => {
    const result = validateCreateRequestInput({
      title: 'Past deadline task',
      description: 'Should fail because deadline is in the past.',
      skill_id: validSkillId,
      credits_offered: 10,
      deadline: pastDeadline,
    });
    expect(result.success).toBe(false);
    expect(result.errors?.deadline).toBeDefined();
  });

  it('rejects decimal / non-integer SkillCredits', () => {
    const result = validateCreateRequestInput({
      title: 'Decimal credits task',
      description: 'Should fail because credits cannot have decimals.',
      skill_id: validSkillId,
      credits_offered: 10.5,
      deadline: futureDeadline,
    });
    expect(result.success).toBe(false);
    expect(result.errors?.credits_offered).toContain('whole integer');
  });

  it('rejects zero or negative SkillCredits', () => {
    const result = validateCreateRequestInput({
      title: 'Zero credits task',
      description: 'Should fail because credits must be > 0.',
      skill_id: validSkillId,
      credits_offered: 0,
      deadline: futureDeadline,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid skill UUID', () => {
    const result = validateCreateRequestInput({
      title: 'Invalid skill id',
      description: 'Should fail because skill id is not a valid UUID.',
      skill_id: 'not-a-uuid',
      credits_offered: 10,
      deadline: futureDeadline,
    });
    expect(result.success).toBe(false);
  });

  it('validates request update payloads', () => {
    const result = validateUpdateRequestInput({
      title: 'Updated title for request',
      credits_offered: 20,
      status: 'OPEN',
    });
    expect(result.success).toBe(true);
    expect(result.data?.credits_offered).toBe(20);
  });

  it('sanitizes request filters', () => {
    const filters = sanitizeRequestFilters({
      status: 'OPEN',
      limit: 50,
      offset: 10,
      minCredits: 5,
      maxCredits: 25,
      search: ' react ',
      orderBy: 'credits_offered',
      orderDirection: 'asc',
    });
    expect(filters.status).toBe('OPEN');
    expect(filters.limit).toBe(50);
    expect(filters.offset).toBe(10);
    expect(filters.minCredits).toBe(5);
    expect(filters.search).toBe('react');
    expect(filters.orderBy).toBe('credits_offered');
    expect(filters.orderDirection).toBe('asc');
  });
});

describe('RequestsService Logic & Authorization Tests', () => {
  const createMockClient = (mockState: any = {}) => {
    return {
      from: (table: string) => {
        return {
          select: (fields?: string, options?: any) => {
            const queryObj: any = {
              eq: (col: string, val: any) => {
                if (table === 'users') {
                  if (val === mockCreatorId)
                    return {
                      single: async () => ({
                        data: { id: mockCreatorId, credits_balance: 20 },
                        error: null,
                      }),
                    };
                  return { single: async () => ({ data: null, error: { message: 'User not found' } }) };
                }
                if (table === 'skills') {
                  if (val === validSkillId)
                    return {
                      single: async () => ({
                        data: { id: validSkillId, name: 'React', category: 'Technology' },
                        error: null,
                      }),
                    };
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
                          creator: {
                            id: mockCreatorId,
                            name: 'Priya',
                            email: 'priya@campus.edu',
                            avatar_url: null,
                            college: 'Engineering',
                            department: 'CS',
                            year: 3,
                            rating: 5,
                          },
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
                  creator: {
                    id: mockCreatorId,
                    name: 'Priya',
                    email: 'priya@campus.edu',
                    avatar_url: null,
                    college: 'Engineering',
                    department: 'CS',
                    year: 3,
                    rating: 5,
                  },
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
                    creator: {
                      id: mockCreatorId,
                      name: 'Priya',
                      email: 'priya@campus.edu',
                      avatar_url: null,
                      college: 'Engineering',
                      department: 'CS',
                      year: 3,
                      rating: 5,
                    },
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

  it('creates request successfully', async () => {
    const mockClient = createMockClient();
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
    expect(created.error).toBeNull();
    expect(created.request?.title).toBe('Need help with React auth debugging');
    expect(created.request?.status).toBe('OPEN');
  });

  it('rejects unauthorized update by non-creator', async () => {
    const mockClient = createMockClient();
    const result = await RequestsService.updateRequest(
      mockRequestId,
      otherUserId,
      { title: 'Hacked title' },
      mockClient
    );
    expect(result.error).toContain('Unauthorized');
  });

  it('allows owner to update own request', async () => {
    const mockClient = createMockClient();
    const result = await RequestsService.updateRequest(
      mockRequestId,
      mockCreatorId,
      { title: 'Updated React title' },
      mockClient
    );
    expect(result.error).toBeNull();
    expect(result.request?.title).toBe('Updated React title');
  });

  it('prevents cancelling or deleting completed request', async () => {
    const completedStateClient = createMockClient({
      request: {
        id: mockRequestId,
        creator_id: mockCreatorId,
        status: 'COMPLETED',
      },
    });

    const cancelResult = await RequestsService.cancelRequest(
      mockRequestId,
      mockCreatorId,
      completedStateClient
    );
    expect(cancelResult.success).toBe(false);
    expect(cancelResult.error).toContain('completed');

    const deleteResult = await RequestsService.deleteRequest(
      mockRequestId,
      mockCreatorId,
      completedStateClient
    );
    expect(deleteResult.success).toBe(false);
  });
});
