import { CreateSwapInput, SwapFilters } from '../../types/swaps';
import { SwapStatus } from '../../types/database';
import { ValidationResult } from './auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_SWAP_STATUSES: SwapStatus[] = ['ACTIVE', 'COMPLETED', 'CANCELLED'];

/**
 * Validates payload for initializing a swap
 */
export function validateCreateSwapInput(input: unknown): ValidationResult<CreateSwapInput> {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== 'object') {
    return { success: false, errors: { form: 'Invalid swap creation payload.' } };
  }

  const payload = input as Record<string, unknown>;

  const requestId = typeof payload.request_id === 'string' ? payload.request_id.trim() : '';
  if (!requestId || !UUID_REGEX.test(requestId)) {
    errors.request_id = 'Valid request ID is required.';
  }

  const requesterId = typeof payload.requester_id === 'string' ? payload.requester_id.trim() : '';
  if (!requesterId || !UUID_REGEX.test(requesterId)) {
    errors.requester_id = 'Valid requester user ID is required.';
  }

  const providerId = typeof payload.provider_id === 'string' ? payload.provider_id.trim() : '';
  if (!providerId || !UUID_REGEX.test(providerId)) {
    errors.provider_id = 'Valid provider user ID is required.';
  }

  if (requesterId && providerId && requesterId === providerId) {
    errors.participants = 'Requester and provider must be different students.';
  }

  const rawCredits = payload.credits;
  const credits = typeof rawCredits === 'number' ? rawCredits : Number(rawCredits);
  if (rawCredits === undefined || rawCredits === null || isNaN(credits)) {
    errors.credits = 'Credit reward is required.';
  } else if (!Number.isInteger(credits) || credits <= 0) {
    errors.credits = 'Credit reward must be a positive whole integer amount.';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      request_id: requestId,
      requester_id: requesterId,
      provider_id: providerId,
      credits,
    },
  };
}

/**
 * Sanitizes swap query filters
 */
export function sanitizeSwapFilters(raw: unknown): SwapFilters {
  if (!raw || typeof raw !== 'object') {
    return { role: 'all', limit: 50, offset: 0 };
  }

  const p = raw as Record<string, unknown>;
  const filters: SwapFilters = {};

  if (p.status) {
    if (Array.isArray(p.status)) {
      filters.status = p.status.filter((s): s is SwapStatus => VALID_SWAP_STATUSES.includes(s as SwapStatus));
    } else if (typeof p.status === 'string' && VALID_SWAP_STATUSES.includes(p.status as SwapStatus)) {
      filters.status = p.status as SwapStatus;
    }
  }

  if (p.role === 'requester' || p.role === 'provider' || p.role === 'all') {
    filters.role = p.role;
  } else {
    filters.role = 'all';
  }

  const rawLimit = Number(p.limit);
  filters.limit = !isNaN(rawLimit) && rawLimit > 0 ? Math.min(100, Math.floor(rawLimit)) : 50;

  const rawOffset = Number(p.offset);
  filters.offset = !isNaN(rawOffset) && rawOffset >= 0 ? Math.floor(rawOffset) : 0;

  return filters;
}
