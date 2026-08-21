import { UserRow, UserSkillRow, SkillRow } from './database';

/**
 * Full User Profile (returned to the profile owner / authenticated user)
 */
export interface UserProfile extends UserRow {
  skills_offered?: (UserSkillRow & { skill: SkillRow })[];
  skills_needed?: (UserSkillRow & { skill: SkillRow })[];
  completed_swaps_count?: number;
}

/**
 * Public User Profile (safe public view for other users, excluding sensitive fields like email)
 */
export interface PublicUserProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  college: string;
  department: string;
  year: number;
  bio: string | null;
  rating: number;
  created_at: string;
  skills_offered?: (UserSkillRow & { skill: SkillRow })[];
  skills_needed?: (UserSkillRow & { skill: SkillRow })[];
  completed_swaps_count?: number;
}

/**
 * Editable Profile Fields
 */
export interface UpdateUserProfileInput {
  name?: string;
  avatar_url?: string | null;
  college?: string;
  department?: string;
  year?: number;
  bio?: string | null;
}

/**
 * Filter criteria for user discovery
 */
export interface UserSearchFilters {
  query?: string;
  college?: string;
  department?: string;
  year?: number;
  skill_id?: string;
  skill_type?: 'OFFER' | 'NEED';
  limit?: number;
  offset?: number;
}
