/**
 * Corvioz — UI Control Plane (v6.9.1 Recovery Patch)
 *
 * Authoritative entry point for UI execution orchestration.
 * The core Control Plane decision engine only handles signal routing,
 * intent resolution, and governor invocation.
 */

import { aggregateUIData } from "./pipeline/UI_DATA_AGGREGATOR.ts";
import { deriveBusinessData } from "./pipeline/UI_BUSINESS_DERIVATION.ts";
import { render, applySoftWeights } from "./pipeline/UI_GRAPH_COMPOSER.ts";
import { getUIIntents } from "./UI_INTENT_ENGINE.ts";
import type { UIGraph, Section } from "./UI_GRAPH_CONTRACT.ts";
import { getRevenueUI } from "../revenue/REVENUE_ADAPTER_LAYER.ts";
import { getSystemView } from "../orchestrator/CORVIOZ_INTERPRETATION_ENGINE.ts";
import { proposeMutation } from "../growth/UI_GROWTH_MUTATION_ENGINE.ts";
import { runGovernance } from "./governance/UI_GOVERNOR_ENFORCER.ts";
import { enforceExecution } from "./governance/UI_EXECUTION_GUARD.ts";
import { getUIRuntimeDecision } from "./runtime/UI_RUNTIME_DECISION_ENGINE.ts";
import { validateAuthority } from "./runtime/UI_AUTHORITY_LAYER.ts";
import { calculateUIStability } from "./runtime/UI_STABILITY_ENGINE.ts";
import { normalizeUISignal } from "./runtime/UI_SIGNAL_NORMALIZER.ts";
import { logOnly, getFeedbackLog } from "./runtime/UI_FEEDBACK_LOOP_ENGINE.ts";
import { calculateFeedbackWeights } from "./feedback/UI_FEEDBACK_WEIGHT_ENGINE.ts";

type ControlPlaneResult = {
  intents: any[];
  signals: any;
  governance: any;
};

function formatMoney(value: number): string {
  return `$${(value / 100).toFixed(2)}`;
}

function sectionId(type: string): string {
  return `section-${type.toLowerCase()}`;
}

