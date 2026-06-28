/**
 * Corvioz v1.4 — Layer Isolation Guard
 *
 * Prevents cross-layer contamination by verifying runtime interaction boundaries.
 */

export function assertLayerIntegrity(layer: string, action: string) {
  const violations = [
    "telemetry→decision",
    "intelligence→routing",
    "ui→decision",
    "middleware→decision"
  ];
  const key = `${layer}→${action}`;
  if (violations.includes(key)) {
    throw new Error("ENTRY LAYER VIOLATION: " + key);
  }
}
