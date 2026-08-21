/**
 * SkillSwap Database Schema Types & Enums
 * Source of truth mapped to PostgreSQL & Supabase schema.
 */

export type SkillType = 'OFFER' | 'NEED';
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type RequestStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type SwapStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type NotificationType =
  | 'SWAP_OFFER'
  | 'OFFER_ACCEPTED'
  | 'OFFER_REJECTED'
  | 'MESSAGE'
  | 'CREDIT_TRANSFER'
  | 'RATING_RECEIVED';

export interface UserRow {
  id: string; // UUID references auth.users
  name: string;
  email: string;
  avatar_url: string | null;
  college: string;
  department: string;
  year: number;
  bio: string | null;
  credits_balance: number;
  rating: number;
  created_at: string;
}

export interface SkillRow {
  id: string; // UUID
  name: string;
  category: string;
  created_at?: string;
}

export interface UserSkillRow {
  id: string; // UUID
  user_id: string; // UUID FK -> users.id
  skill_id: string; // UUID FK -> skills.id
  type: SkillType;
  level: SkillLevel;
  created_at?: string;
}

export interface RequestRow {
  id: string; // UUID
  creator_id: string; // UUID FK -> users.id
  title: string;
  description: string;
  skill_id: string; // UUID FK -> skills.id
  credits_offered: number;
  deadline: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface OfferRow {
  id: string; // UUID
  request_id: string; // UUID FK -> requests.id
  provider_id: string; // UUID FK -> users.id
  message: string | null;
  status: OfferStatus;
  created_at: string;
}

export interface SwapRow {
  id: string; // UUID
  request_id: string; // UUID FK -> requests.id
  requester_id: string; // UUID FK -> users.id
  provider_id: string; // UUID FK -> users.id
  credits: number;
  status: SwapStatus;
  started_at: string;
  completed_at: string | null;
}

export interface MessageRow {
  id: string; // UUID
  swap_id: string; // UUID FK -> swaps.id
  sender_id: string; // UUID FK -> users.id
  content: string;
  created_at: string;
}

export interface TransactionRow {
  id: string; // UUID
  swap_id: string | null; // UUID FK -> swaps.id
  from_user_id: string | null; // UUID FK -> users.id (null for system grants)
  to_user_id: string; // UUID FK -> users.id
  amount: number;
  reason: string;
  created_at: string;
}

export interface RatingRow {
  id: string; // UUID
  swap_id: string; // UUID FK -> swaps.id
  reviewer_id: string; // UUID FK -> users.id
  reviewee_id: string; // UUID FK -> users.id
  score: number; // 1-5
  comment: string | null;
  created_at: string;
}

export interface NotificationRow {
  id: string; // UUID
  user_id: string; // UUID FK -> users.id
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}
