/**
 * useRevenueDecision — Corvioz v5.95 → v6 UI Decision Hook
 *
 * Central hook that sends all user actions to the Revenue Control Plane
 * (/api/revenue/control-plane) and returns a normalized UI instruction.
 *
 * Replaces all local frontend business logic. UI becomes a pure
 * "decision-execution layer" driven exclusively by backend responses.
 *
 * Supports three modes:
 *   - live    → real API call to /api/revenue/control-plane
 *   - demo    → mocked API response (same schema), no network call
 *   - preview → read-only simulation, no mutation, no real blocking
 *
 * Safety rule: UI NEVER blocks signup / first_invoice / first_quote
 * unless the backend explicitly returns action: "block".
 */

'use client';

import { useCallback, useRef } from 'react';
import { trackGA4Event, type GA4EventPayload } from '../analytics/ga4-event-bridge';
import { recordDecisionTelemetry } from '../../../core/telemetry/decisionTelemetry';


// ── Types ────────────────────────────────────────────────────────────────────

export type RevenueActionName =
  | 'create_invoice'
  | 'create_quote'
  | 'export_pdf'
  | 'pricing_cta'
  | 'upgrade_cta'
  | 'send_invoice'
  | 'client_portal'
  | 'repeat_dashboard_without_payment'
  | string;

export type BackendAction =
  | 'allow'
  | 'block'
  | 'upsell'
  | 'soft_paywall'
  | 'redirect';

export type ModalType = 'upgrade' | 'pricing' | 'export' | 'warning' | null;

export interface ExplanationObject {
  summary: string;
  factors: string[];
  intent_score: number;
}

export interface IntentBreakdown {
  intent_score: number;
  pricing_views: number;
  export_attempts: number;
  invoice_created: number;
  session_count: number;
}

export interface RevenuePsychologySignal {
  enabled: boolean;
  trigger: string;
  paywall_reason: string;
  why_am_i_seeing_this: string;
  what_unlocks_after_upgrade: string[];
  friction_mode: 'none' | 'soft_modal' | 'delayed_cta' | 'watermark_export' | 'partial_preview' | string;
  pricing_hint?: string;
  urgency_hint?: string;
  usage_based_suggestion?: string;
  most_users_upgrade_hint?: string;
}

export type PaywallTriggerMap = Record<string, boolean>;

export interface SmartFrictionSignal {
  mode: string;
  allowCoreAction: boolean;
  allowWatermarkExport: boolean;
  allowPartialPreview: boolean;
  showDelayedCta: boolean;
}

/** The normalized instruction the UI consumes */
export interface UIDecision {
  /** Whether the original action should proceed */
  shouldProceed: boolean;
  /** Whether a modal should be shown */
  showModal: boolean;
  /** Which modal type to show */
  modalType: ModalType;
  /** Optional redirect target for 'redirect' decisions */
  redirectUrl: string | null;
  /** Raw backend action for logging / control-plane stream */
  backendAction: BackendAction;
  /** UI action after sync validation. Must match backendAction. */
  uiAction: BackendAction;
  /** Warning emitted when backend and UI action payloads disagree */
  uiBackendSyncWarning?: string | null;
  /** Human-readable reason from backend */
  reason: string;
  /** Decision ID for audit trail */
  decisionId: string | null;
  /** True if running in shadow mode (no real blocking) */
  shadowMode: boolean;
  /** Backend explainability chain for analytics/debugging */
  reasonChain?: string[];
  /** How much the intent score contributed to the decision */
  intentContributionScore?: number;
  /** Pricing-specific trigger attribution from the control plane */
  pricingTriggerAttribution?: Record<string, unknown> | null;
  /** Whether the UI should show the decision explanation section */
  showExplanation: boolean;
  /** User-facing explanation for monetization decisions */
  explanation: ExplanationObject | null;
  /** Dev-facing intent breakdown for explainability panels */
  intentBreakdown: IntentBreakdown;
  /** Canonical GA4 payload returned by the control plane for this decision */
  ga4Event?: GA4EventPayload | null;
  /** Where the GA4 decision event is emitted */
  ga4Delivery?: 'server' | 'client' | 'none';
  /** v5.98 revenue psychology signals for explainable, non-dark-pattern prompts */
  psychology: RevenuePsychologySignal;
  /** Backend trigger map for analytics and UI placement */
  paywallTriggerMap: PaywallTriggerMap;
  /** Smart friction behavior; never hard-blocks invoice/quote/dashboard */
  smartFriction: SmartFrictionSignal;
}

