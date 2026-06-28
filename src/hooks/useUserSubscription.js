'use client';

import { useState, useEffect } from 'react';

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
        // Fetch user profile (includes plan)
        const userRes = await fetch('/api/user', { credentials: 'include' });
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

        if (!cancelled) {
          setIsAuthenticated(true);
          setPlan(userPlan);
        }

        // Fetch entitlements
        const entRes = await fetch('/api/user/entitlements', { credentials: 'include' });
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
