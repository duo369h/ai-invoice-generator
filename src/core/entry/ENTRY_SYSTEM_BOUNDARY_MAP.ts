/**
 * Corvioz v1.6 — Entry System Boundary Map
 *
 * Defines capability boundaries between core entry systems and the outcome observation layer.
 */

export const ENTRY_SYSTEM_BOUNDARY_MAP = {
  ENTRY: {
    can_decide: true,
    can_execute: true,
    can_mutate: false
  },
  OUTCOME: {
    can_decide: false,
    can_execute: false,
    can_mutate: false,
    can_observe: true
  }
};