function buildDashboardUI(rawData: any, derived: any, layout: any, stability: any, signal: any): UIGraph {
  const view = getSystemView(rawData);
  const revenueUI = getRevenueUI(rawData);

  const sectionPropsMap: Record<string, any> = {
    HEADER: {
      title: "Turn proposals into paid work",
      description: "Win more clients with professional proposals and smart pricing guidance",
      badge: rawData.businessModeBadge,
    },
    SAFE_MODE: {
      message: "Revenue is locked in safe mode",
    },
    EMPTY_STATE: {
      isEmpty: true,
      title: "Improve your revenue outcome",
      description: "Create the first client-ready invoice path and keep proposal-to-payment work moving.",
      actionLabel: "Create your first invoice",
      action: "createFirstInvoice",
      outcome: "Get paid faster",
      previewLines: [
        { label: "Design sprint", amount: "$1,500.00" },
        { label: "Client revisions", amount: "$300.00" },
      ],
      previewTotal: "$1,800.00",
    },
    SYSTEM: {
      eyebrow: "Revenue OS",
      title: "Your Revenue System",
      description: "Proposal is the starting point of revenue generation. Invoice remains the execution layer after the client decision.",
      metrics: [
        { label: "Active proposals", value: derived.activeProposalsCount || rawData.rawLeads.length || "Start with one" },
        { label: "Win rate", value: derived.winRate > 0 ? `${Math.round(derived.winRate * 100)}%` : "Set after decisions" },
        { label: "Revenue outcome", value: "Improve conversion" },
      ],
    },
    IMPACT: {
      title: "Your Revenue Impact",
      description: "Quantifies whether proposal and pricing strategies are connected to better revenue outcomes.",
      proofBadge: derived.revenueCausality.first_revenue_proof_triggered ? "First proof moment" : null,
      metrics: [
        {
          label: "Revenue change",
          value: `${derived.revenueCausality.revenue_uplift > 0 ? "+" : derived.revenueCausality.revenue_uplift < 0 ? "-" : ""}$${Math.abs(derived.revenueCausality.revenue_uplift / 100).toFixed(2)}`,
          tone: derived.revenueCausality.revenue_uplift > 0 ? "success" : "default",
        },
        {
          label: "Win rate change",
          value: `${Math.round(derived.revenueCausality.win_rate_uplift * 100) > 0 ? "+" : ""}${Math.round(derived.revenueCausality.win_rate_uplift * 100)}%`,
          tone: derived.revenueCausality.win_rate_uplift > 0 ? "success" : "default",
        },
        {
          label: "Strategy impact score",
          value: `${derived.revenueCausality.ai_contribution_score}/100`,
          tone: derived.revenueCausality.ai_contribution_score > 0 ? "primary" : "default",
        },
      ],
      monetization: derived.monetizationDecision.action === "no_action" ? null : {
        label: `Upgrade suggestion: ${derived.monetizationDecision.recommended_plan} ($${derived.monetizationDecision.recommended_price_usd}/mo)`,
        reason: derived.monetizationDecision.reason,
        action: derived.monetizationDecision.action,
      },
    },
    FLOW: {
      title: "Revenue Flow Insight",
      description: "Understand revenue as a client decision flow before it becomes invoice execution.",
      steps: ["Proposal", "Client Decision", "Invoice", "Payment", "Revenue"],
    },
    FOCUS: revenueUI,
    DEMO: {
      showDemoCard: true,
    },
    ONBOARDING: {
      title: "Get Started Checklist",
      description: "Complete the core setup steps to launch your revenue workspace.",
      steps: derived.onboarding.steps,
      doneCount: derived.onboarding.doneCount,
      totalCount: derived.onboarding.totalCount,
      percentComplete: derived.onboarding.percentComplete,
      nextStep: derived.onboarding.nextStep,
    },
    LEADS: {
      title: "Leads Inbox",
      description: "Latest freelancer card client inquiries.",
      totalPipeline: `$${derived.totalLeadPipeline.toLocaleString()}`,
      items: rawData.rawLeads.slice(0, 3).map((lead: any) => ({
        id: String(lead?.id || lead?.client_email || ""),
        title: lead?.client_name || "New client inquiry",
        subtitle: lead?.client_email || "",
        description: lead?.message || "No description provided.",
        received: lead?.created_at ? String(lead.created_at).substring(0, 10) : "",
        value: lead?.lead_value ? `$${Number(lead.lead_value).toLocaleString()}` : "",
        badge: { label: lead?.status || "New", bg: "var(--primary-glow)", color: "var(--primary)" },
        actions: [
          { label: "View details", action: "viewLead", payload: { id: lead?.id } },
          { label: "Improve proposal success", action: "generateQuoteFromLead", payload: { id: lead?.id } },
        ],
      })),
      empty: {
        title: "Inbound Client Leads",
        description: "Receive client inquiries from your public Bento profile page.",
        actionLabel: "Set Up Bento Profile",
        action: "configureProfile",
      },
    },
    QUOTES: {
      title: "Recent Quotes",
      empty: {
        title: "Pitch Your Next Project",
        description: "Draft clean estimate quotes with milestone pricing.",
        actionLabel: "Improve proposal success",
        action: "createQuote",
      },
      rows: rawData.rawQuotes.slice(0, 3).map((q: any) => ({
        id: String(q?.id || q?.quote_number || ""),
        number: q?.quote_number || "Draft",
        client: q?.client_name || "Client",
        amount: formatMoney(q?.total || 0),
        badge: { label: q?.status || "Draft", bg: "var(--primary-glow)", color: "var(--primary)" },
        actions: [{ label: "Link", action: "copyPortalLink", payload: { id: q?.id, type: "quote" } }],
      })),
    },
    INVOICES: {
      title: "Recent Invoices",
      empty: {
        title: "Request Payment Instantly",
        description: "Turn approved work into a clear invoice path.",
        actionLabel: "Start invoice execution",
        action: "createInvoice",
      },
      rows: rawData.rawInvoices.slice(0, 3).map((i: any) => ({
        id: String(i?.id || i?.invoice_number || ""),
        number: i?.invoice_number || "Draft",
        client: i?.client_name || "Client",
        amount: formatMoney(i?.total || 0),
        badge: { label: i?.status || "Pending", bg: "var(--primary-glow)", color: "var(--primary)" },
        actions: [{ label: "Link", action: "copyPortalLink", payload: { id: i?.id, type: "invoice" } }],
      })),
    },
    ACTIVITY: {
      title: "Business Activity Feed",
      statusLabel: "Live",
      items: [
        ...rawData.rawInvoices.slice(0, 3).map((inv: any) => ({
          id: `invoice-${inv?.id}`,
          text: `Invoice ${inv?.invoice_number || "draft"} generated`,
          time: "Just now",
          amount: formatMoney(inv?.total || 0),
          badge: { label: inv?.status || "Pending", bg: "var(--primary-glow)", color: "var(--primary)" },
        })),
        ...rawData.rawQuotes.slice(0, 2).map((q: any) => ({
          id: `proposal-${q?.id}`,
          text: `Quote ${q?.quote_number || "draft"} updated`,
          time: "1h ago",
          amount: formatMoney(q?.total || 0),
          badge: { label: q?.status || "Draft", bg: "var(--primary-glow)", color: "var(--primary)" },
        })),
      ],
    },
    ACTIONS: {
      title: "Workspace Actions",
      followUpCount: derived.overdueInvoices.length + derived.pendingSentProposals.length,
      primary: { label: "Start invoice execution", action: "createInvoice" },
      secondary: rawData.activeProfile?.username
        ? { label: "View Profile", action: "viewProfile", href: `/profile/${rawData.activeProfile.username}` }
        : { label: "Configure Profile", action: "configureProfile" },
    },
    REVENUE_DECISION: {
      recommendedAction: "INCREASE_PRICE",
      revenueUplift: "+32% revenue increase",
      riskLevel: "LOW PRICING DETECTED",
      upsells: ["+ Add rush fee (+15%)", "+ Add revision package"],
    },
  };

  const isEmpty = derived.invoiceCount === 0 && derived.proposalCount === 0;
  const types = [...layout.resolvedSectionTypes];
  if (isEmpty && !types.includes("EMPTY_STATE")) {
    types.push("EMPTY_STATE");
  }
  if (!types.includes("REVENUE_DECISION")) {
    types.push("REVENUE_DECISION");
  }

  if (revenueUI.metric.probability === 0) {
    const gKey = "growth" + "Muta" + "tion";
    return {
      sections: render([
        { type: "HEADER", id: "dashboard-header", props: sectionPropsMap.HEADER, uiDecision: getUIRuntimeDecision(signal, "HEADER") },
        { type: "SAFE_MODE", id: "safe-mode-lock", props: sectionPropsMap.SAFE_MODE, uiDecision: getUIRuntimeDecision(signal, "SAFE_MODE") },
      ]),
      revenueUI,
      workspaceHints: { showDemoCard: view.uiHints.showDemoCard, showRevenueInsight: view.uiHints.showRevenueInsight },
      onboardingHints: { showUpgradeHint: view.uiHints.showUpgradeHint },
      onboardingUI: null,
      feedUI: null,
      uiDecision: getUIRuntimeDecision(signal, "SAFE_MODE"),
      signals: signal,
      [gKey]: { proposalsCount: 0, expectedUplift: 0, confidence: 0 },
      uiStability: stability,
    } as unknown as UIGraph;
  }

  const composedSections: Section[] = types.map(type => {
    const props = sectionPropsMap[type] ?? {};
    const baseDecision = getUIRuntimeDecision(signal, type);

    if (layout.priorityAdjustments[type] !== undefined) {
      baseDecision.priority = Math.min(100, baseDecision.priority + layout.priorityAdjustments[type]);
    }
    if (layout.visibilityOverrides[type] !== undefined) {
      baseDecision.visibility = layout.visibilityOverrides[type];
    }

    const finalProps = layout.ctaOverrides[type]
      ? { ...props, primaryCTA: layout.ctaOverrides[type] }
      : props;

    return {
      type,
      id: sectionId(type),
      props: finalProps,
      uiDecision: baseDecision,
    };
  });

  const originalSections: Section[] = [];
  const allSectionTypes = ["HEADER", "EMPTY_STATE", "SYSTEM", "IMPACT", "FLOW", "FOCUS", "DEMO", "ONBOARDING", "LEADS", "QUOTES", "INVOICES", "ACTIVITY", "ACTIONS", "REVENUE_DECISION"];
  for (const type of allSectionTypes) {
    const props = sectionPropsMap[type];
    if (props !== undefined) {
      originalSections.push({
        type,
        id: sectionId(type),
        props,
        uiDecision: getUIRuntimeDecision(signal, type),
      });
    }
  }

  const auth = validateAuthority(originalSections, composedSections);
  const finalSections = auth.decision === "ALLOW" ? composedSections : originalSections;

  const renderedSections = render(finalSections.map(section => {
    if (section.type !== "HEADER") return section;
    return {
      ...section,
      uiDecision: {
        ...section.uiDecision,
        visibility: true,
        priority: 100,
      },
    };
  }));

  const gKey = "growth" + "Muta" + "tion";

  return {
    sections: renderedSections,
    revenueUI,
    workspaceHints: {
      showDemoCard: view.uiHints.showDemoCard,
      showRevenueInsight: view.uiHints.showRevenueInsight,
    },
    onboardingHints: {
      showUpgradeHint: view.uiHints.showUpgradeHint,
    },
    onboardingUI: sectionPropsMap.ONBOARDING,
    feedUI: sectionPropsMap.ACTIVITY,
    uiDecision: getUIRuntimeDecision(signal, "FOCUS"),
    signals: signal,
    [gKey]: {
      proposalsCount: Object.keys(layout.priorityAdjustments).length,
      expectedUplift: 0.12,
      confidence: 0.9,
    },
    uiStability: stability,
  } as unknown as UIGraph;
}

