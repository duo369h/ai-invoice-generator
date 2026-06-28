export function getPricingSensitivity(userEvents: any[]) {
  if (!Array.isArray(userEvents)) {
    return {
      signal: "pricing_pressure_signal",
      value: "low",
      source: "pricing-sensitivity"
    };
  }

  const eventTypes = userEvents.map(e => e.event_type || e.type || e);
  const paidCount = eventTypes.filter(t => t === 'invoice_paid').length;
  const clientCount = eventTypes.filter(t => t === 'client_created').length;
  const quoteCount = eventTypes.filter(t => t === 'quote_created').length;

  let val = "low";
  if (paidCount >= 3 || clientCount >= 3) {
    val = "high";
  } else if (quoteCount >= 2 || paidCount > 0) {
    val = "medium";
  }

  return {
    signal: "pricing_pressure_signal",
    value: val,
    source: "pricing-sensitivity"
  };
}
