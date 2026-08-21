import { CreateOfferInput, OfferFilters, UpdateOfferStatusInput } from '../../types/offers';
import { OfferStatus } from '../../types/database';
import { ValidationResult } from './auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_OFFER_STATUSES: OfferStatus[] = ['PENDING', 'ACCEPTED', 'REJECTED'];

/**
 * Validates payload for creating a new offer
 */
export function validateCreateOfferInput(input: unknown): ValidationResult<CreateOfferInput> {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== 'object') {
    return { success: false, errors: { form: 'Invalid offer creation payload.' } };
  }

  const payload = input as Record<string, unknown>;

  const requestId = typeof payload.request_id === 'string' ? payload.request_id.trim() : '';
  if (!requestId) {
    errors.request_id = 'Request ID is required.';
  } else if (!UUID_REGEX.test(requestId)) {
    errors.request_id = 'Invalid request ID format.';
  }

  let message: string | null = null;
  if (payload.message !== undefined && payload.message !== null) {
    if (typeof payload.message !== 'string') {
      errors.message = 'Offer message must be a valid text string.';
    } else {
      const trimmed = payload.message.trim();
      if (trimmed.length > 1000) {
        errors.message = 'Offer message cannot exceed 1000 characters.';
      } else {
        message = trimmed || null;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      request_id: requestId,
      message,
    },
  };
}

/**
 * Validates offer status update action (accept / reject)
 */
export function validateUpdateOfferStatusInput(input: unknown): ValidationResult<UpdateOfferStatusInput> {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== 'object') {
    return { success: false, errors: { form: 'Invalid offer status update payload.' } };
  }

  const payload = input as Record<string, unknown>;
  const rawStatus = typeof payload.status === 'string' ? (payload.status.toUpperCase() as OfferStatus) : undefined;

  if (!rawStatus || !VALID_OFFER_STATUSES.includes(rawStatus)) {
    errors.status = `Status must be one of: ${VALID_OFFER_STATUSES.join(', ')}`;
  } else if (rawStatus === 'PENDING') {
    errors.status = 'Cannot set an offer status back to PENDING.';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      status: rawStatus as OfferStatus,
    },
  };
}

/**
 * Sanitizes offer filter parameters
 */
export function sanitizeOfferFilters(raw: unknown): OfferFilters {
  if (!raw || typeof raw !== 'object') {
    return { limit: 50, offset: 0 };
  }

  const p = raw as Record<string, unknown>;
  const filters: OfferFilters = {};

  if (typeof p.request_id === 'string' && UUID_REGEX.test(p.request_id.trim())) {
    filters.request_id = p.request_id.trim();
  }

  if (typeof p.provider_id === 'string' && UUID_REGEX.test(p.provider_id.trim())) {
    filters.provider_id = p.provider_id.trim();
  }

  if (p.status) {
    if (Array.isArray(p.status)) {
      filters.status = p.status.filter((s): s is OfferStatus => VALID_OFFER_STATUSES.includes(s as OfferStatus));
    } else if (typeof p.status === 'string' && VALID_OFFER_STATUSES.includes(p.status as OfferStatus)) {
      filters.status = p.status as OfferStatus;
    }
  }

  const rawLimit = Number(p.limit);
  filters.limit = !isNaN(rawLimit) && rawLimit > 0 ? Math.min(100, Math.floor(rawLimit)) : 50;

  const rawOffset = Number(p.offset);
  filters.offset = !isNaN(rawOffset) && rawOffset >= 0 ? Math.floor(rawOffset) : 0;

  return filters;
}
