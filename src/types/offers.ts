import { OfferRow, OfferStatus, UserRow } from './database';
import { RequestDetail } from './requests';

/**
 * Summary of the provider offering help
 */
export type OfferProviderSummary = Pick<
  UserRow,
  'id' | 'name' | 'email' | 'avatar_url' | 'college' | 'department' | 'year' | 'rating'
>;

/**
 * Complete Offer representation with joined provider and optional request details
 */
export interface OfferDetail extends OfferRow {
  provider: OfferProviderSummary;
  request?: RequestDetail;
}

/**
 * Payload for submitting an offer on a request
 */
export interface CreateOfferInput {
  request_id: string;
  message?: string | null;
}

/**
 * Payload for updating offer status
 */
export interface UpdateOfferStatusInput {
  status: OfferStatus;
}

/**
 * Query filters for offers
 */
export interface OfferFilters {
  request_id?: string;
  provider_id?: string;
  status?: OfferStatus | OfferStatus[];
  limit?: number;
  offset?: number;
}
