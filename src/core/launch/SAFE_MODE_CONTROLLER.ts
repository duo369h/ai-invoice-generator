/**
 * Corvioz — Safe Mode Controller (SMC)
 *
 * Ensures the system NEVER breaks a user's core revenue flow during launch.
 *
 * WHEN any of the following occurs:
 *  - revenue_causality returns null / throws
 *  - monetization_autopilot fails / throws
 *  - AI attribution error
 *  - dashboard crash risk detected
 *
 * THEN: Switch system to SAFE MODE:
 *  - Disable paywall
 *  - Disable upgrade prompts
 *  - Keep core invoice / proposal flow ONLY
 *
 * RULES:
 *  - NO UI redesign
 *  - NO routing changes
 *  - ONLY safety override layer
 *  - NO backend changes
 *  - Pure in-memory runtime guard
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** The subsystem that triggered safe mode entry. */
export type SafeModeTrigger =
  | 'revenue_causality_null'
  | 'revenue_causality_error'
  | 'monetization_autopilot_error'
  | 'ai_attribution_error'
  | 'dashboard_crash_risk'
  | 'manual_override';

/**
 * The behavior contract enforced when safe mode is active.
 * All fields are read-only signals — no UI or routing logic lives here.
 */
export interface SafeModeBehavior {
  /** Paywall must NOT be shown */
  paywallDisabled: true;
  /** Upgrade prompts must NOT be shown */
  upgradePromptsDisabled: true;
  /** Core invoice/proposal flow must remain fully functional */
  coreFlowPreserved: true;
  /** AI attribution display must NOT be shown */
  aiAttributionDisabled: true;
  /** Monetization autopilot decisions must be ignored */
  monetizationAutopilotDisabled: true;
}

/** Point-in-time record of a safe mode activation event. */
export interface SafeModeEntry {
  trigger: SafeModeTrigger;
  reason: string;
  error?: unknown;
  timestamp: string;
}

