/**
 * Corvioz — UI Signal Normalizer
 *
 * Translates raw/normalized workspace state and revenue intelligence
 * outputs into standardized UIRevenueSignals.
 */

import { getRevenueIntelligence } from "../../revenue/REVENUE_INTELLIGENCE_ENGINE.ts";
import type { UIRevenueSignal } from "./UI_RUNTIME_DECISION_ENGINE.ts";

export function normalizeUISignal(rawData: any = {}): UIRevenueSignal {
  const intel = getRevenueIntelligence(rawData);
  const quotes = Array.isArray(rawData?.quotes) ? rawData.quotes : [];
  const leads = Array.isArray(rawData?.leads) ? rawData.leads : [];
  const invoices = Array.isArray(rawData?.invoices) ? rawData.invoices : [];

  // ── Conversion Drop Derivation ──
  // If we have several quotes but zero approved/won quotes, signal a conversion drop
  const wonStates = ["won", "approved", "accepted", "converted", "paid"];
  const hasWonQuotes = quotes.some((q: any) => wonStates.includes(String(q?.status || "").toLowerCase()));
  const conversionDrop = quotes.length > 2 && !hasWonQuotes;

  // ── Engagement Decay Derivation ──
  // Low active client communication, no leads or quotes
  const engagementDecay = leads.length === 0 && quotes.length === 0;

  // ── Churn Risk Derivation ──
  const unpaidInvoices = invoices.filter((i: any) => String(i?.status || "").toLowerCase() !== "paid");
  const churnRisk = unpaidInvoices.length > 4
    ? "HIGH"
    : unpaidInvoices.length > 1
      ? "MEDIUM"
      : "LOW";

  return {
    revenueProbability: intel.revenueProbability,
    conversionDrop,
    engagementDecay,
    churnRisk,
  };
}
