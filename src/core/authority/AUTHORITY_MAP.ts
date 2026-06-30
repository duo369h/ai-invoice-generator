/**
 * Corvioz v5.1 Authority Freeze
 *
 * This file declares ownership only. It must not import runtime engines,
 * execute decisions, read state, or alter production behavior.
 */

export type AuthorityDomain =
  | "user_plan"
  | "pricing"
  | "revenue_decision"
  | "paywall"
  | "feature_gate"
  | "export_permission"
  | "cta_resolution"
  | "authentication_state";

export type AuthorityMode =
  | "canonical"
  | "adapter"
  | "shadow"
  | "legacy_compatibility";

export type AuthorityOwner = Readonly<{
  domain: AuthorityDomain;
  canonicalOwner: string;
  canonicalPath: string;
  mode: AuthorityMode;
  shadowOwners: readonly string[];
  compatibilityRule: string;
  migrationRule: string;
}>;

export const AUTHORITY_MAP_VERSION = "v5.1-authority-freeze" as const;

export const AUTHORITY_MAP = Object.freeze({
  user_plan: Object.freeze({
    domain: "user_plan",
    canonicalOwner: "Server subscription and entitlement state",
    canonicalPath: "src/app/api/user/route.js + src/app/api/user/entitlements/route.js + lib/entitlements.ts",
    mode: "canonical",
    shadowOwners: Object.freeze([
      "localStorage:corvioz_user_plan",
      "localStorage:corvioz_user_plan_${userId}",
      "sessionStorage:corvioz_selected_plan",
      "src/hooks/useUserSubscription.js",
      "lib/execution/globalOrchestrator.ts",
      "lib/v8/brain/revenueIntelligence.ts",
    ]),
    compatibilityRule: "Legacy storage keys remain readable; they are not removed in v5.1.",
    migrationRule: "All new reads should go through src/core/state/planStateAdapter.ts before any collapse step.",
  }),
  pricing: Object.freeze({
    domain: "pricing",
    canonicalOwner: "Pricing API tier truth",
    canonicalPath: "src/app/api/pricing/route.js",
    mode: "canonical",
    shadowOwners: Object.freeze([
      "src/core/pricing/pricingViewModel.ts",
      "src/core/pricing/pricingController.ts",
      "src/core/pricing/PRICING_CORE_ENGINE.ts",
      "src/app/lib/revenue/dynamic-pricing.ts",
      "src/app/lib/optimization/pricing-optimizer.ts",
    ]),
    compatibilityRule: "View models and controllers can adapt pricing; they must not become independent pricing truth.",
    migrationRule: "Collapse display values to API-derived tier data after parity validation.",
  }),
  revenue_decision: Object.freeze({
    domain: "revenue_decision",
    canonicalOwner: "Revenue control plane",
    canonicalPath: "src/app/lib/revenue/control-plane/decision-engine.ts + src/app/api/revenue/control-plane/route.ts",
    mode: "canonical",
    shadowOwners: Object.freeze([
      "src/app/lib/revenue/revenue-decision-engine.ts",
      "src/core/revenue/decision-engine.ts",
      "src/core/revenue/RDCL.ts",
      "lib/monetization/revenue-decision-engine.ts",
      "src/core/revenue/v2/*",
      "src/core/revenue/v3/*",
    ]),
    compatibilityRule: "Existing engines remain callable and must not be deleted or bypassed in v5.1.",
    migrationRule: "Route new read-only decision consumers through src/core/decision/decisionAdapter.ts.",
  }),
  paywall: Object.freeze({
    domain: "paywall",
    canonicalOwner: "Revenue control plane paywall decision",
    canonicalPath: "src/app/api/revenue/control-plane/route.ts",
    mode: "canonical",
    shadowOwners: Object.freeze([
      "lib/paywall/paywallEngine.ts",
      "src/app/lib/revenue/paywall-engine.ts",
      "src/app/lib/revenue/revenue-decision-engine.ts",
      "src/app/api/revenue/evaluate/route.js",
    ]),
    compatibilityRule: "Legacy paywall helpers remain functional; server/control-plane decisions are final after migration.",
    migrationRule: "Compare paywall outcomes in shadow before replacing any caller.",
  }),
  feature_gate: Object.freeze({
    domain: "feature_gate",
    canonicalOwner: "Server API guards and entitlement mapping",
    canonicalPath: "lib/entitlements.ts + protected src/app/api/* routes",
    mode: "canonical",
    shadowOwners: Object.freeze([
      "UI disabled states",
      "local paywall helpers",
      "client-side route guards",
      "src/app/lib/revenue/control-plane/decision-engine.ts",
    ]),
    compatibilityRule: "UI gates are presentation hints only and must not be treated as authoritative.",
    migrationRule: "Keep server route guards authoritative before collapsing UI hints.",
  }),
  export_permission: Object.freeze({
    domain: "export_permission",
    canonicalOwner: "PDF export API",
    canonicalPath: "src/app/api/pdf/export/route.js",
    mode: "canonical",
    shadowOwners: Object.freeze([
      "src/app/lib/pdf.js",
      "src/app/lib/revenue/useRevenueDecision.ts",
      "src/app/api/revenue/control-plane/route.ts",
      "lib/paywall/paywallEngine.ts",
    ]),
    compatibilityRule: "Clients may request exports; final permission and PDF generation stay server-side.",
    migrationRule: "Keep export permission final in the API and compare UI-hook intent only.",
  }),
  cta_resolution: Object.freeze({
    domain: "cta_resolution",
    canonicalOwner: "Global CTA interpreter",
    canonicalPath: "lib/execution/globalOrchestrator.ts",
    mode: "adapter",
    shadowOwners: Object.freeze([
      "src/core/pricing/pricingViewModel.ts",
      "lib/kernel/corviozKernel.ts",
      "src/app/pricing/page.js",
      "revenue action handlers",
    ]),
    compatibilityRule: "CTA copy can stay in legacy owners while v5.1 exposes a single read adapter.",
    migrationRule: "CTA resolution should consume canonical plan/revenue/pricing state, not own those states.",
  }),
  authentication_state: Object.freeze({
    domain: "authentication_state",
    canonicalOwner: "Supabase session and authenticated API context",
    canonicalPath: "src/app/lib/supabase-client.js + src/app/lib/supabase.js + API auth guards",
    mode: "canonical",
    shadowOwners: Object.freeze([
      "localStorage draft state",
      "sessionStorage redirect state",
      "client-only isAuthenticated booleans",
    ]),
    compatibilityRule: "Client auth booleans can drive rendering, but server routes remain final.",
    migrationRule: "Plan and entitlement reads must be tied to authenticated server state before engine collapse.",
  }),
} satisfies Record<AuthorityDomain, AuthorityOwner>);

export function getAuthorityOwner(domain: AuthorityDomain): AuthorityOwner {
  return AUTHORITY_MAP[domain];
}

export function listAuthorityOwners(): AuthorityOwner[] {
  return Object.values(AUTHORITY_MAP);
}
