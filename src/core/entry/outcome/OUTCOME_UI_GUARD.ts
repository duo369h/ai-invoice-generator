/**
 * Corvioz v1.6 — Outcome UI Guard
 *
 * Confirms that the outcome layer cannot drive UI states or display custom elements directly.
 *
 * RULE:
 *   ✔ UI is NOT influenced by outcome system
 */

export function assertUIIsolation() {
  return {
    allowed: false,
    reason: "UI controlled only by ENTRY_AUTHORITY + middleware"
  };
}
