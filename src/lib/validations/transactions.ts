import { TransactionFilters } from '../../types/transactions';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Sanitizes transaction query filters
 */
export function sanitizeTransactionFilters(raw: unknown): TransactionFilters {
  if (!raw || typeof raw !== 'object') {
    return { type: 'all', limit: 50, offset: 0 };
  }

  const p = raw as Record<string, unknown>;
  const filters: TransactionFilters = {};

  if (p.type === 'sent' || p.type === 'received' || p.type === 'all') {
    filters.type = p.type;
  } else {
    filters.type = 'all';
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
