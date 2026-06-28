/**
 * Corvioz — UI Data Aggregator
 *
 * Normalizes raw input data into structured, typings-compliant workspace records.
 *
 * ❌ Must NOT perform business calculations, scoring, win-rate calculations,
 *    ratios, or ranking.
 */

export type NormalizedData = {
  rawLeads: any[];
  rawInvoices: any[];
  rawQuotes: any[];
  rawActivity: any[];
  userId: string;
  activeProfile: any;
  businessModeBadge: any;
};

export function aggregateUIData(rawData: any = {}): NormalizedData {
  const rawInvoices = Array.isArray(rawData?.invoices) ? rawData.invoices : [];
  const rawQuotes = Array.isArray(rawData?.quotes) ? rawData.quotes : [];
  const rawLeads = Array.isArray(rawData?.leads) ? rawData.leads : [];

  return {
    rawLeads,
    rawInvoices,
    rawQuotes,
    rawActivity: [...rawInvoices, ...rawQuotes],
    userId: rawData?.userId || "local-dashboard-user",
    activeProfile: rawData?.activeProfile || null,
    businessModeBadge: rawData?.businessModeBadge || null,
  };
}
