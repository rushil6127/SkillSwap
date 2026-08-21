import { getSupabaseBrowserClient } from '../supabase/client';
import { SkillRow, UserSkillRow } from '../../types/database';
import { CreateSkillInput, SetUserSkillInput, UserSkillDetail } from '../../types/skills';
import { validateCreateSkillInput, validateSetUserSkillInput } from '../validations/skills';

export class SkillsService {
  /**
   * Get all skills from the catalog, optionally filtered by category
   */
  static async getAllSkills(category?: string): Promise<{ skills: SkillRow[]; error: string | null }> {
    const supabase = getSupabaseBrowserClient();
    let query = supabase.from('skills').select('*').order('name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
      return { skills: [], error: error.message };
    }

    return { skills: (data as SkillRow[]) || [], error: null };
  }

  /**
   * Search skills by name
   */
  static async searchSkills(searchTerm: string): Promise<{ skills: SkillRow[]; error: string | null }> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .ilike('name', `%${searchTerm.trim()}%`)
      .order('name', { ascending: true });

    if (error) {
      return { skills: [], error: error.message };
    }

    return { skills: (data as SkillRow[]) || [], error: null };
  }

  /**
   * Get a user's offered and needed skills
   */
  static async getUserSkills(userId: string): Promise<{ userSkills: UserSkillDetail[]; error: string | null }> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('user_skills')
      .select('*, skill:skills(*)')
      .eq('user_id', userId);

    if (error) {
      return { userSkills: [], error: error.message };
    }

    return { userSkills: (data as unknown as UserSkillDetail[]) || [], error: null };
  }

  /**
   * Add or update a user skill (OFFER or NEED)
   */
  static async setUserSkill(
    userId: string,
    input: SetUserSkillInput
  ): Promise<{ userSkill: UserSkillRow | null; error: string | null }> {
    const validation = validateSetUserSkillInput(input);
    if (!validation.success || !validation.data) {
      const firstError = Object.values(validation.errors || {})[0] || 'Invalid skill input';
      return { userSkill: null, error: firstError };
    }

    const { skill_id, type, level } = validation.data;
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from('user_skills')
      .upsert(
        {
          user_id: userId,
          skill_id,
          type,
          level,
        },
        { onConflict: 'user_id,skill_id,type' }
      )
      .select()
      .single();

    if (error) {
      return { userSkill: null, error: error.message };
    }

    return { userSkill: data as UserSkillRow, error: null };
  }

  /**
   * Remove a skill from user profile
   */
  static async removeUserSkill(userSkillId: string): Promise<{ success: boolean; error: string | null }> {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from('user_skills').delete().eq('id', userSkillId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  }

  /**
   * Add a new custom skill to the global catalog
   */
  static async createCustomSkill(input: CreateSkillInput): Promise<{ skill: SkillRow | null; error: string | null }> {
    const validation = validateCreateSkillInput(input);
    if (!validation.success || !validation.data) {
      const firstError = Object.values(validation.errors || {})[0] || 'Invalid skill input';
      return { skill: null, error: firstError };
    }

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('skills')
      .insert(validation.data)
      .select()
      .single();

    if (error) {
      return { skill: null, error: error.message };
    }

    return { skill: data as SkillRow, error: null };
  }
}
