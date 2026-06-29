import { createClient } from '@supabase/supabase-js';
import { writeClientEntrySessionState } from '../../core/entry/ENTRY_STATE';

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

let supabaseInstance = null;

export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured() || typeof window === 'undefined') return null;

  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    );

    // Expose instance for E2E tests
    window.supabaseClientInstance = supabaseInstance;

    // Automatically sync auth changes to cookies
    supabaseInstance.auth.onAuthStateChange((_event, session) => {
      writeClientEntrySessionState(session);
    });
  }
  return supabaseInstance;
}