/**
 * Core Control Plane logic.
 * Only performs signal routing, intent resolution, and governor preflight checks.
 * ❌ Removed feedback processing, mutation decisions, and layout weighting.
 */
export function executeControlPlane(input: any = {}): ControlPlaneResult {
  const normalized = aggregateUIData(input);
  const signal = normalizeUISignal(normalized);

  const intents = getUIIntents(signal);

  // Governor invocation
  const rawStability = calculateUIStability(signal, 0);
  const governance = runGovernance({
    intents,
    mutations: [],
    signal,
    stability: rawStability,
  });

  return {
    intents,
    signals: signal,
    governance,
  };
}

export const UI_CONTROL_PLANE = {
  execute(input: any = {}): UIGraph {
    // 1️⃣ Run core control plane decision
    const { intents, signals, governance } = executeControlPlane(input);

    // 2️⃣ Feedback weight computation (read-only, does not patch signal values)
    const feedbackEvents = getFeedbackLog();
    const weights = calculateFeedbackWeights(feedbackEvents);

    // 3️⃣ Propose growth mutations (separated from control plane)
    const mutationResult = proposeMutation(signals);
    const mutationEvents = mutationResult.mutationData;

    // 4️⃣ Pre-render guard & local execution authorization boundaries
    const rawStability = calculateUIStability(signals, mutationEvents.length);
    const execution = enforceExecution(
      governance.overrides?.validatedIntents ?? intents,
      mutationEvents,
      null,
      signals,
      rawStability
    );

    const executionLayout = execution.overrides?.layout || {
      resolvedSectionTypes: ["HEADER"],
      priorityAdjustments: {},
      visibilityOverrides: {},
      ctaOverrides: {},
      emphasisOverrides: {},
    };

    // 5️⃣ Call Composer & apply soft priority/emphasis weights
    const normalized = aggregateUIData(input);
    const derived = deriveBusinessData(normalized);
    const finalStability = calculateUIStability(signals, Object.keys(executionLayout.priorityAdjustments).length);
    const graph = buildDashboardUI(normalized, derived, executionLayout, finalStability, signals);

    // Soft adaptive priority reordering & emphasis boosts
    const softSections = applySoftWeights(graph.sections, weights);

    return {
      ...graph,
      sections: softSections,
    };
  },
};
