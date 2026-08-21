import { RequestRow, RequestStatus, SkillRow, UserRow } from './database';

/**
 * Public profile fields attached to a request creator
 */
export type RequestCreatorSummary = Pick<
  UserRow,
  'id' | 'name' | 'email' | 'avatar_url' | 'college' | 'department' | 'year' | 'rating'
>;

/**
 * Complete Request representation with joined creator profile and skill details
 */
export interface RequestDetail extends RequestRow {
  creator: RequestCreatorSummary;
  skill: SkillRow;
}

/**
 * Payload for creating a new help request
 */
export interface CreateRequestInput {
  title: string;
  description: string;
  skill_id: string;
  credits_offered: number; // Whole integer amount
  deadline: string; // ISO 8601 string in the future
}

/**
 * Payload for updating an existing request
 */
export interface UpdateRequestInput {
  title?: string;
  description?: string;
  skill_id?: string;
  credits_offered?: number; // Whole integer amount
  deadline?: string; // ISO 8601 string in the future
  status?: RequestStatus;
}

/**
 * Filtering and pagination options for querying requests
 */
export interface RequestFilters {
  status?: RequestStatus | RequestStatus[];
  skill_id?: string;
  category?: string;
  creator_id?: string;
  search?: string;
  minCredits?: number;
  maxCredits?: number;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'deadline' | 'credits_offered';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Response structure for paginated requests
 */
export interface PaginatedRequestsResponse {
  requests: RequestDetail[];
  total: number;
  limit: number;
  offset: number;
  error: string | null;
}
