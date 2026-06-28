/**
 * Corvioz v1.6.1 — Hard Freeze Outcome Functional Scope
 *
 * Enforces scope limitations ensuring outcome layer cannot evolve into a decision system.
 */

export const OUTCOME_SCOPE_LOCK = {
  canObserve: true,
  canScore: true,
  canRecommend: false,
  canInfluenceUI: false,
  canInfluenceRouting: false,
  canInfluenceActivation: false
};
