/**
 * RDCL v3.3 — RDCL Production Consistency Score Engine
 *
 * Aggregates production validation signals into a single numeric score
 * and production readiness verdict.
 *
 * Score formula (weighted):
 *   determinism_rate  → 35% (RDCL must be fully deterministic)
 *   shadow_match_rate → 30% (live vs shadow agreement)
 *   divergence_rate   → 20% (inverted: lower divergence = higher score)
 *   action_stability  → 10% (emulator instability inverted)
 *   tier_stability    → 5%  (no flux instability)
 */

import { DivergenceReport }             from './divergence-tracker';
import { EmulatorResult }               from './real-behavior-emulator';
import { TierFluxResult }               from './tier-flux-detector';

export interface ConsistencyReport {
  rdcl_production_score: number;   // 0.0 – 1.0
  stability_index:       number;   // 0.0 – 1.0 (composite stability signal)
  production_ready:      boolean;
  breakdown: {
    determinism_rate:  number;
    shadow_match_rate: number;
    divergence_score:  number;
    action_stability:  number;
    tier_stability:    number;
  };
}

// ── Weights ───────────────────────────────────────────────────────────────────

const W = {
  determinism:  0.35,
  shadow_match: 0.30,
  divergence:   0.20,
  action_stab:  0.10,
  tier_stab:    0.05,
} as const;

// ── Thresholds ────────────────────────────────────────────────────────────────

const PRODUCTION_THRESHOLD = 0.95;

// ── Sub-scorers ───────────────────────────────────────────────────────────────

/**
 * Determinism rate: derived from divergence report.
 * If shadow == live for all events → 1.0.
 */
function scoreDeterminism(divergence: DivergenceReport): number {
  if (divergence.total_events === 0) return 1.0;
  return parseFloat((1 - divergence.divergence_rate).toFixed(4));
}

/**
 * Shadow match rate: same as determinism in our shadow model
 * (shadow re-executes RDCL identically, so mismatch = RDCL non-determinism).
 */
function scoreShadowMatch(divergence: DivergenceReport): number {
  return scoreDeterminism(divergence);
}

/**
 * Divergence score: inverted divergence rate, with critical case penalty.
 */
function scoreDivergence(divergence: DivergenceReport): number {
  const base    = 1 - divergence.divergence_rate;
  const penalty = divergence.critical_cases.length * 0.05;
  return parseFloat(Math.max(0, base - penalty).toFixed(4));
}

/**
 * Action stability: average (1 - instability_score) across emulator scenarios.
 */
function scoreActionStability(emulatorResults: EmulatorResult[]): number {
  if (emulatorResults.length === 0) return 1.0;
  const avg = emulatorResults.reduce(
    (s, r) => s + (1 - r.instability_score), 0
  ) / emulatorResults.length;
  return parseFloat(avg.toFixed(4));
}

/**
 * Tier stability: fraction of users with no flux instability.
 */
function scoreTierStability(tierResults: TierFluxResult[]): number {
  if (tierResults.length === 0) return 1.0;
  const stable = tierResults.filter(r => !r.tier_instability).length;
  return parseFloat((stable / tierResults.length).toFixed(4));
}

// ── Public API ────────────────────────────────────────────────────────────────

export function computeConsistencyScore(
  divergence:     DivergenceReport,
  emulatorResults: EmulatorResult[],
  tierResults:    TierFluxResult[]
): ConsistencyReport {
  const determinism_rate  = scoreDeterminism(divergence);
  const shadow_match_rate = scoreShadowMatch(divergence);
  const divergence_score  = scoreDivergence(divergence);
  const action_stability  = scoreActionStability(emulatorResults);
  const tier_stability    = scoreTierStability(tierResults);

  const rdcl_production_score = parseFloat((
    determinism_rate  * W.determinism  +
    shadow_match_rate * W.shadow_match +
    divergence_score  * W.divergence   +
    action_stability  * W.action_stab  +
    tier_stability    * W.tier_stab
  ).toFixed(4));

  // Stability index: equal-weight composite of the five signals
  const stability_index = parseFloat((
    (determinism_rate + shadow_match_rate + divergence_score +
     action_stability + tier_stability) / 5
  ).toFixed(4));

  return {
    rdcl_production_score,
    stability_index,
    production_ready: rdcl_production_score > PRODUCTION_THRESHOLD,
    breakdown: {
      determinism_rate,
      shadow_match_rate,
      divergence_score,
      action_stability,
      tier_stability,
    },
  };
}