/** Full safe mode state snapshot. */
export interface SafeModeState {
  /** Whether safe mode is currently active */
  safeModeEnabled: boolean;
  /** The trigger that caused safe mode to activate (null if not active) */
  activeTrigger: SafeModeTrigger | null;
  /** Human-readable reason for current safe mode activation */
  activeReason: string | null;
  /** Enforced behavioral constraints when safe mode is active */
  behavior: SafeModeBehavior | null;
  /** Full history of safe mode activations this session */
  history: SafeModeEntry[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal State
// ─────────────────────────────────────────────────────────────────────────────

let _safeModeActive = false;
let _activeTrigger: SafeModeTrigger | null = null;
let _activeReason: string | null = null;
const _history: SafeModeEntry[] = [];

/** The canonical safe-mode behavior object — immutable reference. */
const SAFE_BEHAVIOR: SafeModeBehavior = {
  paywallDisabled: true,
  upgradePromptsDisabled: true,
  coreFlowPreserved: true,
  aiAttributionDisabled: true,
  monetizationAutopilotDisabled: true,
};

function now(): string {
  return new Date().toISOString();
}

function logSafeModeEvent(entry: SafeModeEntry): void {
  console.warn(
    `[SMC] SAFE MODE ACTIVATED — trigger="${entry.trigger}" reason="${entry.reason}" at ${entry.timestamp}`,
    entry.error !== undefined ? { error: entry.error } : {}
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Activation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Activates safe mode due to a detected failure condition.
 * Idempotent — calling again with a new trigger updates the active trigger
 * and appends to history, but safe mode stays on.
 *
 * @param trigger - Which subsystem caused the failure
 * @param reason  - Human-readable description of the failure
 * @param error   - Optional caught error object for diagnostics
 */
export function activateSafeMode(
  trigger: SafeModeTrigger,
  reason: string,
  error?: unknown
): void {
  _safeModeActive = true;
  _activeTrigger = trigger;
  _activeReason = reason;

  const entry: SafeModeEntry = { trigger, reason, error, timestamp: now() };
  _history.push(entry);
  logSafeModeEvent(entry);
}

/**
 * Deactivates safe mode manually.
 * Only call this after the root cause has been confirmed resolved.
 * Logs deactivation for auditability.
 */
export function deactivateSafeMode(): void {
  if (!_safeModeActive) return;
  console.info('[SMC] Safe mode deactivated — normal operation resumed.');
  _safeModeActive = false;
  _activeTrigger = null;
  _activeReason = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Guarded Execution Wrappers
// These wrap core subsystem calls and auto-activate safe mode on failure.
// ZERO logic changes to the wrapped functions.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely executes a revenue causality computation.
 * If the function throws or returns null/undefined, safe mode is activated
 * and `null` is returned so callers can render a fallback state.
 *
 * @param fn     - The revenue causality function to execute
 * @param args   - Arguments to pass to the function
 * @returns The result, or null if execution failed
 */
export function guardRevenueCausality<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  ...args: TArgs
): TResult | null {
  try {
    const result = fn(...args);
    if (result == null) {
      activateSafeMode(
        'revenue_causality_null',
        'calculateRevenueCausality returned null or undefined.'
      );
      return null;
    }
    return result;
  } catch (error) {
    activateSafeMode(
      'revenue_causality_error',
      `calculateRevenueCausality threw an error: ${String(error)}`,
      error
    );
    return null;
  }
}

/**
 * Safely executes the monetization autopilot decision function.
 * If it throws, safe mode is activated and `null` is returned.
 *
 * @param fn   - The monetization decision function to execute
 * @param args - Arguments to pass to the function
 * @returns The decision, or null if execution failed
 */
export function guardMonetizationAutopilot<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  ...args: TArgs
): TResult | null {
  try {
    return fn(...args);
  } catch (error) {
    activateSafeMode(
      'monetization_autopilot_error',
      `decideMonetizationAction threw an error: ${String(error)}`,
      error
    );
    return null;
  }
}

/**
 * Safely executes an AI attribution computation.
 * If it throws, safe mode is activated and `null` is returned.
 *
 * @param fn   - The AI attribution function to execute
 * @param args - Arguments to pass to the function
 * @returns The result, or null if execution failed
 */
export function guardAIAttribution<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  ...args: TArgs
): TResult | null {
  try {
    return fn(...args);
  } catch (error) {
    activateSafeMode(
      'ai_attribution_error',
      `AI attribution computation threw an error: ${String(error)}`,
      error
    );
    return null;
  }
}

/**
 * Reports a dashboard crash risk signal to the SMC.
 * Call this from any component-level error boundary or try/catch
 * that detects a render-time failure in the dashboard.
 *
 * @param reason - Description of the crash risk condition
 * @param error  - Optional caught error
 */
export function reportDashboardCrashRisk(reason: string, error?: unknown): void {
  activateSafeMode('dashboard_crash_risk', reason, error);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public Read API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if safe mode is currently active.
 * Use this as the primary gate before any monetization or paywall logic.
 *
 * ```ts
 * if (isSafeModeActive()) return null; // skip paywall render
 * ```
 */
export function isSafeModeActive(): boolean {
  return _safeModeActive;
}

/**
 * Returns the full safe mode behavior contract when active, or null.
 * Consumers MUST respect all fields when this is non-null.
 *
 * @returns SafeModeBehavior if safe mode is active, null otherwise
 */
export function getSafeModeBehavior(): SafeModeBehavior | null {
  return _safeModeActive ? SAFE_BEHAVIOR : null;
}

/**
 * Returns a full point-in-time snapshot of safe mode state.
 * Safe to call in production — read-only, no side effects.
 */
export function getSafeModeState(): SafeModeState {
  return {
    safeModeEnabled: _safeModeActive,
    activeTrigger: _activeTrigger,
    activeReason: _activeReason,
    behavior: _safeModeActive ? SAFE_BEHAVIOR : null,
    history: [..._history],
  };
}

/**
 * Checks whether a specific subsystem trigger has fired this session.
 * Useful for conditional degraded-mode messages in non-UI logic layers.
 *
 * @param trigger - The trigger to check for
 */
export function hasTriggerFired(trigger: SafeModeTrigger): boolean {
  return _history.some((entry) => entry.trigger === trigger);
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback Behavior Controller
// Returns safe defaults for each subsystem's output when in safe mode.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the safe-mode fallback for a revenue causality result.
 * Mirrors the shape of RevenueCausalityResult with all-zero / false values.
 * Call this when guardRevenueCausality() returns null.
 *
 * @param userId - The user ID to preserve in the fallback
 */
export function getRevenueCausalityFallback(userId: string) {
  return {
    user_id: userId,
    revenue_uplift: 0,
    win_rate_uplift: 0,
    deal_size_uplift: 0,
    ai_influence_contribution: 0,
    ai_contribution_score: 0,
    first_revenue_proof_triggered: false,
    attribution: [],
    revenue_snapshot_update: {
      user_id: userId,
      revenue_before: 0,
      revenue_after: 0,
      win_rate_before: 0,
      win_rate_after: 0,
      ai_influence_score: 0,
      first_revenue_proof_triggered: false,
    },
  } as const;
}

/**
 * Returns the safe-mode fallback for a monetization decision.
 * Always returns 'no_action' to prevent any paywall from showing.
 * Call this when guardMonetizationAutopilot() returns null.
 */
export function getMonetizationDecisionFallback() {
  return {
    action: 'no_action' as const,
    recommended_plan: 'starter' as const,
    recommended_price_usd: 9 as const,
    urgency: 'low' as const,
    reason: '[SAFE MODE] Monetization autopilot disabled — core flow protected.',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test / Session Reset
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fully resets the Safe Mode Controller state.
 * Use ONLY between isolated test cycles or session boundaries.
 * DO NOT call in production request handlers.
 */
export function resetSafeModeController(): void {
  _safeModeActive = false;
  _activeTrigger = null;
  _activeReason = null;
  _history.length = 0;
}
