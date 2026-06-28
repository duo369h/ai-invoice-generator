import { isPaidPlan } from '../entitlements';

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
  // Check if user has active paid plan
  if (isPaidPlan(userPlan)) return false;

  switch (featureKey) {
    case 'create_invoice':
      return checkInvoiceLimit(usage.invoicesCount);
    case 'create_quote':
      return checkQuoteLimit(usage.quotesCount);
    case 'export_pdf':
      return true; // blocked entirely on free (watermark only)
    case 'client_portal':
      return true; // blocked entirely on free
    case 'send_invoice':
      return true; // blocked entirely on free
    default:
      return false;
  }
}
