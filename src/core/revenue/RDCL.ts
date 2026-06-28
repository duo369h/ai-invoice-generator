type RevenueEvent =
  | "invoice_created"
  | "invoice_sent"
  | "invoice_paid"
  | "quote_created";

type Signal =
  | "upgrade_signal"
  | "pricing_pressure_signal"
  | "usage_pressure_signal"
  | "value_realization_signal"
  | "conversion_signal";

type Action =
  | "UNLOCK_PREMIUM"
  | "SHOW_UPGRADE"
  | "LIMIT_USAGE"
  | "NO_ACTION";

function collectSignals(event: RevenueEvent, context: any): Signal[] {
  return [
    event === "invoice_created" && "usage_pressure_signal",
    event === "invoice_sent" && "conversion_signal",
    event === "invoice_paid" && "value_realization_signal"
  ].filter((s): s is Signal => typeof s === 'string');
}

function evaluate(signals: Signal[], context: any): Action {
  if (signals.includes("value_realization_signal")) {
    return "UNLOCK_PREMIUM";
  }
  if (signals.includes("conversion_signal")) {
    return "SHOW_UPGRADE";
  }
  if (signals.includes("usage_pressure_signal")) {
    return "LIMIT_USAGE";
  }
  return "NO_ACTION";
}

export function RDCL(event: RevenueEvent, context: any): Action {
  const signals = collectSignals(event, context);
  const decision = evaluate(signals, context);
  return decision;
}
