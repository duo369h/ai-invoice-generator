export function getBillingTrigger(eventType: string) {
  switch (eventType) {
    case 'invoice_paid':
      return {
        action: 'UNLOCK_PREMIUM',
        reason: 'user_has_paid_revenue_event',
      };
    case 'quote_created':
      return {
        action: 'LIMIT_USAGE',
        reason: 'pipeline_intensity_control',
      };
    case 'client_created':
      return {
        action: 'UPGRADE_SIGNAL',
        reason: 'ltv_anchor_created',
      };
    default:
      return null;
  }
}
