/**
 * Corvioz — Launch Monitor
 *
 * Lightweight, in-memory monitoring hooks for production launch observation.
 *
 * RULES:
 *  - NO DB schema changes
 *  - NO API calls
 *  - ONLY in-memory ring buffer + optional console logs
 *  - Zero side-effects on core logic
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type RevenueEventType =
  | 'revenue_proof_triggered'
  | 'first_proposal_win'
  | 'revenue_uplift_computed'
  | 'deal_closed'
  | 'win_rate_change';

export type AIInteractionType =
  | 'pricing_suggestion'
  | 'proposal_optimization'
  | 'follow_up_suggestion'
  | 'quote_optimization'
  | string;

export type MonetizationDecisionType =
  | 'show_paywall'
  | 'suggest_upgrade'
  | 'no_action';

export interface RevenueEvent {
  type: RevenueEventType;
  userId: string;
  value?: number;
  meta?: Record<string, unknown>;
  timestamp: string;
}

export interface AIInteractionEvent {
  type: AIInteractionType;
  userId: string;
  accepted: boolean;
  contributionScore?: number;
  proposalId?: string | null;
  meta?: Record<string, unknown>;
  timestamp: string;
}

export interface MonetizationDecisionEvent {
  decision: MonetizationDecisionType;
  plan: string;
  priceUsd: number;
  urgency: string;
  reason: string;
  userId: string;
  timestamp: string;
}

export interface LaunchMonitorSnapshot {
  revenueEvents: RevenueEvent[];
  aiInteractions: AIInteractionEvent[];
  monetizationDecisions: MonetizationDecisionEvent[];
  totals: {
    revenueEvents: number;
    aiInteractions: number;
    monetizationDecisions: number;
    paywallTriggered: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Ring Buffer (max 200 entries per channel to avoid memory leaks)
// ─────────────────────────────────────────────────────────────────────────────

const MAX_ENTRIES = 200;

const _revenueEvents: RevenueEvent[] = [];
const _aiInteractions: AIInteractionEvent[] = [];
const _monetizationDecisions: MonetizationDecisionEvent[] = [];

let _totalRevenueEvents = 0;
let _totalAiInteractions = 0;
let _totalMonetizationDecisions = 0;
let _totalPaywallTriggered = 0;

function pushCapped<T>(buffer: T[], entry: T): void {
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) {
    buffer.shift(); // drop oldest entry
  }
}

function now(): string {
  return new Date().toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Public Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Track a revenue-related event.
 * Call at any point where revenue signals are produced or confirmed.
 *
 * @param type    - The revenue event type
 * @param userId  - The user this event belongs to
 * @param value   - Optional numeric signal (uplift, deal size, etc.)
 * @param meta    - Optional structured metadata for richer observation
 */
export function trackRevenueEvent(
  type: RevenueEventType,
  userId: string,
  value?: number,
  meta?: Record<string, unknown>
): void {
  const event: RevenueEvent = { type, userId, value, meta, timestamp: now() };
  pushCapped(_revenueEvents, event);
  _totalRevenueEvents++;

  if (typeof process === 'undefined' || process.env.NODE_ENV !== 'production') {
    console.info(`[LCS:REVENUE] ${type}`, {
      userId,
      value,
      ...meta,
      timestamp: event.timestamp,
    });
  }
}

/**
 * Track an AI interaction event.
 * Call when a user accepts or triggers an AI-generated action.
 *
 * @param type              - The AI action type
 * @param userId            - The user this interaction belongs to
 * @param accepted          - Whether the user accepted the AI suggestion
 * @param contributionScore - Optional 0–100 AI contribution score
 * @param proposalId        - Optional linked proposal ID
 * @param meta              - Optional structured metadata
 */
export function trackAIInteraction(
  type: AIInteractionType,
  userId: string,
  accepted: boolean,
  contributionScore?: number,
  proposalId?: string | null,
  meta?: Record<string, unknown>
): void {
  const event: AIInteractionEvent = {
    type,
    userId,
    accepted,
    contributionScore,
    proposalId: proposalId ?? null,
    meta,
    timestamp: now(),
  };
  pushCapped(_aiInteractions, event);
  _totalAiInteractions++;

  if (typeof process === 'undefined' || process.env.NODE_ENV !== 'production') {
    console.info(`[LCS:AI] ${type}`, {
      userId,
      accepted,
      contributionScore,
      proposalId,
      ...meta,
      timestamp: event.timestamp,
    });
  }
}

/**
 * Track a monetization decision event.
 * Call when decideMonetizationAction() produces a result.
 *
 * @param decision  - The action produced (show_paywall / suggest_upgrade / no_action)
 * @param plan      - Recommended plan
 * @param priceUsd  - Recommended price
 * @param urgency   - Decision urgency
 * @param reason    - Human-readable reason string from MONETIZATION_AUTOPILOT
 * @param userId    - The user this decision applies to
 */
export function trackMonetizationDecision(
  decision: MonetizationDecisionType,
  plan: string,
  priceUsd: number,
  urgency: string,
  reason: string,
  userId: string
): void {
  const event: MonetizationDecisionEvent = {
    decision,
    plan,
    priceUsd,
    urgency,
    reason,
    userId,
    timestamp: now(),
  };
  pushCapped(_monetizationDecisions, event);
  _totalMonetizationDecisions++;
  if (decision === 'show_paywall') {
    _totalPaywallTriggered++;
  }

  if (typeof process === 'undefined' || process.env.NODE_ENV !== 'production') {
    console.info(`[LCS:MONETIZATION] ${decision}`, {
      userId,
      plan,
      priceUsd,
      urgency,
      reason,
      timestamp: event.timestamp,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Snapshot & Reset (for debugging / test isolation)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a point-in-time snapshot of all in-memory launch monitoring data.
 * Safe to call in production — read-only, no side effects.
 */
export function getLaunchMonitorSnapshot(): LaunchMonitorSnapshot {
  return {
    revenueEvents: [..._revenueEvents],
    aiInteractions: [..._aiInteractions],
    monetizationDecisions: [..._monetizationDecisions],
    totals: {
      revenueEvents: _totalRevenueEvents,
      aiInteractions: _totalAiInteractions,
      monetizationDecisions: _totalMonetizationDecisions,
      paywallTriggered: _totalPaywallTriggered,
    },
  };
}

/**
 * Resets all in-memory buffers and counters.
 * Use ONLY between isolated test cycles or session boundaries.
 * DO NOT call in production request handlers.
 */
export function resetLaunchMonitor(): void {
  _revenueEvents.length = 0;
  _aiInteractions.length = 0;
  _monetizationDecisions.length = 0;
  _totalRevenueEvents = 0;
  _totalAiInteractions = 0;
  _totalMonetizationDecisions = 0;
  _totalPaywallTriggered = 0;
}
