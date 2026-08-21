import { CreateRatingInput, RatingFilters } from '../../types/ratings';
import { ValidationResult } from './auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates payload for submitting a new rating on a completed swap
 */
export function validateCreateRatingInput(input: unknown): ValidationResult<CreateRatingInput> {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== 'object') {
    return { success: false, errors: { form: 'Invalid rating submission payload.' } };
  }

  const payload = input as Record<string, unknown>;

  // 1. Validate swap_id
  const swapId = typeof payload.swap_id === 'string' ? payload.swap_id.trim() : '';
  if (!swapId) {
    errors.swap_id = 'Swap ID is required.';
  } else if (!UUID_REGEX.test(swapId)) {
    errors.swap_id = 'Valid swap UUID is required.';
  }

  // 2. Validate score
  const rawScore = payload.score;
  const score = typeof rawScore === 'number' ? rawScore : Number(rawScore);

  if (rawScore === undefined || rawScore === null || isNaN(score)) {
    errors.score = 'Rating score is required.';
  } else if (!Number.isInteger(score)) {
    errors.score = 'Rating score must be a whole integer.';
  } else if (score < 1 || score > 5) {
    errors.score = 'Rating score must be an integer between 1 and 5.';
  }

  // 3. Validate comment
  let comment: string | null = null;
  if (typeof payload.comment === 'string') {
    const trimmed = payload.comment.trim();
    if (trimmed.length > 1000) {
      errors.comment = 'Rating comment cannot exceed 1000 characters.';
    } else {
      comment = trimmed.length > 0 ? trimmed : null;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      swap_id: swapId,
      score,
      comment,
    },
  };
}

/**
 * Sanitizes ratings query filter parameters
 */
export function sanitizeRatingFilters(raw: unknown): RatingFilters {
  if (!raw || typeof raw !== 'object') {
    return { limit: 50, offset: 0 };
  }

  const p = raw as Record<string, unknown>;
  const filters: RatingFilters = {};

  if (typeof p.user_id === 'string' && UUID_REGEX.test(p.user_id.trim())) {
    filters.user_id = p.user_id.trim();
  }

  if (typeof p.swap_id === 'string' && UUID_REGEX.test(p.swap_id.trim())) {
    filters.swap_id = p.swap_id.trim();
  }

  const rawLimit = Number(p.limit);
  filters.limit = !isNaN(rawLimit) && rawLimit > 0 ? Math.min(100, Math.floor(rawLimit)) : 50;

  const rawOffset = Number(p.offset);
  filters.offset = !isNaN(rawOffset) && rawOffset >= 0 ? Math.floor(rawOffset) : 0;

  return filters;
}
