export type RevenueState =
  | 'engagement'
  | 'conversion_intent'
  | 'revenue_realized'
  | 'pipeline_value'
  | 'ltv_anchor';

export function getRevenueState(eventType: string): RevenueState {
  const map: Record<string, RevenueState> = {
    invoice_created: 'engagement',
    invoice_sent: 'conversion_intent',
    invoice_paid: 'revenue_realized',
    quote_created: 'pipeline_value',
    client_created: 'ltv_anchor',
  };
  return map[eventType] || 'engagement';
}
