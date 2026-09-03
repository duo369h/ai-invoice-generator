// Canonical product authority for newly created Quotes and Invoices.
// Quote and Invoice creation share this one counter per billing cycle.
export const COMBINED_DOCUMENT_LIMITS = Object.freeze({
  free: 5,
  starter: 30,
  pro: 100,
});

export function getCombinedDocumentLimit(plan) {
  const normalizedPlan = String(plan || 'free').toLowerCase();
  if (normalizedPlan === 'agency' || normalizedPlan === 'studio') return null;
  return COMBINED_DOCUMENT_LIMITS[normalizedPlan] ?? COMBINED_DOCUMENT_LIMITS.free;
}
