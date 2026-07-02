/**
 * Corvioz — UI Business Derivation
 *
 * Computes all complex metrics, aggregates statistics, filters collections,
 * and runs autopilot/causality decisions.
 *
 * ❌ Must NOT construct UI layouts or presentation styling.
 */

import type { NormalizedData } from "./UI_DATA_AGGREGATOR.ts";
import { calculateRevenueCausality } from "../../revenue/REVENUE_CAUSALITY_ENGINE.ts";
import { decideMonetizationAction } from "../../monetization/MONETIZATION_AUTOPILOT.ts";

export type DerivedBusinessData = {
  normalized: NormalizedData;
  activeProposalsCount: number;
  winRate: number;
  totalLeadPipeline: number;
  overdueInvoices: any[];
  approvedProposals: any[];
  leadsNeedingProposal: any[];
  pendingSentProposals: any[];
  invoiceCount: number;
  proposalCount: number;
  leadCount: number;
  paidInvoiceCount: number;
  outstandingInvoiceCount: number;
  pendingProposalCount: number;
  revenueCausality: any;
  monetizationDecision: any;
  firstProposalWin: boolean;
  onboarding: {
    steps: any[];
    doneCount: number;
    totalCount: number;
    percentComplete: number;
    nextStep: any;
  };
};

