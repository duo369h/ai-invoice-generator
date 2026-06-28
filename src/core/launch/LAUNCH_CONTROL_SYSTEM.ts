/**
 * Corvioz — Launch Control System (LCS)
 *
 * Centralized runtime guard for production launch.
 * Responsibilities:
 *  1. Feature Flags Management
 *  2. Risk Level Detection
 *  3. Kill Switch System
 *
 * RULES:
 *  - NO UI logic
 *  - NO backend changes
 *  - PURE runtime control layer only
 *  - All decisions are stateless and deterministic given the same input
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────────────────────

export type PaywallStrength = 'soft' | 'medium' | 'hard';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface FeatureFlags {
  /** Automated monetization decision loop */
  monetization_autopilot: boolean;
  /** AI-attributed revenue proof dashboard */
  revenue_proof_dashboard: boolean;
  /** AI interaction causal attribution engine */
  ai_attribution: boolean;
  /** Paywall aggressiveness: soft = suggest, medium = prompt, hard = block */
  paywall_strength: PaywallStrength;
}

/** Minimal user state contract consumed by the LCS. No UI concerns. */
export interface LaunchUserState {
  /** Positive revenue uplift in dollars */
  revenue_uplift?: number;
  /** First revenue proof event has been triggered */
  first_revenue_proof_triggered?: boolean;
  /** First proposal win has been recorded */
  first_proposal_win?: boolean;
  /** AI contribution score 0–100 */
  ai_contribution_score?: number;
  /** Win rate change (signed ratio) */
  win_rate_uplift?: number;
  /** Average deal size uplift in dollars */
  deal_size_uplift?: number;
  /** Number of AI interactions accepted by user */
  accepted_ai_interactions?: number;
  /** True when user has entered the funnel via a paid/revenue-linked path */
  revenue_entry?: boolean;
}

