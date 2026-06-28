/**
 * Corvioz — Launch Kill Switch
 *
 * Global, runtime-controlled kill switch for all monetization subsystems.
 *
 * RULES WHEN ACTIVE:
 *  - monetization OFF
 *  - paywall OFF
 *  - AI attribution OFF
 *  - dashboard SAFE MODE ONLY
 *
 * DESIGN:
 *  - Zero imports (no circular dependency risk)
 *  - Single in-memory flag — no DB, no API, no persistence
 *  - All consumers import isKillSwitchActive() from here
 */

let GLOBAL_KILL_SWITCH = false;
let _killSwitchReason: string | undefined;
let _activatedAt: string | undefined;

/**
 * Activates the global kill switch.
 * Immediately blocks all monetization, paywall, and AI attribution
 * across the entire launch control layer.
 *
 * @param reason - Optional human-readable reason for audit logs.
 */
export function activateKillSwitch(reason?: string): void {
  GLOBAL_KILL_SWITCH = true;
  _killSwitchReason = reason;
  _activatedAt = new Date().toISOString();
  console.warn(
    `[KILL SWITCH] ACTIVATED at ${_activatedAt}${reason ? ` — reason: "${reason}"` : ''}`
  );
}

/**
 * Deactivates the global kill switch.
 * Restores normal launch control behavior.
 * Use only after confirming root cause is resolved.
 */
export function deactivateKillSwitch(): void {
  GLOBAL_KILL_SWITCH = false;
  console.info('[KILL SWITCH] Deactivated — normal operation resumed.');
  _killSwitchReason = undefined;
  _activatedAt = undefined;
}

/**
 * Returns true if the global kill switch is currently active.
 * This is the primary guard used by all launch control consumers.
 */
export function isKillSwitchActive(): boolean {
  return GLOBAL_KILL_SWITCH;
}

/**
 * Returns the reason the kill switch was activated, or undefined if not active.
 */
export function getKillSwitchReason(): string | undefined {
  return GLOBAL_KILL_SWITCH ? _killSwitchReason : undefined;
}

/**
 * Returns a status object for audit and monitoring purposes.
 */
export function getKillSwitchStatus(): {
  active: boolean;
  reason?: string;
  activatedAt?: string;
} {
  return {
    active: GLOBAL_KILL_SWITCH,
    reason: _killSwitchReason,
    activatedAt: _activatedAt,
  };
}
