/*
 * Expression Engine v1 — Corvioz v10
 *
 * This system is not a feature gating system.
 * It is an expression and revenue alignment system.
 * Users upgrade identity, not unlock functionality.
 *
 * Rules:
 * - NO pricing logic in this file
 * - NO paywall triggers
 * - NO business rules
 * - Pure UI configuration only
 */

export type PlanTier = 'free' | 'pro' | 'growth' | 'studio';

export interface IdentityExpression {
  tierLabel: string;
  tierTagline: string;
  accentColor: string;
  sidebarGradient: string;
  showVerifiedBadge: boolean;
  showTopRatedBadge: boolean;
  showFastResponseBadge: boolean;
  portfolioItemLimit: number;
  coverBannerEditable: boolean;
}

export interface WorkExpression {
  exportEnabled: boolean;
  exportWatermarked: boolean;
  shareLinksEnabled: boolean;
  shareLinksWatermarked: boolean;
  proposalDailyLimit: number;
  profileDailyLimit: number;
  aiQuality: 'standard' | 'priority';
}

export interface ClientExpression {
  clientLimit: number;
  clientPortalEnabled: boolean;
  contactFlow: 'email_only' | 'form_and_calendar' | 'branded_hub';
  crmEnabled: boolean;
}

export interface ExpressionConfig {
  plan: PlanTier;
  identity: IdentityExpression;
  work: WorkExpression;
  client: ClientExpression;
}

export function getExpressionConfig(plan: PlanTier): ExpressionConfig {
  switch (plan) {
    case 'studio':
      return {
        plan: 'studio',
        identity: {
          tierLabel: 'Studio',
          tierTagline: 'Scale your freelance income predictably.',
          accentColor: '#a855f7',
          sidebarGradient: 'linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
          showVerifiedBadge: true,
          showTopRatedBadge: true,
          showFastResponseBadge: true,
          portfolioItemLimit: 0,
          coverBannerEditable: true,
        },
        work: {
          exportEnabled: true,
          exportWatermarked: false,
          shareLinksEnabled: true,
          shareLinksWatermarked: false,
          proposalDailyLimit: 0,
          profileDailyLimit: 0,
          aiQuality: 'priority',
        },
        client: {
          clientLimit: 3,
          clientPortalEnabled: true,
          contactFlow: 'branded_hub',
          crmEnabled: true,
        },
      };

    case 'growth':
      return {
        plan: 'growth',
        identity: {
          tierLabel: 'Pro',
          tierTagline: 'Present client work professionally.',
          accentColor: '#10b981',
          sidebarGradient: 'linear-gradient(160deg, #0d1117 0%, #064e3b 50%, #0d1117 100%)',
          showVerifiedBadge: true,
          showTopRatedBadge: true,
          showFastResponseBadge: true,
          portfolioItemLimit: 0,
          coverBannerEditable: true,
        },
        work: {
          exportEnabled: true,
          exportWatermarked: false,
          shareLinksEnabled: true,
          shareLinksWatermarked: false,
          proposalDailyLimit: 0,
          profileDailyLimit: 0,
          aiQuality: 'standard',
        },
        client: {
          clientLimit: 1,
          clientPortalEnabled: false,
          contactFlow: 'form_and_calendar',
          crmEnabled: false,
        },
      };

    case 'pro':
      return {
        plan: 'pro',
        identity: {
          tierLabel: 'Starter',
          tierTagline: 'Organize client delivery.',
          accentColor: '#4f46e5',
          sidebarGradient: 'linear-gradient(160deg, #0d1117 0%, #1e1b4b 50%, #0d1117 100%)',
          showVerifiedBadge: false,
          showTopRatedBadge: false,
          showFastResponseBadge: false,
          portfolioItemLimit: 3,
          coverBannerEditable: false,
        },
        work: {
          exportEnabled: true,
          exportWatermarked: true,
          shareLinksEnabled: true,
          shareLinksWatermarked: true,
          proposalDailyLimit: 1,
          profileDailyLimit: 1,
          aiQuality: 'standard',
        },
        client: {
          clientLimit: 1,
          clientPortalEnabled: false,
          contactFlow: 'email_only',
          crmEnabled: false,
        },
      };

    case 'free':
    default:
      return {
        plan: 'free',
        identity: {
          tierLabel: 'Free',
          tierTagline: 'Build your first proposal today.',
          accentColor: '#4f46e5',
          sidebarGradient: 'linear-gradient(160deg, #0d1117 0%, #1e1b4b 50%, #0d1117 100%)',
          showVerifiedBadge: false,
          showTopRatedBadge: false,
          showFastResponseBadge: false,
          portfolioItemLimit: 1,
          coverBannerEditable: false,
        },
        work: {
          exportEnabled: true,
          exportWatermarked: true,
          shareLinksEnabled: false,
          shareLinksWatermarked: true,
          proposalDailyLimit: 1,
          profileDailyLimit: 1,
          aiQuality: 'standard',
        },
        client: {
          clientLimit: 0,
          clientPortalEnabled: false,
          contactFlow: 'email_only',
          crmEnabled: false,
        },
      };
  }
}
