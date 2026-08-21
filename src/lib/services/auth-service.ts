import { getSupabaseBrowserClient } from '../supabase/client';
import { SignUpInput, SignInInput, AuthSessionResult } from '../../types/auth';
import { validateSignUpInput, validateSignInInput } from '../validations/auth';
import { UserRow } from '../../types/database';

export class AuthService {
  /**
   * Register a student using their campus email
   */
  static async signUp(input: SignUpInput): Promise<{ user: UserRow | null; error: string | null }> {
    const validation = validateSignUpInput(input);
    if (!validation.success || !validation.data) {
      const firstError = Object.values(validation.errors || {})[0] || 'Invalid signup input';
      return { user: null, error: firstError };
    }

    const { email, password, name, college, department, year, bio } = validation.data;
    const supabase = getSupabaseBrowserClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          college,
          department,
          year,
          bio,
        },
      },
    });

    if (authError) {
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      return { user: null, error: 'Failed to create user account' };
    }

    // Fetch the newly created profile row inserted by database trigger
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.warn('Profile record retrieval delay:', profileError.message);
    }

    return { user: userProfile as UserRow, error: null };
  }

  /**
   * Authenticate student with email & password
   */
  static async signIn(input: SignInInput): Promise<{ user: UserRow | null; error: string | null }> {
    const validation = validateSignInInput(input);
    if (!validation.success || !validation.data) {
      const firstError = Object.values(validation.errors || {})[0] || 'Invalid sign-in input';
      return { user: null, error: firstError };
    }

    const { email, password } = validation.data;
    const supabase = getSupabaseBrowserClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      return { user: null, error: 'User not found' };
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      return { user: null, error: profileError.message };
    }

    return { user: userProfile as UserRow, error: null };
  }

  /**
   * Log out current student session
   */
  static async signOut(): Promise<{ error: string | null }> {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    return { error: error ? error.message : null };
  }

  /**
   * Get active authenticated user session and profile
   */
  static async getCurrentSession(): Promise<AuthSessionResult> {
    const supabase = getSupabaseBrowserClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return { user: null, isAuthenticated: false, error: sessionError?.message };
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError || !userProfile) {
      return { user: null, isAuthenticated: true, error: profileError?.message };
    }

    return { user: userProfile as UserRow, isAuthenticated: true, error: null };
  }
}
