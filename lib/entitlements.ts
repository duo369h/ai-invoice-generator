// This is NOT a feature hierarchy system.
// This is a revenue track system.
// Each tier is an independent product experience.
// No cross-tier dependency is allowed.

import { shadowValidatePlanRead } from "../src/core/state/planStateAdapter";
import { recordDecisionTelemetry } from "../src/core/telemetry/decisionTelemetry";

export interface Entitlements {
  invoice: boolean;
  quote: boolean;
  export_pdf: boolean;
  pdf_branding: "branded" | "clean";
  client_portal: boolean;
  client_approval: boolean;
  approval_scope: "quotes_only" | "none";
  crm: boolean;
  automation: boolean;
  advanced_invoicing: boolean;
  unlimited_invoices: boolean;
}

/** All plan keys considered "paid" (non-free). */
export const PAID_PLANS = ["starter", "pro", "studio"] as const;

/** Returns true if the given plan string is a paid tier. */
export function isPaidPlan(plan?: string | null): boolean {
  return PAID_PLANS.includes(String(plan || "").toLowerCase() as any);
}

export function getUserEntitlements(userPlan?: string | null): Entitlements {
  const plan = String(userPlan || "free").toLowerCase();
  if (process.env.NODE_ENV !== "production") {
    shadowValidatePlanRead(
      "entitlements.userPlan",
      plan,
      { explicitPlan: plan },
      "lib/entitlements.ts:getUserEntitlements",
      console,
    );
  }

  // Starter ($9 plan / $90 yearly): 30 documents per cycle, clean PDF
  if (plan === "starter") {
    const result: Entitlements = {
      invoice: true,
      quote: true,
      export_pdf: true,
      pdf_branding: "clean",
      client_portal: false,
      client_approval: false,
      approval_scope: "none",
      crm: false,
      automation: false,
      advanced_invoicing: false,
      unlimited_invoices: false,
    };
    recordDecisionTelemetry({
      source: "lib/entitlements.ts:getUserEntitlements",
      decisionType: "feature gating",
      legacyOutput: result,
      adapterOutput: { plan, entitlements: result },
      tags: ["FEATURE_GATE", "LOG_ONLY", "v5.2.1"],
    });
    return result;
  }

  // Pro ($19 plan / $190 yearly): Unlimited documents, clean PDF, Client Portal, Client Approval (quotes only)
  if (plan === "pro") {
    const result: Entitlements = {
      invoice: true,
      quote: true,
      export_pdf: true,
      pdf_branding: "clean",
      client_portal: true,
      client_approval: true,
      approval_scope: "quotes_only",
      crm: true,
      automation: false,
      advanced_invoicing: true,
      unlimited_invoices: true,
    };
    recordDecisionTelemetry({
      source: "lib/entitlements.ts:getUserEntitlements",
      decisionType: "feature gating",
      legacyOutput: result,
      adapterOutput: { plan, entitlements: result },
      tags: ["FEATURE_GATE", "EXPORT_PERMISSION", "LOG_ONLY", "v5.2.1"],
    });
    return result;
  }

  // Studio plan: Legacy compatibility retention
  if (plan === "studio") {
    const result: Entitlements = {
      invoice: true,
      quote: true,
      export_pdf: true,
      pdf_branding: "clean",
      client_portal: true,
      client_approval: true,
      approval_scope: "quotes_only",
      crm: true,
      automation: true,
      advanced_invoicing: true,
      unlimited_invoices: true,
    };
    recordDecisionTelemetry({
      source: "lib/entitlements.ts:getUserEntitlements",
      decisionType: "feature gating",
      legacyOutput: result,
      adapterOutput: { plan, entitlements: result },
      tags: ["FEATURE_GATE", "EXPORT_PERMISSION", "LOG_ONLY", "v5.2.1"],
    });
    return result;
  }

  // Default / "free": 5 documents per cycle, branded PDF
  const result: Entitlements = {
    invoice: true,
    quote: true,
    export_pdf: true,
    pdf_branding: "branded",
    client_portal: false,
    client_approval: false,
    approval_scope: "none",
    crm: false,
    automation: false,
    advanced_invoicing: false,
    unlimited_invoices: false,
  };
  recordDecisionTelemetry({
    source: "lib/entitlements.ts:getUserEntitlements",
    decisionType: "feature gating",
    legacyOutput: result,
    adapterOutput: { plan, entitlements: result },
    tags: ["FEATURE_GATE", "EXPORT_PERMISSION", "LOG_ONLY", "v5.2.1"],
  });
  return result;
}

export async function canAccess(userId: string, feature: string): Promise<boolean> {
  if (!userId) return false;

  // 1. Client-side Check
  if (typeof window !== "undefined") {
    try {
      const { createBrowserSupabaseClient } = require("../src/app/lib/supabase-client");
      const supabase = createBrowserSupabaseClient();
      if (supabase) {
        const { data } = await supabase
          .from("entitlements")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (data && feature in data) {
          return !!data[feature];
        }
      }
    } catch (err) {
      console.warn("Direct client entitlements check failed, falling back to API fetch:", err);
    }

    try {
      const res = await fetch(`/api/user/entitlements?feature=${encodeURIComponent(feature)}`);
      if (res.ok) {
        const result = await res.json();
        return !!result.access;
      }
    } catch (err) {
      console.error("API fallback for canAccess failed:", err);
    }
    return false;
  }

  // 2. Server-side Check (Node.js API routes)
  try {
    const { createServiceSupabaseClient } = require("../src/app/lib/supabase");
    const supabase = createServiceSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from("entitlements")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (data && feature in data) {
        return !!data[feature];
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", userId)
        .maybeSingle();
      if (profile) {
        const plan = String(profile.plan || "free").toLowerCase();
        const mapped = getUserEntitlements(plan);
        return !!mapped[feature as keyof Entitlements];
      }
    }
  } catch (err) {
    console.error("Server-side canAccess check error:", err);
  }

  return false;
}
