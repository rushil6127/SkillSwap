/**
 * Server-side Supabase Client for API Routes & Server Actions
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function createSupabaseServerClient(authHeader?: string): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const options = authHeader
    ? {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    : undefined;

  return createClient(supabaseUrl, supabaseAnonKey, options);
}
