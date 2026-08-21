import { RatingRow, UserRow } from './database';
import { SwapDetail } from './swaps';

/**
 * Summary profile of a reviewer or reviewee
 */
export type RatingUserSummary = Pick<
  UserRow,
  'id' | 'name' | 'email' | 'avatar_url' | 'college' | 'department' | 'year' | 'rating'
>;

/**
 * Detailed rating record including joined reviewer, reviewee, and swap context
 */
export interface RatingDetail extends RatingRow {
  reviewer: RatingUserSummary;
  reviewee: RatingUserSummary;
  swap?: SwapDetail | null;
}

/**
 * Input payload for submitting a rating on a completed swap
 */
export interface CreateRatingInput {
  swap_id: string;
  score: number; // 1 to 5 integer
  comment?: string | null;
}

/**
 * Filters for querying ratings
 */
export interface RatingFilters {
  user_id?: string;
  swap_id?: string;
  limit?: number;
  offset?: number;
}