export interface LaunchState {
  /** Current computed feature flags */
  flags: FeatureFlags;
  /** Current risk classification */
  riskLevel: RiskLevel;
  /** Whether the paywall trigger condition has been satisfied */
  paywallTriggered: boolean;
  /** Kill switch active — all monetization features are disabled */
  killSwitchActive: boolean;
  /** Human-readable audit log of decisions made */
  auditLog: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Kill Switch
// Controlled via a single module-level flag.
// Flip to `true` to immediately disable all monetization at runtime.
// ─────────────────────────────────────────────────────────────────────────────

let _killSwitchEngaged = false;

/**
 * Engage the global kill switch.
 * Disables: monetization_autopilot, paywall triggers.
 * Falls back to safe dashboard mode (revenue_proof_dashboard remains readable).
 *
 * @param reason - Optional audit reason string.
 */
export function engageKillSwitch(reason?: string): void {
  _killSwitchEngaged = true;
  if (reason) {
    console.warn(`[LCS KILL SWITCH] Engaged — reason: "${reason}"`);
  } else {
    console.warn('[LCS KILL SWITCH] Engaged — all monetization disabled.');
  }
}

/**
 * Disengage the kill switch. Use with caution in production.
 */
export function disengageKillSwitch(): void {
  _killSwitchEngaged = false;
  console.info('[LCS KILL SWITCH] Disengaged — normal operation resumed.');
}

/**
 * Returns true if the kill switch is currently active.
 */
export function isKillSwitchActive(): boolean {
  return _killSwitchEngaged;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toFiniteNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Computes a composite revenue signal from user state.
 * Signal is used to classify risk level and paywall eligibility.
 */
function computeRevenueSignal(userState: LaunchUserState): number {
  const revenueUplift = toFiniteNumber(userState.revenue_uplift);
  const winRateUplift = Math.max(0, toFiniteNumber(userState.win_rate_uplift)) * 100;
  const dealSizeUplift = toFiniteNumber(userState.deal_size_uplift);
  const aiScore = toFiniteNumber(userState.ai_contribution_score);
  return revenueUplift + winRateUplift + dealSizeUplift + aiScore;
}

/**
 * Returns true if the user has confirmed revenue proof via any qualifying signal.
 */
function hasRevenueProof(userState: LaunchUserState): boolean {
  return (
    userState.first_revenue_proof_triggered === true ||
    userState.first_proposal_win === true
  );
}

/**
 * Returns true when AI attribution is strong enough to qualify for autopilot.
 */
function hasHighAiContribution(userState: LaunchUserState): boolean {
  return toFiniteNumber(userState.ai_contribution_score) > 60;
}

/**
 * Returns true if the user entered through a revenue-linked path.
 */
function hasRevenueEntry(userState: LaunchUserState): boolean {
  return userState.revenue_entry === true;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Feature Flags
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes the active feature flags for the given user state.
 * Kill switch overrides all monetization flags when engaged.
 */
function computeFeatureFlags(userState: LaunchUserState): { flags: FeatureFlags; log: string[] } {
  const log: string[] = [];
  const killActive = _killSwitchEngaged;

  if (killActive) {
    log.push('KILL_SWITCH: monetization_autopilot=false, paywall_strength=soft (safe mode)');
    return {
      flags: {
        monetization_autopilot: false,
        revenue_proof_dashboard: true, // read-only dashboard stays on for observability
        ai_attribution: false,
        paywall_strength: 'soft',
      },
      log,
    };
  }

  const revenueProof = hasRevenueProof(userState);
  const highAi = hasHighAiContribution(userState);
  const revenueSignal = computeRevenueSignal(userState);
  const revenueEntry = hasRevenueEntry(userState);

  // monetization_autopilot: requires revenue proof OR high AI contribution
  const monetizationAutopilot = revenueProof || highAi;
  log.push(`monetization_autopilot=${monetizationAutopilot} (revenueProof=${revenueProof}, highAI=${highAi})`);

  // revenue_proof_dashboard: active when any revenue signal exists
  const revenueProofDashboard = revenueSignal > 0 || revenueProof;
  log.push(`revenue_proof_dashboard=${revenueProofDashboard} (signal=${revenueSignal})`);

  // ai_attribution: requires at least one accepted AI interaction
  const aiAttribution = toFiniteNumber(userState.accepted_ai_interactions) > 0 || highAi;
  log.push(`ai_attribution=${aiAttribution}`);

  // paywall_strength: escalates with signal strength
  let paywallStrength: PaywallStrength = 'soft';
  if (revenueSignal >= 1000 && toFiniteNumber(userState.ai_contribution_score) >= 75) {
    paywallStrength = 'hard';
  } else if (revenueSignal >= 250 || (revenueProof && revenueEntry)) {
    paywallStrength = 'medium';
  }
  log.push(`paywall_strength=${paywallStrength} (signal=${revenueSignal})`);

  return {
    flags: {
      monetization_autopilot: monetizationAutopilot,
      revenue_proof_dashboard: revenueProofDashboard,
      ai_attribution: aiAttribution,
      paywall_strength: paywallStrength,
    },
    log,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Risk Level Detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classifies the operational risk level for the current user state.
 *
 * LOW    — no significant revenue, AI, or entry signals
 * MEDIUM — partial signals detected; proceed with caution
 * HIGH   — strong multi-signal convergence; full monetization eligible
 */
function computeRiskLevel(userState: LaunchUserState): { riskLevel: RiskLevel; log: string[] } {
  const log: string[] = [];
  const revenueSignal = computeRevenueSignal(userState);
  const aiScore = toFiniteNumber(userState.ai_contribution_score);
  const revenueProof = hasRevenueProof(userState);
  const revenueEntry = hasRevenueEntry(userState);

  // HIGH: strong revenue + AI convergence
  if (revenueSignal >= 500 && aiScore >= 60 && revenueProof) {
    log.push(`RISK=HIGH (signal=${revenueSignal}, ai=${aiScore}, proof=true)`);
    return { riskLevel: 'HIGH', log };
  }

  // MEDIUM: partial signal convergence
  if (revenueSignal >= 100 || aiScore >= 40 || revenueProof || revenueEntry) {
    log.push(`RISK=MEDIUM (signal=${revenueSignal}, ai=${aiScore}, proof=${revenueProof}, entry=${revenueEntry})`);
    return { riskLevel: 'MEDIUM', log };
  }

  // LOW: no meaningful signals
  log.push(`RISK=LOW (signal=${revenueSignal}, ai=${aiScore})`);
  return { riskLevel: 'LOW', log };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Paywall Trigger Logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determines whether a paywall should be triggered for this user state.
 *
 * Requirements (all must pass when kill switch is off):
 *  - Kill switch must be inactive
 *  - At least one of: revenueProof, highAiContribution
 */
function computePaywallTrigger(
  userState: LaunchUserState,
  flags: FeatureFlags
): { triggered: boolean; log: string[] } {
  const log: string[] = [];

  if (_killSwitchEngaged) {
    log.push('PAYWALL_TRIGGER=false (kill switch active)');
    return { triggered: false, log };
  }

  const revenueProof = hasRevenueProof(userState);
  const highAi = hasHighAiContribution(userState);
  const revenueSignal = computeRevenueSignal(userState);

  const eligible = revenueProof || highAi;

  if (!eligible) {
    log.push(`PAYWALL_TRIGGER=false (no qualifying signal — proof=${revenueProof}, highAI=${highAi})`);
    return { triggered: false, log };
  }

  // Even when eligible, soft mode only suggests — does not hard-trigger
  if (flags.paywall_strength === 'soft' && revenueSignal < 100) {
    log.push(`PAYWALL_TRIGGER=false (soft mode + signal too low: ${revenueSignal})`);
    return { triggered: false, log };
  }

  log.push(
    `PAYWALL_TRIGGER=true (strength=${flags.paywall_strength}, signal=${revenueSignal}, proof=${revenueProof}, highAI=${highAi})`
  );
  return { triggered: true, log };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes the full launch state for a given user state snapshot.
 *
 * This is the primary entry point. All decisions are pure and deterministic.
 *
 * @param userState - Current user revenue, AI, and entry signals.
 * @returns LaunchState — flags, riskLevel, paywallTriggered, killSwitchActive, auditLog
 */
export function getLaunchState(userState: LaunchUserState = {}): LaunchState {
  const auditLog: string[] = [];

  const killSwitchActive = _killSwitchEngaged;
  auditLog.push(`killSwitchActive=${killSwitchActive}`);

  const { flags, log: flagsLog } = computeFeatureFlags(userState);
  auditLog.push(...flagsLog);

  const { riskLevel, log: riskLog } = computeRiskLevel(userState);
  auditLog.push(...riskLog);

  const { triggered: paywallTriggered, log: paywallLog } = computePaywallTrigger(userState, flags);
  auditLog.push(...paywallLog);

  return {
    flags,
    riskLevel,
    paywallTriggered,
    killSwitchActive,
    auditLog,
  };
}

/**
 * Returns true if the paywall should be triggered for the given user state.
 *
 * Convenience wrapper around getLaunchState for hot-path call sites.
 *
 * @param userState - Current user state.
 */
export function shouldTriggerPaywall(userState: LaunchUserState = {}): boolean {
  return getLaunchState(userState).paywallTriggered;
}

/**
 * Returns the current risk level classification for the given user state.
 *
 * @param userState - Current user state.
 */
export function getRiskLevel(userState: LaunchUserState = {}): RiskLevel {
  return getLaunchState(userState).riskLevel;
}
