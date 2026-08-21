import { getSupabaseBrowserClient } from '../supabase/client';
import {
  UserProfile,
  PublicUserProfile,
  UpdateUserProfileInput,
  UserSearchFilters,
} from '../../types/user';
import { UserRow } from '../../types/database';
import { validateUpdateUserProfileInput } from '../validations/user';

export class UserService {
  /**
   * Get the currently authenticated user's own full profile (includes email & balance).
   * Ownership is strictly determined by the active Supabase session.
   */
  static async getMyProfile(): Promise<{ profile: UserProfile | null; error: string | null }> {
    const supabase = getSupabaseBrowserClient();

    // 1. Get authenticated user from session
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { profile: null, error: 'Unauthorized: No active session found.' };
    }

    return this.getUserFullProfile(authUser.id);
  }

  /**
   * Get another user's public profile by ID.
   * Excludes sensitive private fields (such as email) for safety.
   */
  static async getPublicProfile(
    userId: string
  ): Promise<{ profile: PublicUserProfile | null; error: string | null }> {
    if (!userId || typeof userId !== 'string') {
      return { profile: null, error: 'Invalid user ID provided.' };
    }

    const supabase = getSupabaseBrowserClient();

    // 1. Fetch public profile columns only (explicitly omitting email and private configs)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, avatar_url, college, department, year, bio, rating, created_at')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { profile: null, error: userError ? userError.message : 'User not found.' };
    }

    // 2. Fetch user's offered and needed skills
    const { data: userSkills } = await supabase
      .from('user_skills')
      .select('*, skill:skills(*)')
      .eq('user_id', userId);

    // 3. Fetch completed swap count (defaults to 0 until swaps are populated in Phase 4)
    let completed_swaps_count = 0;
    try {
      const { count } = await supabase
        .from('swaps')
        .select('*', { count: 'exact', head: true })
        .or(`requester_id.eq.${userId},provider_id.eq.${userId}`)
        .eq('status', 'COMPLETED');
      if (count !== null && count !== undefined) {
        completed_swaps_count = count;
      }
    } catch {
      completed_swaps_count = 0;
    }

    const skills_offered = (userSkills || []).filter((s) => s.type === 'OFFER');
    const skills_needed = (userSkills || []).filter((s) => s.type === 'NEED');

    const publicProfile: PublicUserProfile = {
      id: user.id,
      name: user.name,
      avatar_url: user.avatar_url,
      college: user.college,
      department: user.department,
      year: user.year,
      bio: user.bio,
      rating: user.rating,
      created_at: user.created_at,
      skills_offered,
      skills_needed,
      completed_swaps_count,
    };

    return { profile: publicProfile, error: null };
  }

  /**
   * Update the current authenticated user's own profile.
   * Ownership is determined entirely by the authenticated session.
   */
  static async updateMyProfile(
    input: UpdateUserProfileInput
  ): Promise<{ user: UserRow | null; error: string | null }> {
    const supabase = getSupabaseBrowserClient();

    // 1. Authenticate caller via session
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { user: null, error: 'Unauthorized: You must be logged in to update your profile.' };
    }

    // 2. Validate input fields server-side
    const validation = validateUpdateUserProfileInput(input);
    if (!validation.success || !validation.data) {
      const firstError = Object.values(validation.errors || {})[0] || 'Invalid update payload.';
      return { user: null, error: firstError };
    }

    // 3. Execute update scoped strictly to the session's user ID
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(validation.data)
      .eq('id', authUser.id)
      .select()
      .single();

    if (updateError) {
      return { user: null, error: updateError.message };
    }

    return { user: updatedUser as UserRow, error: null };
  }

  /**
   * Update a user profile by target ID.
   * Enforces security rule: user CANNOT update another user's profile.
   */
  static async updateUserProfile(
    targetUserId: string,
    input: UpdateUserProfileInput
  ): Promise<{ user: UserRow | null; error: string | null }> {
    const supabase = getSupabaseBrowserClient();

    // 1. Authenticate caller
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { user: null, error: 'Unauthorized: You must be logged in to update a profile.' };
    }

    // 2. Enforce strict authorization: Caller ID must match Target User ID
    if (authUser.id !== targetUserId) {
      return {
        user: null,
        error: 'Forbidden: You do not have permission to update another user\'s profile.',
      };
    }

    // 3. Validate input
    const validation = validateUpdateUserProfileInput(input);
    if (!validation.success || !validation.data) {
      const firstError = Object.values(validation.errors || {})[0] || 'Invalid update payload.';
      return { user: null, error: firstError };
    }

    // 4. Update
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(validation.data)
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateError) {
      return { user: null, error: updateError.message };
    }

    return { user: updatedUser as UserRow, error: null };
  }

  /**
   * Internal helper: Fetch full profile by ID (used for own profile or authorized flows)
   */
  static async getUserFullProfile(
    userId: string
  ): Promise<{ profile: UserProfile | null; error: string | null }> {
    const supabase = getSupabaseBrowserClient();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { profile: null, error: userError ? userError.message : 'User not found.' };
    }

    const { data: userSkills } = await supabase
      .from('user_skills')
      .select('*, skill:skills(*)')
      .eq('user_id', userId);

    // Fetch completed swap count (defaults to 0 until swaps are populated in Phase 4)
    let completed_swaps_count = 0;
    try {
      const { count } = await supabase
        .from('swaps')
        .select('*', { count: 'exact', head: true })
        .or(`requester_id.eq.${userId},provider_id.eq.${userId}`)
        .eq('status', 'COMPLETED');
      if (count !== null && count !== undefined) {
        completed_swaps_count = count;
      }
    } catch {
      completed_swaps_count = 0;
    }

    const skills_offered = (userSkills || []).filter((s) => s.type === 'OFFER');
    const skills_needed = (userSkills || []).filter((s) => s.type === 'NEED');

    const profile: UserProfile = {
      ...(user as UserRow),
      skills_offered,
      skills_needed,
      completed_swaps_count,
    };

    return { profile, error: null };
  }

  /**
   * Search users by campus, department, year, or keyword (returns public profile info)
   */
  static async searchUsers(
    filters: UserSearchFilters = {}
  ): Promise<{ users: PublicUserProfile[]; count: number; error: string | null }> {
    const supabase = getSupabaseBrowserClient();
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    let query = supabase
      .from('users')
      .select('id, name, avatar_url, college, department, year, bio, rating, created_at', {
        count: 'exact',
      });

    if (filters.college) {
      query = query.ilike('college', `%${filters.college}%`);
    }

    if (filters.department) {
      query = query.ilike('department', `%${filters.department}%`);
    }

    if (filters.year) {
      query = query.eq('year', filters.year);
    }

    if (filters.query) {
      query = query.or(`name.ilike.%${filters.query}%,bio.ilike.%${filters.query}%`);
    }

    const { data, count, error } = await query
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { users: [], count: 0, error: error.message };
    }

    return { users: (data as PublicUserProfile[]) || [], count: count || 0, error: null };
  }
}
