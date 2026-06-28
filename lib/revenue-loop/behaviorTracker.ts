/**
 * Revenue Optimization Loop - Behavior Tracker — Corvioz v8
 *
 * Tracks, logs, and retrieves user interaction signals (invoices, clients, views, exports)
 * from client-side storage and contextual overrides.
 */

export interface BehaviorSignals {
  invoicesCreated: number;
  clientsCreated: number;
  pricingViewed: number;
  exportPdf: number;
}

/**
 * Retrieves the current tracked behavior signals for the user.
 */
export function getBehaviorSignals(context: any): BehaviorSignals {
  // SSR Safety Check
  if (typeof window === 'undefined') {
    return { invoicesCreated: 0, clientsCreated: 0, pricingViewed: 0, exportPdf: 0 };
  }

  let invoicesCreated = 0;
  let clientsCreated = 0;
  try {
    const stats = JSON.parse(window.localStorage.getItem('corvioz_usage_stats') || '{}');
    invoicesCreated = Number(stats.invoicesCount || 0);
    clientsCreated = Number(stats.clientsCount || 0);
  } catch (_) {}

  let exportPdf = Number(window.localStorage.getItem('corvioz_export_count') || 0);

  // Check context usageStats overrides
  const ctxInvoices = context?.usageStats?.invoicesCount || context?.usageStats?.invoice_count;
  if (typeof ctxInvoices === 'number') {
    invoicesCreated = ctxInvoices;
  }

  const ctxClients = context?.usageStats?.clientsCount || context?.usageStats?.client_count;
  if (typeof ctxClients === 'number') {
    clientsCreated = ctxClients;
  }

  const ctxExports = context?.usageStats?.exportsCount || context?.usageStats?.export_count;
  if (typeof ctxExports === 'number') {
    exportPdf = ctxExports;
  }

  // Fallback pricing view count
  const pricingViewed = Number(window.localStorage.getItem('corvioz_pricing_view_count') || 0);

  return {
    invoicesCreated,
    clientsCreated,
    pricingViewed,
    exportPdf,
  };
}

/**
 * Logs and increments a specific user behavior signal.
 */
export function trackUserAction(action: 'invoice_created' | 'client_created' | 'pricing_viewed' | 'export_pdf'): void {
  if (typeof window === 'undefined') return;
  console.log(`[REVENUE_LOOP_TRACKER] Tracking action: ${action}`);
  try {
    if (action === 'invoice_created' || action === 'client_created') {
      const stats = JSON.parse(window.localStorage.getItem('corvioz_usage_stats') || '{}');
      const key = action === 'invoice_created' ? 'invoicesCount' : 'clientsCount';
      stats[key] = (Number(stats[key]) || 0) + 1;
      window.localStorage.setItem('corvioz_usage_stats', JSON.stringify(stats));
    } else if (action === 'export_pdf') {
      const current = Number(window.localStorage.getItem('corvioz_export_count') || 0);
      window.localStorage.setItem('corvioz_export_count', String(current + 1));
    } else if (action === 'pricing_viewed') {
      const current = Number(window.localStorage.getItem('corvioz_pricing_view_count') || 0);
      window.localStorage.setItem('corvioz_pricing_view_count', String(current + 1));
    }
  } catch (err) {
    console.error('[REVENUE_LOOP_TRACKER] Failed to update action count:', err);
  }
}
