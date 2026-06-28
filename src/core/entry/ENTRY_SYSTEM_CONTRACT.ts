/**
 * Corvioz v1.4 — System Boundary Contract
 *
 * Defines static system boundaries and operational rules for entry architecture.
 */

export const ENTRY_SYSTEM_CONTRACT = {
  ENTRY_DECISION_LAYER: "ENTRY_AUTHORITY",
  ENTRY_EXECUTION_LAYER: "middleware",
  ENTRY_UI_LAYER: "dashboard",
  ENTRY_OBSERVATION_LAYER: "telemetry",
  ENTRY_SUGGESTION_LAYER: "intelligence",
  RULES: {
    decision_is_single_source: true,
    observation_is_read_only: true,
    suggestion_cannot_execute: true,
    ui_cannot_decide: true,
  }
};
