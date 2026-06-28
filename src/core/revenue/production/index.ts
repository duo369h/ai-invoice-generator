/**
 * RDCL v3.3 — Production Reality Validation Layer
 *
 * Public API surface for the production stability engine.
 * Import from this index — do not import individual modules directly.
 *
 * Complete pipeline:
 *
 *   import { shadowExecute, computeDivergence, runBehaviorEmulator,
 *            checkActionFrequency, detectTierFlux, computeConsistencyScore,
 *            productionGate } from './production';
 *
 *   // 1. Shadow execution (alongside live path)
 *   const shadowResult = shadowExecute(event, userEvents, liveAction);
 *
 *   // 2. Divergence tracking (after batch of shadow executions)
 *   const divergence = computeDivergence();
 *
 *   // 3. Behavioral entropy emulation
 *   const emulatorResults = runBehaviorEmulator();
 *
 *   // 4. Action frequency governance (per user per action)
 *   const freq = checkActionFrequency(userId, action);
 *   if (!freq.action_allowed) { ... }  // caller honors suppression
 *
 *   // 5. Tier flux detection (per user event stream)
 *   const tierResults = users.map(u => detectTierFlux(u.id, u.events));
 *
 *   // 6. Aggregate consistency score
 *   const score = computeConsistencyScore(divergence, emulatorResults, tierResults);
 *
 *   // 7. Hard gate — throws if not safe for v3.4
 *   productionGate(score, divergence, tierResults);
 */

export { shadowExecute, getShadowLog, clearShadowLog }          from './shadow-mode-engine';
export type { ShadowResult, Action as ShadowAction }            from './shadow-mode-engine';

export { computeDivergence, computeDivergenceFromBatch }        from './divergence-tracker';
export type { DivergenceReport }                                 from './divergence-tracker';

export { runBehaviorEmulator }                                   from './real-behavior-emulator';
export type { EmulatorResult, RevenueEvent }                     from './real-behavior-emulator';

export { checkActionFrequency, resetFrequencyGuard,
         resetUserRecord, getUserFrequencyState }                from './action-frequency-guard';
export type { FrequencyCheckResult }                             from './action-frequency-guard';

export { detectTierFlux, detectBatchTierFlux,
         resetTierHistory, resetUserTierHistory }                from './tier-flux-detector';
export type { TierFluxResult }                                   from './tier-flux-detector';

export { computeConsistencyScore }                               from './consistency-score-engine';
export type { ConsistencyReport }                                from './consistency-score-engine';

export { productionGate, productionGateSafe }                   from './gate';
export type { GateResult }                                       from './gate';
