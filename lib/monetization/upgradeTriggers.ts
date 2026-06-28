import { evaluatePaywallTrigger, PaywallTriggerResult } from '../paywall/paywallEngine';
import { UsageStats } from '../usage/usageLimiter';

export function checkInvoiceUpgradeTrigger(invoiceCount: number, userPlan: string): PaywallTriggerResult | null {
  const usage: UsageStats = { invoicesCount: invoiceCount, quotesCount: 0, exportsCount: 0 };
  const result = evaluatePaywallTrigger('create_invoice', usage, userPlan, 'invoice_save');
  return result.shouldBlock ? result : null;
}

export function checkQuoteUpgradeTrigger(quoteCount: number, userPlan: string): PaywallTriggerResult | null {
  const usage: UsageStats = { invoicesCount: 0, quotesCount: quoteCount, exportsCount: 0 };
  const result = evaluatePaywallTrigger('create_quote', usage, userPlan, 'quote_save');
  return result.shouldBlock ? result : null;
}

export function checkExportUpgradeTrigger(userPlan: string): PaywallTriggerResult | null {
  const usage: UsageStats = { invoicesCount: 0, quotesCount: 0, exportsCount: 1 };
  const result = evaluatePaywallTrigger('export_pdf', usage, userPlan, 'export_click');
  return result.shouldBlock ? result : null;
}

export function checkClientPortalUpgradeTrigger(userPlan: string): PaywallTriggerResult | null {
  const usage: UsageStats = { invoicesCount: 0, quotesCount: 0, exportsCount: 0 };
  const result = evaluatePaywallTrigger('client_portal', usage, userPlan, 'portal_click');
  return result.shouldBlock ? result : null;
}

export function checkSendInvoiceUpgradeTrigger(userPlan: string): PaywallTriggerResult | null {
  const usage: UsageStats = { invoicesCount: 0, quotesCount: 0, exportsCount: 0 };
  const result = evaluatePaywallTrigger('send_invoice', usage, userPlan, 'send_invoice_click');
  return result.shouldBlock ? result : null;
}
