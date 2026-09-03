/*
 * Revenue Trigger Engine — Corvioz v10
 *
 * Replaces all feature-gate lock screens with non-blocking success-moment nudges.
 *
 * Rules:
 * - Nudges fire AFTER value is created, not BEFORE access
 * - Nudges are non-blocking (slide-in banners, not interrupting modals)
 * - Returns null when no nudge is appropriate (user already on correct tier)
 * - NO hard blocks or access denial in this system
 */

import { PlanTier } from './expressionEngine';

export type SuccessMoment =
  | 'PROPOSAL_GENERATED'
  | 'INVOICE_CREATED'
  | 'QUOTE_CREATED'
  | 'FIRST_CLIENT_ADDED'
  | 'SHARE_LINK_CLICKED'
  | 'EXPORT_ATTEMPTED'
  | 'PORTFOLIO_ITEM_ADDED'
  | 'PROFILE_PUBLISHED';

export interface SuccessNudge {
  /** The moment that triggered this nudge */
  moment: SuccessMoment;
  /** Short headline — identity/result framing, not feature list */
  headline: string;
  /** One-line outcome description */
  outcome: string;
  /** CTA button label */
  ctaLabel: string;
  /** Target plan to upgrade to */
  targetPlan: 'pro' | 'growth' | 'studio';
  /** Checkout source tag for analytics */
  source: string;
}

const NUDGE_MAP: Record<SuccessMoment, Partial<Record<PlanTier, SuccessNudge>>> = {
  PROPOSAL_GENERATED: {
    free: {
      moment: 'PROPOSAL_GENERATED',
      headline: 'Your proposal is ready.',
      outcome: 'Send it without a watermark and present client work professionally.',
      ctaLabel: 'Upgrade to Starter — $9/mo',
      targetPlan: 'pro',
      source: 'proposal_generated_free',
    },
    pro: {
      moment: 'PROPOSAL_GENERATED',
      headline: 'Proposal ready to send.',
      outcome: 'Unlimited proposals. No daily limits. Export clean PDFs instantly.',
      ctaLabel: 'Upgrade to Pro — $19/mo',
      targetPlan: 'growth',
      source: 'proposal_generated_starter',
    },
  },
  INVOICE_CREATED: {
    free: {
      moment: 'INVOICE_CREATED',
      headline: 'Invoice created.',
      outcome: 'Export it without a watermark and send it directly to your client.',
      ctaLabel: 'Upgrade to Starter — $9/mo',
      targetPlan: 'pro',
      source: 'invoice_created_free',
    },
    pro: {
      moment: 'INVOICE_CREATED',
      headline: 'Invoice ready.',
      outcome: 'Export a clean, professional PDF with no watermark.',
      ctaLabel: 'Upgrade to Pro — $19/mo',
      targetPlan: 'growth',
      source: 'invoice_created_starter',
    },
  },
  QUOTE_CREATED: {
    free: {
      moment: 'QUOTE_CREATED',
      headline: 'Quote ready.',
      outcome: 'Share a client-ready quote link — no watermark, no delays.',
      ctaLabel: 'Upgrade to Starter — $9/mo',
      targetPlan: 'pro',
      source: 'quote_created_free',
    },
    pro: {
      moment: 'QUOTE_CREATED',
      headline: 'Quote sent.',
      outcome: 'Create unlimited quotes and keep client review moving.',
      ctaLabel: 'Upgrade to Pro — $19/mo',
      targetPlan: 'growth',
      source: 'quote_created_starter',
    },
  },
  FIRST_CLIENT_ADDED: {
    growth: {
      moment: 'FIRST_CLIENT_ADDED',
      headline: 'First client added.',
      outcome: 'Scale to 3 client workspaces. Keep client operations organized.',
      ctaLabel: 'Upgrade to Studio — $29/mo',
      targetPlan: 'studio',
      source: 'first_client_added_growth',
    },
  },
  SHARE_LINK_CLICKED: {
    free: {
      moment: 'SHARE_LINK_CLICKED',
      headline: 'Your link is ready to share.',
      outcome: 'Remove the watermark and send a fully professional proposal.',
      ctaLabel: 'Upgrade to Starter — $9/mo',
      targetPlan: 'pro',
      source: 'share_link_free',
    },
    pro: {
      moment: 'SHARE_LINK_CLICKED',
      headline: 'Link shared.',
      outcome: 'Send client links without watermarks. Look like a premium freelancer.',
      ctaLabel: 'Upgrade to Pro — $19/mo',
      targetPlan: 'growth',
      source: 'share_link_starter',
    },
  },
  EXPORT_ATTEMPTED: {
    free: {
      moment: 'EXPORT_ATTEMPTED',
      headline: 'PDF exported with watermark.',
      outcome: 'Upgrade to send clean, client-ready PDFs that look fully professional.',
      ctaLabel: 'Upgrade to Starter — $9/mo',
      targetPlan: 'pro',
      source: 'export_attempted_free',
    },
    pro: {
      moment: 'EXPORT_ATTEMPTED',
      headline: 'PDF exported with watermark.',
      outcome: 'Upgrade to export clean, watermark-free PDFs and share instantly.',
      ctaLabel: 'Upgrade to Pro — $19/mo',
      targetPlan: 'growth',
      source: 'export_attempted_starter',
    },
  },
  PORTFOLIO_ITEM_ADDED: {
    pro: {
      moment: 'PORTFOLIO_ITEM_ADDED',
      headline: 'Portfolio updated.',
      outcome: 'Expand your portfolio without limits. Impress more clients.',
      ctaLabel: 'Upgrade to Pro — $19/mo',
      targetPlan: 'growth',
      source: 'portfolio_added_starter',
    },
    growth: {
      moment: 'PORTFOLIO_ITEM_ADDED',
      headline: 'Portfolio growing.',
      outcome: 'Add case study pages and run multiple client workspaces.',
      ctaLabel: 'Upgrade to Studio — $29/mo',
      targetPlan: 'studio',
      source: 'portfolio_added_growth',
    },
  },
  PROFILE_PUBLISHED: {
    free: {
      moment: 'PROFILE_PUBLISHED',
      headline: 'Profile is live.',
      outcome: 'Add verified badges and remove the "Powered by Corvioz" tag.',
      ctaLabel: 'Upgrade to Starter — $9/mo',
      targetPlan: 'pro',
      source: 'profile_published_free',
    },
    pro: {
      moment: 'PROFILE_PUBLISHED',
      headline: 'Profile published.',
      outcome: 'Enable verified badges and unlock your full professional identity.',
      ctaLabel: 'Upgrade to Pro — $19/mo',
      targetPlan: 'growth',
      source: 'profile_published_starter',
    },
  },
};

/**
 * Returns the appropriate success-moment nudge for a given action and plan.
 * Returns null if no nudge is needed (user already on the right tier).
 *
 * Nudges are NON-BLOCKING — they should render as slide-in banners,
 * never as interrupting modals or access denials.
 */
export function getSuccessMomentNudge(
  moment: SuccessMoment,
  plan: PlanTier
): SuccessNudge | null {
  const momentMap = NUDGE_MAP[moment];
  if (!momentMap) return null;
  return momentMap[plan] ?? null;
}
