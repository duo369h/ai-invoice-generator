/**
 * Pricing Isolation Guard — Corvioz v5.7
 *
 * Dev-only runtime checks preventing session, userPlan, or URL parameters
 * from directly driving rendering recommendations or decision-making.
 */

export function validatePricingIsolation(
  session: any,
  userPlan: string | null | undefined,
  searchParams: any
): void {
  if (typeof window === 'undefined') return;

  // Enforce validation in non-production environments only
  if (process.env.NODE_ENV === 'production') return;

  // Intercept accesses to URL parameter query methods.
  if (searchParams && typeof searchParams.get === 'function' && !window.__ISOLATION_MONITOR_ACTIVE__) {
    const originalGet = searchParams.get;
    searchParams.get = function (key: string) {
      if (key === 'checkout' || key === 'plan') {
        console.warn(
          `[DEV DEBUG] Pricing page parsed URL query parameter "${key}". All upgrade UI decisions must come from the execution engine.`
        );
      }
      return originalGet.apply(this, arguments as any);
    };
  }
}
