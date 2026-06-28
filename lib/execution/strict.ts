/**
 * Strict Isolation Validator — Corvioz v5.6.1
 *
 * Dev-only runtime guard to ensure zero pricing/UI decision leakage in frontend components.
 */

declare global {
  interface Window {
    __IN_UI_DECISION_ENGINE__?: boolean;
    __ISOLATION_MONITOR_ACTIVE__?: boolean;
  }
}

/**
 * Validates that the specified component is isolated from direct decision-making databases.
 * Throws console warnings if direct access to usage stats is detected outside getUIDecision.
 *
 * @param componentName - The component undergoing validation
 */
export function validateUIDecisionIsolation(componentName: string): void {
  if (typeof window === 'undefined') return;

  // Run only in development/non-production environments
  if (process.env.NODE_ENV === 'production') return;

  // Prevent multiple setup registrations
  if (window.__ISOLATION_MONITOR_ACTIVE__) return;
  window.__ISOLATION_MONITOR_ACTIVE__ = true;

  const forbiddenKeys = ['corvioz_usage_stats', 'corvioz_export_count', 'corvioz_client_portal_views'];

  const originalGetItem = window.localStorage.getItem;
  window.localStorage.getItem = function (key: string) {
    if (forbiddenKeys.includes(key) && !window.__IN_UI_DECISION_ENGINE__) {
      console.warn(
        `[UI DECISION VIOLATION DETECTED] Component "${componentName}" directly accessed localStorage key "${key}" outside the unified decision engine. All UI decisions must be resolved via getUIDecision().`
      );
    }
    return originalGetItem.apply(this, arguments as any);
  };
}
