'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient, isSupabaseConfigured } from '../app/lib/supabase-client';

export function usePublicAuthState() {
  const [authState, setAuthState] = useState(() => (
    isSupabaseConfigured() ? 'loading' : 'unauthenticated'
  ));

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    try {
      const supabase = createBrowserSupabaseClient();
      if (!supabase) {
        return undefined;
      }

      const authSubscription = supabase.auth.onAuthStateChange((_event, session) => {
        if (active) setAuthState(session ? 'authenticated' : 'unauthenticated');
      });
      unsubscribe = () => authSubscription?.data?.subscription?.unsubscribe?.();

      supabase.auth.getSession()
        .then(({ data }) => {
          if (active) setAuthState(data?.session ? 'authenticated' : 'unauthenticated');
        })
        .catch(() => {
          if (active) setAuthState('unauthenticated');
        });
    } catch (_) {
      queueMicrotask(() => {
        if (active) setAuthState('unauthenticated');
      });
    }

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return authState;
}
