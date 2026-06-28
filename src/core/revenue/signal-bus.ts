/**
 * RDCL v3.2.2 — Signal Bus (PASSIVE CONSTANTS ONLY)
 *
 * Canonical signal name registry. No logic, no execution, no decisions.
 * RDCL reads these constants to match collected signals to actions.
 */

/** Canonical signal name constants */
export const SIGNALS = {
  UPGRADE: "upgrade_signal",
  USAGE:   "usage_signal",
  VALUE:   "value_signal",
  // Extended signal set
  USAGE_PRESSURE: "usage_pressure_signal",
  CONVERSION:     "conversion_signal",
  CHURN_RISK:     "churn_risk_signal",
  PRICING:        "pricing_pressure_signal",
  NO_ACTION:      "no_action",
} as const;

/** Optional signal weight metadata — consumed by scoring-model, not by RDCL directly */
export const SIGNAL_META: Record<string, { weight: number }> = {
  upgrade_signal:        { weight: 0.7 },
  usage_signal:          { weight: 0.4 },
  value_signal:          { weight: 1.0 },
  usage_pressure_signal: { weight: 0.8 },
  conversion_signal:     { weight: 0.6 },
  churn_risk_signal:     { weight: 0.5 },
  pricing_pressure_signal: { weight: 0.45 },
  no_action:             { weight: 0.0 },
};

