import { getSupabaseBrowserClient } from '../supabase/client';
import { UserProfile, UpdateUserProfileInput, UserSearchFilters } from '../../types/user';
import { UserRow } from '../../types/database';
import { validateUpdateUserProfileInput } from '../validations/user';

export class UserService {
  /**
   * Fetch complete user profile including offered and needed skills
   */
  static async getUserProfile(userId: string): Promise<{ profile: UserProfile | null; error: string | null }> {
    const supabase = getSupabaseBrowserClient();

    // 1. Fetch base user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { profile: null, error: userError ? userError.message : 'User not found' };
    }

    // 2. Fetch user's skills with joined skill catalog details
    const { data: userSkills, error: skillsError } = await supabase
      .from('user_skills')
      .select('*, skill:skills(*)')
      .eq('user_id', userId);

    if (skillsError) {
      console.warn('Failed to load user skills:', skillsError.message);
    }

    // 3. Count completed swaps
    const { count: completedCount } = await supabase
      .from('swaps')
      .select('*', { count: 'exact', head: true })
      .or(`requester_id.eq.${userId},provider_id.eq.${userId}`)
      .eq('status', 'COMPLETED');

    const skills_offered = (userSkills || []).filter((s) => s.type === 'OFFER');
    const skills_needed = (userSkills || []).filter((s) => s.type === 'NEED');

    const profile: UserProfile = {
      ...(user as UserRow),
      skills_offered,
      skills_needed,
      completed_swaps_count: completedCount || 0,
    };

    return { profile, error: null };
  }

  /**
   * Update editable profile fields
   */
  static async updateUserProfile(
    userId: string,
    input: UpdateUserProfileInput
  ): Promise<{ user: UserRow | null; error: string | null }> {
    const validation = validateUpdateUserProfileInput(input);
    if (!validation.success || !validation.data) {
      const firstError = Object.values(validation.errors || {})[0] || 'Invalid update data';
      return { user: null, error: firstError };
    }

    const supabase = getSupabaseBrowserClient();

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(validation.data)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: updatedUser as UserRow, error: null };
  }

  /**
   * Search users by campus/department/query
   */
  static async searchUsers(
    filters: UserSearchFilters = {}
  ): Promise<{ users: UserRow[]; count: number; error: string | null }> {
    const supabase = getSupabaseBrowserClient();
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    let query = supabase.from('users').select('*', { count: 'exact' });

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

    return { users: (data as UserRow[]) || [], count: count || 0, error: null };
  }
}
