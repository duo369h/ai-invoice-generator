export function getRevenueReaction(eventType: string) {
  switch (eventType) {
    case 'invoice_created':
    case 'invoice_sent':
    case 'invoice_paid':
    case 'quote_created':
      return { signal: "upgrade_signal", source: "reaction-engine" };
    default:
      return { signal: "no_action", source: "reaction-engine" };
  }
}
