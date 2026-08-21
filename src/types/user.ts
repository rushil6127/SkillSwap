import { UserRow, UserSkillRow, SkillRow } from './database';

export interface UserProfile extends UserRow {
  skills_offered?: (UserSkillRow & { skill: SkillRow })[];
  skills_needed?: (UserSkillRow & { skill: SkillRow })[];
  completed_swaps_count?: number;
}

export interface UpdateUserProfileInput {
  name?: string;
  avatar_url?: string | null;
  college?: string;
  department?: string;
  year?: number;
  bio?: string | null;
}

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
