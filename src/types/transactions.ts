import { TransactionRow, UserRow } from './database';
import { SwapDetail } from './swaps';

/**
 * Summary of a transaction participant
 */
export type TransactionParticipantSummary = Pick<
  UserRow,
  'id' | 'name' | 'email' | 'avatar_url' | 'college' | 'department' | 'year' | 'rating'
>;

/**
 * Complete transaction record with joined user and swap details
 */
export interface TransactionDetail extends TransactionRow {
  from_user?: TransactionParticipantSummary | null;
  to_user: TransactionParticipantSummary;
  swap?: SwapDetail | null;
}

/**
 * Result returned from an atomic swap completion and credit transfer operation
 */
export interface CompleteSwapTransferResult {
  success: boolean;
  swap_id?: string;
  transaction_id?: string;
  amount?: number;
  new_requester_balance?: number;
  error?: string | null;
}

/**
 * Filters for querying user transaction history
 */
export interface TransactionFilters {
  type?: 'all' | 'sent' | 'received';
  swap_id?: string;
  limit?: number;
  offset?: number;
}