export interface RevenueDecisionInput {
  /** Action being evaluated */
  event: RevenueActionName;
  /** How many invoices the user has already created */
  invoices_count?: number;
  /** How many quotes the user has already created */
  quotes_count?: number;
  /** User intent score (0-100), computed client-side from engagement signals */
  intent_score?: number;
  /** Funnel step identifier */
  funnel_step?: string;
  /** Number of times pricing page was viewed in this session */
  pricing_view_count?: number;
  /** Number of export attempts known in the current session */
  export_attempts?: number;
  /** Whether this is the user's first time doing this action */
  is_first_action?: boolean;
  /** Current dashboard session time in seconds */
  session_time?: number;
  /** Current user plan, used by backend monetization rules */
  user_plan?: string;
  /** Whether the current user is authenticated */
  is_authenticated?: boolean;
  /** Session identifier for prompt throttling */
  session_id?: string;
  /** Monetization prompts already shown this session */
  monetization_prompt_count?: number;
  /** Whether a monetization prompt was shown this session */
  has_seen_monetization_prompt?: boolean;
  /** Whether the user explicitly retried an export/send action */
  explicit_retry?: boolean;
  /** Mode override for demo/preview environments */
  mode?: 'live' | 'demo' | 'preview';
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CONTROL_PLANE_API = '/api/revenue/control-plane';

/**
 * Safety-first actions that must NEVER be blocked by the UI
 * unless the backend explicitly returns action: "block".
 */
const PROTECTED_ACTIONS = new Set([
  'signup',
  'first_invoice',
  'first_quote',
  'create_invoice',
  'create_quote',
  'dashboard_view',
]);

function defaultPsychology(): RevenuePsychologySignal {
  return {
    enabled: false,
    trigger: 'none',
    paywall_reason: 'No monetization prompt',
    why_am_i_seeing_this: 'No monetization psychology trigger matched this action.',
    what_unlocks_after_upgrade: [
      'Export clean PDFs without a watermark',
      'Send invoices and quotes to clients',
      'Save work permanently',
    ],
    friction_mode: 'none',
  };
}

function normalizePsychology(raw: Record<string, unknown>): RevenuePsychologySignal {
  const value = raw.psychology && typeof raw.psychology === 'object'
    ? raw.psychology as Record<string, unknown>
    : {};
  const fallback = defaultPsychology();
  const unlocks = Array.isArray(value.what_unlocks_after_upgrade)
    ? value.what_unlocks_after_upgrade.map((item) => String(item || '').trim()).filter(Boolean)
    : fallback.what_unlocks_after_upgrade;

  return {
    enabled: Boolean(value.enabled),
    trigger: String(value.trigger || fallback.trigger),
    paywall_reason: String(value.paywall_reason || fallback.paywall_reason),
    why_am_i_seeing_this: String(value.why_am_i_seeing_this || fallback.why_am_i_seeing_this),
    what_unlocks_after_upgrade: unlocks.length > 0 ? unlocks : fallback.what_unlocks_after_upgrade,
    friction_mode: String(value.friction_mode || fallback.friction_mode),
    ...(value.pricing_hint ? { pricing_hint: String(value.pricing_hint) } : {}),
    ...(value.urgency_hint ? { urgency_hint: String(value.urgency_hint) } : {}),
    ...(value.usage_based_suggestion ? { usage_based_suggestion: String(value.usage_based_suggestion) } : {}),
    ...(value.most_users_upgrade_hint ? { most_users_upgrade_hint: String(value.most_users_upgrade_hint) } : {}),
  };
}

function normalizeTriggerMap(raw: Record<string, unknown>): PaywallTriggerMap {
  const value = raw.paywall_trigger_map && typeof raw.paywall_trigger_map === 'object'
    ? raw.paywall_trigger_map as Record<string, unknown>
    : {};
  return Object.fromEntries(Object.entries(value).map(([key, enabled]) => [key, Boolean(enabled)]));
}

function buildSmartFriction(psychology: RevenuePsychologySignal, input: RevenueDecisionInput): SmartFrictionSignal {
  const protectedAction = PROTECTED_ACTIONS.has(input.event);
  const mode = protectedAction ? 'none' : psychology.friction_mode;
  return {
    mode,
    allowCoreAction: true,
    allowWatermarkExport: input.event === 'export_pdf' && mode === 'watermark_export',
    allowPartialPreview: mode === 'partial_preview' || mode === 'watermark_export',
    showDelayedCta: mode === 'delayed_cta',
  };
}

function buildIntentBreakdown(input: RevenueDecisionInput, raw?: Record<string, unknown>): IntentBreakdown {
  const pricingAttribution = raw?.pricing_trigger_attribution && typeof raw.pricing_trigger_attribution === 'object'
    ? raw.pricing_trigger_attribution as Record<string, unknown>
    : {};
  const pricingViews = Number(pricingAttribution.pricing_view_count ?? input.pricing_view_count ?? 0);
  const intentScore = Number(raw?.intent_score ?? input.intent_score ?? 0);

  return {
    intent_score: Number.isFinite(intentScore) ? Math.max(0, Math.min(100, intentScore)) : 0,
    pricing_views: Number.isFinite(pricingViews) ? Math.max(0, pricingViews) : 0,
    export_attempts: Math.max(0, Number(input.export_attempts ?? (input.event === 'export_pdf' ? 1 : 0))),
    invoice_created: Math.max(0, Number(input.invoices_count ?? 0)),
    session_count: Math.max(0, Number(input.pricing_view_count ?? 0)),
  };
}

function buildFallbackExplanation(raw: Record<string, unknown>, input: RevenueDecisionInput): ExplanationObject {
  const rawExplanation = raw.explanation && typeof raw.explanation === 'object'
    ? raw.explanation as Record<string, unknown>
    : {};
  const rawFactors = Array.isArray(rawExplanation.factors)
    ? rawExplanation.factors
    : Array.isArray(raw.reason_chain)
      ? raw.reason_chain
      : [];
  const factors = rawFactors.map((factor) => String(factor || '').trim()).filter(Boolean).slice(0, 5);
  const intentScore = Number(rawExplanation.intent_score ?? raw.intent_score ?? input.intent_score ?? 0);

  return {
    summary: String(rawExplanation.summary || raw.reason || 'This decision is based on your usage pattern.'),
    factors: factors.length > 0 ? factors : ['Based on your behavior in this session.'],
    intent_score: Number.isFinite(intentScore) ? Math.max(0, Math.min(100, intentScore)) : 0,
  };
}

// ── Mock response for demo/preview modes ─────────────────────────────────────

function buildMockDecision(input: RevenueDecisionInput): UIDecision {
  const { event, invoices_count = 0, quotes_count = 0 } = input;

  // Demo mode: simulate realistic decisions without real API
  let backendAction: BackendAction = 'allow';
  let reason = 'Demo mode: action allowed.';
  let modalType: ModalType = null;

  if (event === 'export_pdf') {
    backendAction = 'soft_paywall';
    reason = 'Demo: Export PDF shows watermark upsell.';
    modalType = 'export';
  } else if (event === 'create_invoice' && invoices_count >= 2) {
    backendAction = 'upsell';
    reason = 'Demo: Invoice limit approaching – upgrade banner shown.';
    modalType = 'upgrade';
  } else if (event === 'create_quote' && quotes_count >= 1) {
    backendAction = 'upsell';
    reason = 'Demo: Quote limit reached – upgrade shown.';
    modalType = 'upgrade';
  } else if (event === 'pricing_cta' || event === 'upgrade_cta') {
    backendAction = 'redirect';
    reason = 'Demo: Pricing CTA redirects to /pricing.';
  }

  const shouldProceed = backendAction === 'allow';
  const showModal = ['soft_paywall', 'upsell', 'block'].includes(backendAction) && modalType !== null;

  return {
    shouldProceed,
    showModal,
    modalType,
    redirectUrl: backendAction === 'redirect' ? '/pricing?checkout=pro' : null,
    backendAction,
    uiAction: backendAction,
    uiBackendSyncWarning: null,
    reason,
    decisionId: `demo_${Date.now()}`,
    shadowMode: true,
    reasonChain: ['demo_mode', reason],
    intentContributionScore: input.intent_score ?? 0,
    pricingTriggerAttribution: null,
    showExplanation: backendAction !== 'allow',
    explanation: backendAction !== 'allow'
      ? {
          summary: 'Demo monetization decision',
          factors: [reason, 'This decision is based on your usage pattern'],
          intent_score: input.intent_score ?? 0,
        }
      : null,
    intentBreakdown: buildIntentBreakdown(input),
    ga4Event: null,
    ga4Delivery: 'none',
    psychology: defaultPsychology(),
    paywallTriggerMap: {},
    smartFriction: buildSmartFriction(defaultPsychology(), input),
  };
}

// ── Normalize backend response → UIDecision ───────────────────────────────────

function normalizeBackendResponse(
  raw: Record<string, unknown>,
  input: RevenueDecisionInput,
): UIDecision {
  const rawBackendAction = (raw.backend_action ?? raw.action ?? 'allow') as BackendAction;
  const shadowAction = raw.shadow_action as BackendAction | undefined;
  const backendAction = input.event === 'export_pdf' && shadowAction === 'soft_paywall'
    ? 'soft_paywall'
    : rawBackendAction;
  const requestedUiAction = (raw.ui_action ?? raw.action ?? rawBackendAction) as BackendAction;
  const uiBackendSyncWarning = requestedUiAction !== backendAction
    ? `ui_action_mismatch: ui=${requestedUiAction} backend=${backendAction}`
    : null;
  if (uiBackendSyncWarning) {
    console.warn(`[useRevenueDecision] ${uiBackendSyncWarning}; falling back to backend_action.`);
  }
  const reason = String(raw.reason ?? '');
  const decisionId = raw.decision_id ? String(raw.decision_id) : null;
  const shadowMode = Boolean(raw.shadow_mode ?? false);
  const reasonChain = Array.isArray(raw.reason_chain)
    ? raw.reason_chain.map((entry) => String(entry || '')).filter(Boolean)
    : [];
  const intentContributionScore = Number(raw.intent_contribution_score ?? raw.intent_score ?? 0);
  const pricingTriggerAttribution = raw.pricing_trigger_attribution && typeof raw.pricing_trigger_attribution === 'object'
    ? raw.pricing_trigger_attribution as Record<string, unknown>
    : null;
  const showExplanation = backendAction !== 'allow' && !PROTECTED_ACTIONS.has(input.event);
  const explanation = showExplanation ? buildFallbackExplanation(raw, input) : null;
  const intentBreakdown = buildIntentBreakdown(input, raw);
  const ga4Event = raw.ga4_event && typeof raw.ga4_event === 'object'
    ? raw.ga4_event as GA4EventPayload
    : null;
  const psychology = normalizePsychology(raw);
  const paywallTriggerMap = normalizeTriggerMap(raw);
  const smartFriction = buildSmartFriction(psychology, input);

  // Derive UI instruction
  let shouldProceed = false;
  let showModal = false;
  let modalType: ModalType = null;
  let redirectUrl: string | null = null;

  switch (backendAction) {
    case 'allow':
      shouldProceed = true;
      break;

    case 'soft_paywall':
      // Non-blocking — allow action but show an upsell modal
      shouldProceed = true;
      showModal = true;
      modalType = input.event === 'export_pdf' ? 'export' : 'upgrade';
      break;

    case 'upsell':
      // Non-blocking — allow action but show upgrade prompt
      shouldProceed = true;
      showModal = true;
      modalType = 'upgrade';
      break;

    case 'block':
      // Blocking — do NOT proceed; show upgrade modal
      shouldProceed = false;
      showModal = true;
      modalType = 'upgrade';
      break;

    case 'redirect':
      // Non-blocking redirect toward pricing
      shouldProceed = false;
      redirectUrl = '/pricing?checkout=pro';
      break;

    default:
      shouldProceed = true;
  }

  // ── Safety override: protected first-time actions must NEVER be blocked ──
  if (!shouldProceed && PROTECTED_ACTIONS.has(input.event)) {
    console.warn(
      `[useRevenueDecision] Safety override: "${input.event}" is a protected action and cannot be blocked client-side.`,
    );
    shouldProceed = true;
    showModal = false;
    redirectUrl = null;
  }

  return {
    shouldProceed,
    showModal,
    modalType,
    redirectUrl,
    backendAction,
    uiAction: backendAction,
    uiBackendSyncWarning,
    reason,
    decisionId,
    shadowMode,
    reasonChain,
    intentContributionScore: Number.isFinite(intentContributionScore) ? intentContributionScore : 0,
    pricingTriggerAttribution,
    showExplanation,
    explanation,
    intentBreakdown,
    ga4Event,
    ga4Delivery: raw.ga4_delivery === 'client' || raw.ga4_delivery === 'server'
      ? raw.ga4_delivery
      : ga4Event
      ? 'server'
      : 'none',
    psychology,
    paywallTriggerMap,
    smartFriction,
  };
}

// ── Main Hook ─────────────────────────────────────────────────────────────────

/**
 * useRevenueDecision()
 *
 * Usage:
 *   const { evaluate } = useRevenueDecision({ mode: 'live' });
 *
 *   const result = await evaluate({
 *     event: 'create_invoice',
 *     invoices_count: 2,
 *     intent_score: 78
 *   });
 *
 *   if (result.shouldProceed) {
 *     proceed();
 *   } else if (result.showModal) {
 *     openModal(result.modalType);
 *   } else if (result.redirectUrl) {
 *     router.push(result.redirectUrl);
 *   }
 */
export function useRevenueDecision(options?: { mode?: 'live' | 'demo' | 'preview' }) {
  const mode = options?.mode ?? 'live';
  const abortRef = useRef<AbortController | null>(null);

  const evaluate = useCallback(
    async (input: RevenueDecisionInput): Promise<UIDecision> => {
      const effectiveMode = input.mode ?? mode;

      // ── Preview mode: read-only, no mutation, always allow ────────────────
      if (effectiveMode === 'preview') {
        return {
          shouldProceed: true,
          showModal: false,
          modalType: null,
          redirectUrl: null,
          backendAction: 'allow',
          uiAction: 'allow',
          uiBackendSyncWarning: null,
          reason: 'Preview mode: all actions allowed without evaluation.',
          decisionId: null,
          shadowMode: true,
          reasonChain: ['preview_mode', 'all_actions_allowed'],
          intentContributionScore: input.intent_score ?? 0,
          pricingTriggerAttribution: null,
          showExplanation: false,
          explanation: null,
          intentBreakdown: buildIntentBreakdown(input),
          ga4Event: null,
          ga4Delivery: 'none',
          psychology: defaultPsychology(),
          paywallTriggerMap: {},
          smartFriction: buildSmartFriction(defaultPsychology(), input),
        };
      }

      // ── Demo mode: mocked response, same schema ───────────────────────────
      if (effectiveMode === 'demo') {
        return buildMockDecision(input);
      }

      // ── Live mode: real API call ──────────────────────────────────────────
      try {
        // Cancel any pending in-flight request for same component
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        const res = await fetch(CONTROL_PLANE_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            event: input.event,
            intent_score: input.intent_score ?? 0,
            funnel_step: input.funnel_step ?? '',
            session_count: input.pricing_view_count ?? 0,
            pricing_viewed: (input.pricing_view_count ?? 0) > 0,
            invoice_count: input.invoices_count ?? 0,
            quote_count: input.quotes_count ?? 0,
            export_count: input.export_attempts ?? 0,
            usage_count: Math.max(input.invoices_count ?? 0, input.quotes_count ?? 0, input.export_attempts ?? 0),
            user_plan: input.user_plan ?? 'free',
            is_authenticated: input.is_authenticated ?? false,
            guest_mode_user: !(input.is_authenticated ?? false),
            session_id: input.session_id ?? '',
            monetization_prompt_count: input.monetization_prompt_count ?? 0,
            has_seen_monetization_prompt: input.has_seen_monetization_prompt ?? false,
            explicit_retry: input.explicit_retry ?? false,
            context: {
              invoices_count: input.invoices_count ?? 0,
              quotes_count: input.quotes_count ?? 0,
              intent_score: input.intent_score ?? 0,
              funnel_step: input.funnel_step ?? '',
              pricing_view_count: input.pricing_view_count ?? 0,
              export_attempts: input.export_attempts ?? 0,
              session_time: input.session_time ?? 0,
              is_first_action: input.is_first_action ?? false,
              user_plan: input.user_plan ?? 'free',
              is_authenticated: input.is_authenticated ?? false,
              session_id: input.session_id ?? '',
              monetization_prompt_count: input.monetization_prompt_count ?? 0,
              has_seen_monetization_prompt: input.has_seen_monetization_prompt ?? false,
              explicit_retry: input.explicit_retry ?? false,
            },
          }),
        });

        if (!res.ok) throw new Error(`API ${res.status}`);

        const raw = (await res.json()) as Record<string, unknown>;

        const normalizedRaw: Record<string, unknown> = {
          action: raw.action ?? 'allow',
          backend_action: raw.backend_action ?? raw.action ?? 'allow',
          ui_action: raw.ui_action ?? raw.action ?? 'allow',
          reason: raw.reason ?? 'Control plane evaluation complete.',
          reason_chain: raw.reason_chain ?? [],
          decision_id: raw.decision_id ?? null,
          intent_score: raw.intent_score ?? input.intent_score ?? 0,
          intent_contribution_score: raw.intent_contribution_score ?? input.intent_score ?? 0,
          pricing_trigger_attribution: raw.pricing_trigger_attribution ?? null,
          explanation: raw.explanation ?? null,
          shadow_mode: raw.shadow_mode ?? true,
          shadow_action: raw.shadow_action ?? null,
          ga4_event: raw.ga4_event ?? null,
          ga4_delivery: raw.ga4_delivery ?? 'server',
          psychology: raw.psychology ?? null,
          paywall_trigger_map: raw.paywall_trigger_map ?? {},
        };

        if (normalizedRaw.ga4_delivery === 'client' && normalizedRaw.ga4_event && typeof normalizedRaw.ga4_event === 'object') {
          const ga4Event = normalizedRaw.ga4_event as GA4EventPayload;
          trackGA4Event(ga4Event.event_name, ga4Event);
        }

        const finalDecision = normalizeBackendResponse(normalizedRaw, input);
        recordDecisionTelemetry({
          source: 'src/app/lib/revenue/useRevenueDecision.ts:evaluate',
          decisionType: 'useRevenueDecision evaluate',
          legacyOutput: finalDecision,
          tags: ['CONTROL_PLANE', 'LOG_ONLY', 'v5.2.2'],
        });
        return finalDecision;

      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Request was cancelled — return a safe allow
          return {
            shouldProceed: true,
            showModal: false,
            modalType: null,
            redirectUrl: null,
            backendAction: 'allow',
            uiAction: 'allow',
            uiBackendSyncWarning: null,
            reason: 'Request cancelled.',
            decisionId: null,
            shadowMode: true,
            reasonChain: ['request_cancelled'],
            intentContributionScore: input.intent_score ?? 0,
            pricingTriggerAttribution: null,
            showExplanation: false,
            explanation: null,
            intentBreakdown: buildIntentBreakdown(input),
            ga4Event: null,
            ga4Delivery: 'none',
            psychology: defaultPsychology(),
            paywallTriggerMap: {},
            smartFriction: buildSmartFriction(defaultPsychology(), input),
          };
        }

        console.error('[useRevenueDecision] API call failed, falling back to allow:', err);

        // ── Graceful fallback: always allow on API error ──────────────────
        return {
          shouldProceed: true,
          showModal: false,
          modalType: null,
          redirectUrl: null,
          backendAction: 'allow',
          uiAction: 'allow',
          uiBackendSyncWarning: null,
          reason: 'API error: safety fallback allow.',
          decisionId: null,
          shadowMode: true,
          reasonChain: ['api_error', 'safety_fallback_allow'],
          intentContributionScore: input.intent_score ?? 0,
          pricingTriggerAttribution: null,
          showExplanation: false,
          explanation: null,
          intentBreakdown: buildIntentBreakdown(input),
          ga4Event: null,
          ga4Delivery: 'none',
          psychology: defaultPsychology(),
          paywallTriggerMap: {},
          smartFriction: buildSmartFriction(defaultPsychology(), input),
        };
      }
    },
    [mode],
  );

  return { evaluate };
}

export default useRevenueDecision;
