/**
 * RDCL v3.3 — Production Gate v2 (Final Safety Lock)
 *
 * Hard enforcement checkpoint before advancing to v3.4.
 * System CANNOT proceed unless ALL conditions pass:
 *
 *   ✓ rdcl_production_score > 0.95
 *   ✓ divergence_rate < 0.02
 *   ✓ tier_instability === false (no user in flux)
 *
 * Throws on first failure with a precise blocker message.
 * Also provides a non-throwing variant for monitoring dashboards.
 *
 * RULE: No RDCL modifications. This is a read-and-enforce layer only.
 */

import { ConsistencyReport }  from './consistency-score-engine';
import { DivergenceReport }   from './divergence-tracker';
import { TierFluxResult }     from './tier-flux-detector';

export interface GateResult {
  passed:   boolean;
  score:    number;
  blockers: string[];
}

// ── Gate thresholds ───────────────────────────────────────────────────────────

const GATE = {
  MIN_SCORE:        0.95,
  MAX_DIVERGENCE:   0.02,
  ALLOW_TIER_FLUX:  false, // zero tolerance for tier instability
} as const;

// ── Condition checkers ────────────────────────────────────────────────────────

function checkScore(report: ConsistencyReport): string | null {
  if (report.rdcl_production_score <= GATE.MIN_SCORE) {
    return (
      `BLOCKER: rdcl_production_score=${report.rdcl_production_score} ` +
      `must be > ${GATE.MIN_SCORE} to enter v3.4`
    );
  }
  return null;
}

function checkDivergence(divergence: DivergenceReport): string | null {
  if (divergence.divergence_rate >= GATE.MAX_DIVERGENCE) {
    return (
      `BLOCKER: divergence_rate=${divergence.divergence_rate} ` +
      `must be < ${GATE.MAX_DIVERGENCE} (current: ${divergence.critical_cases.length} critical case(s))`
    );
  }
  return null;
}

function checkTierStability(tierResults: TierFluxResult[]): string | null {
  const unstable = tierResults.filter(r => r.tier_instability);
  if (unstable.length > 0) {
    const details = unstable
      .map(r => `  • user_id="${r.user_id}" flip_count=${r.flip_count}: ${r.flagged_reason}`)
      .join('\n');
    return `BLOCKER: ${unstable.length} user(s) in tier instability:\n${details}`;
  }
  return null;
}

// ── Gate collectors ───────────────────────────────────────────────────────────

function collectBlockers(
  report:     ConsistencyReport,
  divergence: DivergenceReport,
  tierResults: TierFluxResult[]
): string[] {
  return [
    checkScore(report),
    checkDivergence(divergence),
    checkTierStability(tierResults),
  ].filter((b): b is string => b !== null);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Hard gate — throws if system is NOT safe for v3.4.
 * Call this as the final step before enabling any v3.4 features.
 *
 * @throws Error with full blocker list on any failure
 * @returns true if all conditions pass
 */
export function productionGate(
  report:      ConsistencyReport,
  divergence:  DivergenceReport,
  tierResults: TierFluxResult[]
): true {
  const blockers = collectBlockers(report, divergence, tierResults);

  if (blockers.length > 0) {
    throw new Error(
      `RDCL NOT SAFE FOR REAL WORLD TRAFFIC\n\n` +
      `Score: ${report.rdcl_production_score} | ` +
      `Divergence: ${divergence.divergence_rate} | ` +
      `Tier flux users: ${tierResults.filter(r => r.tier_instability).length}\n\n` +
      `Blockers:\n${blockers.map(b => `  ✗ ${b}`).join('\n\n')}`
    );
  }

  console.info(
    `[RDCL PRODUCTION GATE v2] ✓ PASSED — ` +
    `score=${report.rdcl_production_score}, ` +
    `divergence=${divergence.divergence_rate}, ` +
    `tier_flux=${tierResults.filter(r => r.tier_instability).length} users`
  );

  return true;
}

/**
 * Non-throwing variant — returns a structured result object.
 * Use for monitoring dashboards and reporting pipelines.
 */
export function productionGateSafe(
  report:      ConsistencyReport,
  divergence:  DivergenceReport,
  tierResults: TierFluxResult[]
): GateResult {
  const blockers = collectBlockers(report, divergence, tierResults);
  return {
    passed:   blockers.length === 0,
    score:    report.rdcl_production_score,
    blockers,
  };
}