export function deriveBusinessData(data: NormalizedData): DerivedBusinessData {
  const CLOSED_PROPOSAL_STATES = ["approved", "accepted", "converted", "declined", "rejected"];
  const WON_STATES = ["won", "approved", "accepted", "converted", "paid"];
  const ACTIVE_PROPOSAL_EXCLUSIONS = ["approved", "converted", "declined", "rejected"];

  const statusOf = (record: any) => String(record?.status || record?.outcome || "").toLowerCase();

  const isOverdueInvoice = (invoice: any) => {
    const status = statusOf(invoice);
    if (status === "overdue") return true;
    return status === "sent" && Boolean(invoice?.due_date) && new Date(invoice.due_date) < new Date();
  };

  const leadPipelineStatus = (lead: any): string => {
    if (lead?.pipeline_status) return lead.pipeline_status;
    try {
      const parsed = typeof lead?.source_utm === "object" ? lead.source_utm : JSON.parse(lead?.source_utm || "{}");
      if (parsed.pipeline_status) return parsed.pipeline_status;
    } catch (e) {}
    const key = statusOf(lead);
    if (key === "new") return "New";
    if (key === "contacted") return "Qualified";
    if (key === "quote_generated") return "Proposal Sent";
    if (key === "archived") return "Won";
    return "New";
  };

  const leadValue = (lead: any): number => {
    if (lead?.lead_value) return Number(lead.lead_value || 0);
    try {
      const parsed = typeof lead?.source_utm === "object" ? lead.source_utm : JSON.parse(lead?.source_utm || "{}");
      return Number(parsed.lead_value || 0);
    } catch (e) {}
    return 0;
  };

  // ── Win Rate Calculation ──
  const decidedProposals = data.rawQuotes.filter(p => CLOSED_PROPOSAL_STATES.includes(statusOf(p)));
  const wonProposals = decidedProposals.filter(p => WON_STATES.includes(statusOf(p)));
  const winRate = decidedProposals.length > 0 ? (wonProposals.length / decidedProposals.length) : 0;

  // ── Overdue Invoices ──
  const overdueInvoices = data.rawInvoices.filter(isOverdueInvoice);

  // ── Lead pipeline sums ──
  const totalLeadPipeline = data.rawLeads.reduce((sum, lead) => sum + leadValue(lead), 0);

  // ── Action-required categories ──
  const approvedProposals = data.rawQuotes.filter(p => ["approved", "accepted"].includes(statusOf(p)));
  const leadsNeedingProposal = data.rawLeads.filter(l => ["new", "contacted"].includes(statusOf(l)));
  const pendingSentProposals = data.rawQuotes.filter(p => statusOf(p) === "sent");

  // ── Basic Counters ──
  const invoiceCount = data.rawInvoices.length;
  const proposalCount = data.rawQuotes.length;
  const leadCount = data.rawLeads.length;
  const paidInvoiceCount = data.rawInvoices.filter(i => statusOf(i) === "paid").length;
  const outstandingInvoiceCount = invoiceCount - paidInvoiceCount;
  const pendingProposalCount = data.rawQuotes.filter(p => !CLOSED_PROPOSAL_STATES.includes(statusOf(p))).length;
  const activeProposalsCount = data.rawQuotes.filter(p => !ACTIVE_PROPOSAL_EXCLUSIONS.includes(statusOf(p))).length;

  // ── Revenue Causality & Monentization ──
  const causalityProposals = data.rawQuotes.map(proposal => ({
    id: String(proposal?.id || proposal?.quote_number || ""),
    user_id: data.userId,
    status: proposal?.status,
    value: proposal?.total || proposal?.value || proposal?.amount || 0,
    used_ai: Boolean(proposal?.used_ai),
  }));

  const aiInteractions = data.rawLeads
    .filter(lead => ["quote_generated", "proposal_sent"].includes(statusOf(lead)) || String(leadPipelineStatus(lead)).toLowerCase() === "proposal sent")
    .map(lead => ({
      id: `lead-ai-${lead?.id || "unknown"}`,
      user_id: data.userId,
      action: "proposal_optimization",
      accepted: true,
      created_at: lead?.updated_at || lead?.created_at,
      revenue_delta: 0,
    }));

  const revenueCausality = calculateRevenueCausality(data.userId, {
    proposals: causalityProposals,
    deals: data.rawInvoices.map(invoice => ({
      id: String(invoice?.id || invoice?.invoice_number || ""),
      user_id: data.userId,
      status: invoice?.status,
      value: invoice?.total || 0,
    })),
    ai_interactions: aiInteractions,
    revenue_snapshots: [],
  });

  const firstProposalWin = [...data.rawQuotes, ...data.rawInvoices].some(record => WON_STATES.includes(statusOf(record)));
  const monetizationDecision = decideMonetizationAction({
    first_revenue_proof_triggered: revenueCausality.first_revenue_proof_triggered,
    first_proposal_win: firstProposalWin,
    ai_contribution_score: revenueCausality.ai_contribution_score,
    revenue_uplift: revenueCausality.revenue_uplift,
    win_rate_uplift: revenueCausality.win_rate_uplift,
    deal_size_uplift: revenueCausality.deal_size_uplift,
  });

  // ── Onboarding checklist steps derivation ──
  const hasProfile = Boolean(data.activeProfile?.username);
  const onboardingSteps = [
    {
      id: "invoice",
      title: "Improve your client workflow",
      description: "Start from the client result you want, then prepare the document when the client is ready.",
      done: invoiceCount > 0,
      actionLabel: "Start client workflow",
      action: "createInvoice",
    },
    {
      id: "proposal",
      title: "Improve your proposal success",
      description: "Shape a clearer client proposal before it becomes an approved invoice.",
      done: proposalCount > 0,
      actionLabel: "Increase win probability",
      action: "createQuote",
    },
    {
      id: "profile",
      title: "Set up your Public Bento Profile",
      description: "Customize services, availability, and testimonials to capture client inquiries.",
      done: hasProfile,
      actionLabel: "Get Started",
      action: "configureProfile",
    },
  ];
  const onboardingDoneCount = onboardingSteps.filter(step => step.done).length;
  const onboardingNextStep = onboardingSteps.find(step => !step.done) || null;
  const onboardingPercentComplete = Math.round((onboardingDoneCount / onboardingSteps.length) * 100);

  return {
    normalized: data,
    activeProposalsCount,
    winRate,
    totalLeadPipeline,
    overdueInvoices,
    approvedProposals,
    leadsNeedingProposal,
    pendingSentProposals,
    invoiceCount,
    proposalCount,
    leadCount,
    paidInvoiceCount,
    outstandingInvoiceCount,
    pendingProposalCount,
    revenueCausality,
    monetizationDecision,
    firstProposalWin,
    onboarding: {
      steps: onboardingSteps,
      doneCount: onboardingDoneCount,
      totalCount: onboardingSteps.length,
      percentComplete: onboardingPercentComplete,
      nextStep: onboardingNextStep,
    },
  };
}
