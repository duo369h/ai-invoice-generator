// This is NOT a feature hierarchy system.
// This is a revenue track system.
// Each tier is an independent product experience.
// No cross-tier dependency is allowed.

import { createServiceSupabaseClient } from '../../src/app/lib/supabase';

export interface RevenueLockResult {
  allowed: boolean;
  reason: string;
  suggestedUpgrade: 'pro' | 'growth' | 'studio';
  costEstimate: number;
}

/**
 * Checks if the user is authorized to perform the given action.
 *
 * @param userId - Unique user identifier.
 * @param actionType - The type of action (invoice, proposal, profile, or bulk_export).
 */
export async function checkRevenueLock(
  userId: string | null,
  actionType: 'invoice' | 'proposal' | 'profile' | 'bulk_export'
): Promise<RevenueLockResult> {
  // SSR / Anonymous Safety Check
  if (!userId) {
    if (actionType === 'invoice') {
      return {
        allowed: true,
        reason: 'Anonymous invoice parsing allowed.',
        suggestedUpgrade: 'pro',
        costEstimate: 0.01,
      };
    }
    if (actionType === 'bulk_export') {
      return {
        allowed: false,
        reason: 'Bulk export requires a premium plan.',
        suggestedUpgrade: 'studio',
        costEstimate: 0.10,
      };
    }
    return {
      allowed: false,
      reason: 'Authentication required for AI features.',
      suggestedUpgrade: 'pro',
      costEstimate: 0.05,
    };
  }

  const supabase = createServiceSupabaseClient();
  let plan = 'free';

  if (supabase) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', userId)
        .maybeSingle();
      if (data && data.plan) {
        plan = String(data.plan).toLowerCase();
      }
    } catch (_) {}
  }

  const isUnlimited = plan === 'growth' || plan === 'studio' || plan === 'agency';
  const isStudio = plan === 'studio' || plan === 'agency';

  // Rule 1: Bulk Export (Locked to Client Growth Pack $29 - 'studio' / 'agency')
  if (actionType === 'bulk_export') {
    if (!isStudio) {
      return {
        allowed: false,
        reason: 'Bulk export is locked to the Client Growth Pack plan.',
        suggestedUpgrade: plan === 'growth' ? 'studio' : 'growth',
        costEstimate: 0.10,
      };
    }
    return {
      allowed: true,
      reason: 'Bulk export allowed.',
      suggestedUpgrade: 'studio',
      costEstimate: 0.10,
    };
  }

  // Rule 2: Invoice Generation (Low cost, always allowed)
  if (actionType === 'invoice') {
    return {
      allowed: true,
      reason: 'Invoice parsing allowed.',
      suggestedUpgrade: 'pro',
      costEstimate: 0.01,
    };
  }

  // Rule 3: Proposal Generation (Medium cost, limit daily usage on Free and Starter tiers)
  if (actionType === 'proposal') {
    if (!isUnlimited) {
      let count = 0;
      if (supabase) {
        try {
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { count: dbCount } = await supabase
            .from('audit_logs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('action', 'proposal_generated')
            .gte('created_at', oneDayAgo);
          count = dbCount || 0;
        } catch (_) {}
      }

      if (count >= 1) {
        return {
          allowed: false,
          reason: `Daily proposal generation limit reached (1/day) for ${plan === 'pro' ? 'Starter' : 'Free'} tier.`,
          suggestedUpgrade: plan === 'pro' ? 'growth' : 'pro',
          costEstimate: 0.05,
        };
      }
    }
    return {
      allowed: true,
      reason: 'Proposal generation allowed.',
      suggestedUpgrade: 'pro',
      costEstimate: 0.05,
    };
  }

  // Rule 4: Profile Generation (Limit daily usage on Free and Starter tiers)
  if (actionType === 'profile') {
    if (!isUnlimited) {
      let count = 0;
      if (supabase) {
        try {
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { count: dbCount } = await supabase
            .from('audit_logs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('action', 'card_profile_created')
            .gte('created_at', oneDayAgo);
          count = dbCount || 0;
        } catch (_) {}
      }

      if (count >= 1) {
        return {
          allowed: false,
          reason: `Daily profile generation limit reached (1/day) for ${plan === 'pro' ? 'Starter' : 'Free'} tier.`,
          suggestedUpgrade: plan === 'pro' ? 'growth' : 'pro',
          costEstimate: 0.03,
        };
      }
    }
    return {
      allowed: true,
      reason: 'Profile generation allowed.',
      suggestedUpgrade: plan === 'pro' ? 'growth' : 'pro',
      costEstimate: 0.03,
    };
  }

  return {
    allowed: true,
    reason: 'Allowed.',
    suggestedUpgrade: 'pro',
    costEstimate: 0.01,
  };
}
