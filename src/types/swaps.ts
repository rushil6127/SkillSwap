import { SwapRow, SwapStatus, UserRow } from './database';
import { RequestDetail } from './requests';

/**
 * Summary of a swap participant (requester or provider)
 */
export type SwapParticipantSummary = Pick<
  UserRow,
  'id' | 'name' | 'email' | 'avatar_url' | 'college' | 'department' | 'year' | 'rating'
>;

/**
 * Complete Swap representation with joined participant profiles and request details
 */
export interface SwapDetail extends SwapRow {
  requester: SwapParticipantSummary;
  provider: SwapParticipantSummary;
  request?: RequestDetail;
}

/**
 * Payload for initializing a new swap
 */
export interface CreateSwapInput {
  request_id: string;
  requester_id: string;
  provider_id: string;
  credits: number; // Immutable whole integer credit reward
}

/**
 * Filter options for querying user swaps
 */
export interface SwapFilters {
  status?: SwapStatus | SwapStatus[];
  role?: 'requester' | 'provider' | 'all';
  limit?: number;
  offset?: number;
}
