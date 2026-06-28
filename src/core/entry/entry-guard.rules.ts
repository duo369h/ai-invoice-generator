/**
 * Corvioz v1.1 — Hard Enforcement Lint Rules
 *
 * Rules to detect and fail build on unauthorized entry decision patterns.
 */

export interface EntryGuardViolation {
  violation: string;
  file: string;
  severity: "CRITICAL";
}

export function checkFileRules(filename: string, content: string): EntryGuardViolation[] {
  const violations: EntryGuardViolation[] = [];

  // Skip the core entry-routing files and environment scripts
  const normalizedPath = filename.replace(/\\/g, '/');
  if (
    normalizedPath.includes("ENTRY_AUTHORITY") ||
    normalizedPath.includes("ENTRY_GOVERNANCE") ||
    normalizedPath.includes("ENTRY_SYSTEM_CONTRACT") ||
    normalizedPath.includes("ENTRY_LAYER_GUARD") ||
    normalizedPath.includes("ENTRY_AUDIT_LOG") ||
    normalizedPath.includes("ENTRY_FREEZE_FLAG") ||
    normalizedPath.includes("ENTRY_SYSTEM_BOUNDARY_MAP") ||
    normalizedPath.includes("ENTRY_OUTCOME_BARRIER") ||
    normalizedPath.includes("OUTCOME_EVOLUTION_LOCK") ||
    normalizedPath.includes("entry/outcome") ||
    normalizedPath.includes("entry-resolver") ||
    normalizedPath.includes("entry-priority") ||
    normalizedPath.includes("entry-consistency-check") ||
    normalizedPath.includes("entry-metrics") ||
    normalizedPath.includes("ENTRY_LEAK_DETECTOR") ||
    normalizedPath.includes("ENTRY_BOOT_CHECK") ||
    normalizedPath.includes("ENTRY_BUILD_GUARD") ||
    normalizedPath.includes("entry-guard.rules") ||
    normalizedPath.includes("entry/index.ts") ||
    normalizedPath.includes("node_modules") ||
    normalizedPath.includes(".next") ||
    normalizedPath.includes("scripts/")
  ) {
    return violations;
  }

  // 1. Detect ternary hasActivated ? route :
  if (/hasActivated\s*\?\s*[^:]+:[^;]+/.test(content)) {
    violations.push({
      violation: "Ternary expression 'hasActivated ? route :' detected.",
      file: filename,
      severity: "CRITICAL"
    });
  }

  // 2. Detect /dashboard direct navigation decisions bypassing ENTRY_AUTHORITY
  if (content.includes("hasActivated") && (content.includes("router.push('/dashboard')") || content.includes("router.replace('/dashboard')"))) {
    violations.push({
      violation: "Direct router redirection to '/dashboard' combined with local 'hasActivated' checks.",
      file: filename,
      severity: "CRITICAL"
    });
  }

  // 3. TierRouter conditional logic
  if (normalizedPath.includes("TierRouter") && (content.includes("plan") || content.includes("hasActivated") || content.includes("redirect"))) {
    violations.push({
      violation: "TierRouter containing conditional plan/activation routing logic.",
      file: filename,
      severity: "CRITICAL"
    });
  }

  // 4. Middleware custom branching logic
  if (normalizedPath.includes("middleware") && (content.includes("plan") || (content.includes("hasActivated") && !content.includes("ENTRY_AUTHORITY")))) {
    violations.push({
      violation: "Middleware containing custom plan/hasActivated branching bypassing ENTRY_AUTHORITY.",
      file: filename,
      severity: "CRITICAL"
    });
  }

  // 5. resolveEntry() usage bypassing ENTRY_AUTHORITY
  const allowedResolverCallers = ["page.js", "page.tsx", "route.js", "route.ts", "auth/page.js"];
  const isAllowedCaller = allowedResolverCallers.some(c => normalizedPath.endsWith(c));
  if (!isAllowedCaller && content.includes("resolveEntry")) {
    violations.push({
      violation: "Unauthorized usage of resolveEntry() instead of ENTRY_AUTHORITY().",
      file: filename,
      severity: "CRITICAL"
    });
  }

  return violations;
}
