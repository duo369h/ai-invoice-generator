/**
 * Corvioz v1.5 — Activation Friction Hotspot Map
 *
 * Tracks drop-off checkpoints and hesitations during early onboarding journey steps.
 *
 * RULE:
 *   ✔ analytics only
 *   ✔ no intervention logic
 */

export const ENTRY_FRICTION_MAP = {
  hotspots: [
    { step: "dashboard_load", friction: 0.8 },
    { step: "invoice_creation", friction: 0.3 }
  ]
};
