'use client';

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/app/lib/supabase-client';
import { shadowValidatePlanRead } from '@/core/state/planStateAdapter';

/**
 * Hook to fetch and expose the current user's subscription plan and entitlements.
 * Returns null-safe defaults while loading.
 *
 * Usage:
 *   const { plan, entitlements, isLoading, isPaid, isAuthenticated } = useUserSubscription();
 */
export function useUserSubscription() {
  const [plan, setPlan] = useState(null);
  const [entitlements, setEntitlements] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchSubscription() {
      setIsLoading(true);
      try {
        const supabase = createBrowserSupabaseClient();
        const { data } = supabase ? await supabase.auth.getSession() : { data: null };
        const token = data?.session?.access_token;
        if (!token) {
          if (!cancelled) {
            setIsAuthenticated(false);
            setPlan('free');
            setEntitlements(null);
          }
          return;
        }

        const authHeaders = { Authorization: `Bearer ${token}` };

        // Fetch user profile (includes plan)
        const userRes = await fetch('/api/user', { headers: authHeaders });
        if (!userRes.ok) {
          // Not authenticated or error — safe default
          if (!cancelled) {
            setIsAuthenticated(false);
            setPlan('free');
            setEntitlements(null);
          }
          return;
        }

        const userData = await userRes.json();
        const userPlan = userData.plan || 'free';
        if (process.env.NODE_ENV !== 'production') {
          shadowValidatePlanRead(
            'useUserSubscription.user_api',
            userPlan,
            {
              serverPlan: userPlan,
              localStorage: typeof window !== 'undefined' ? window.localStorage : null,
              sessionStorage: typeof window !== 'undefined' ? window.sessionStorage : null,
            },
            'src/hooks/useUserSubscription.js:/api/user',
            console,
          );
        }

        if (!cancelled) {
          setIsAuthenticated(true);
          setPlan(userPlan);
        }

        // Fetch entitlements
        const entRes = await fetch('/api/user/entitlements', { headers: authHeaders });
        if (entRes.ok) {
          const entData = await entRes.json();
          if (!cancelled && entData.entitlements) {
            setEntitlements(entData.entitlements);
          }
        }
      } catch {
        // Network error — leave defaults
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchSubscription();
    return () => { cancelled = true; };
  }, []);

  const isPaid = plan && plan !== 'free';

  return {
    plan,
    entitlements,
    isLoading,
    isPaid,
    isAuthenticated,
  };
}
