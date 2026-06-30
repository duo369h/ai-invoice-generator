import { isPaidPlan } from '../entitlements';
import { shadowValidatePlanRead } from '../../src/core/state/planStateAdapter';
import { recordDecisionTelemetry } from '../../src/core/telemetry/decisionTelemetry';

export interface UsageStats {
  invoicesCount: number;
  quotesCount: number;
  exportsCount: number;
}

export const FREE_TIER_LIMITS = {
  invoices: 3,  // 4th invoice triggers paywall (3 total allowed)
  quotes: 5,    // unlimited quotes on free (soft trigger at 5)
  exports: 0,   // PDF export blocked on free (watermark only)
  clients: 2,   // max 2 clients on free plan
};

export function getUsageLimits() {
  return FREE_TIER_LIMITS;
}

export function checkInvoiceLimit(count: number): boolean {
  return count >= FREE_TIER_LIMITS.invoices;
}

export function checkQuoteLimit(count: number): boolean {
  return count >= FREE_TIER_LIMITS.quotes;
}

export function checkExportLimit(count: number): boolean {
  return count >= FREE_TIER_LIMITS.exports;
}

export function isFeatureBlocked(featureKey: string, usage: UsageStats, userPlan: string): boolean {
  if (process.env.NODE_ENV !== 'production') {
    shadowValidatePlanRead(
      `usageLimiter.${featureKey}`,
      userPlan,
      { explicitPlan: userPlan },
      'lib/usage/usageLimiter.ts:isFeatureBlocked',
      console,
    );
  }
  // Check if user has active paid plan
  if (isPaidPlan(userPlan)) {
    recordDecisionTelemetry({
      source: 'lib/usage/usageLimiter.ts:isFeatureBlocked',
      decisionType: 'feature gating',
      legacyOutput: false,
      adapterOutput: { featureKey, usage, userPlan, shouldBlock: false },
      tags: ['FEATURE_GATE', 'LOG_ONLY', 'v5.2.1'],
    });
    return false;
  }

  let result = false;
  switch (featureKey) {
    case 'create_invoice':
      result = checkInvoiceLimit(usage.invoicesCount);
      break;
    case 'create_quote':
      result = checkQuoteLimit(usage.quotesCount);
      break;
    case 'export_pdf':
      result = true; // blocked entirely on free (watermark only)
      break;
    case 'client_portal':
      result = true; // blocked entirely on free
      break;
    case 'send_invoice':
      result = true; // blocked entirely on free
      break;
    default:
      result = false;
  }
  recordDecisionTelemetry({
    source: 'lib/usage/usageLimiter.ts:isFeatureBlocked',
    decisionType: featureKey === 'export_pdf' ? 'export permission' : 'feature gating',
    legacyOutput: result,
    adapterOutput: { featureKey, usage, userPlan, shouldBlock: result },
    tags: ['FEATURE_GATE', featureKey === 'export_pdf' ? 'EXPORT_PERMISSION' : 'PAYWALL', 'LOG_ONLY', 'v5.2.1'],
  });
  return result;
}
