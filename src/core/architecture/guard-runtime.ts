/*
CORVIOZ ARCHITECTURE GUARANTEE v2.6
ONLY THIS MODULE CAN ENFORCE RULES
NO CROSS-LAYER LOGIC ALLOWED
NO BUSINESS INFERENCE IN RUNTIME
*/

/**
 * Enforces runtime architecture boundaries strictly.
 * Throws an Error immediately with no fallback if caller violates restrictions.
 */
export function enforceLayerBoundary(layer: string, caller: string, target?: string) {
  const forbidden: Record<string, string[]> = {
    UI: ["analytics", "intelligence"],
    analytics: ["ui", "backend", "intelligence"],
    backend: ["ui", "analytics-intent"],
    intelligence: ["ui", "analytics", "runtime"]
  };

  if (forbidden[layer]?.includes(caller)) {
    const errorMsg = `ARCHITECTURE VIOLATION: Caller '${caller}' cannot access Layer '${layer}' (Target: ${target || 'unknown'})`;
    console.error(`[ARCH GUARD COLD CRASH] ${errorMsg}`);
    
    // Always throw immediately on violation
    throw new Error(errorMsg);
  }
}
