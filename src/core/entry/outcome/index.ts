/**
 * Corvioz v1.5 — Entry Outcome Optimization Layer Barrel Index
 *
 * Public API for the outcome analysis system.
 */

export { analyzeEntryOutcome } from './ENTRY_OUTCOME_ANALYZER';
export { compareEntryPaths } from './ENTRY_PATH_COMPARATOR';
export { ENTRY_FRICTION_MAP } from './ENTRY_FRICTION_MAP';
export { scoreEntrySuccess } from './ENTRY_SUCCESS_SCORER';
export { recommendEntryImprovements } from './ENTRY_OPTIMIZER';
export { assertPostFreezeIntegrity } from './ENTRY_POST_FREEZE_GUARD';
export { getEntryOutcomeDashboard } from './ENTRY_OUTCOME_DASHBOARD';
export { assertOutcomeIsolation } from './OUTCOME_DEPENDENCY_GUARD';
export { OUTCOME_CONTRACT } from './OUTCOME_CONTRACT';
export { blockOutcomeInfluence } from './OUTCOME_INFLUENCE_BLOCKER';
export { assertUIIsolation } from './OUTCOME_UI_GUARD';
export { assertReadOnly } from './OUTCOME_READONLY_ENFORCER';
export { OUTCOME_SCOPE_LOCK } from './OUTCOME_SCOPE_LOCK';
export { assertOutcomeImmutable } from './OUTCOME_IMMUTABILITY_CONTRACT';
export { blockEscalation } from './OUTCOME_ESCALATION_GUARD';
export { sanitizeOutcomeForUI } from './OUTCOME_UI_BARRIER';


