/**
 * Corvioz v1 — Activation Engine
 *
 * Public API for the first-success activation system.
 *
 * Complete usage pattern:
 *
 *   // 1. Initialize metrics session at login/page load
 *   startMetricsSession(userId);
 *   hydrateActivation(userId, persistedEvents);
 *
 *   // 2. Mark dashboard viewed
 *   trackActivation(userId, ACTIVATION_EVENTS.DASHBOARD_VIEWED);
 *
 *   // 3. Get the single next step
 *   const flow = runActivationFlow(userId);
 *   // → { prompt: 'PROMPT_FIRST_INVOICE', message: '...', action_route: '/dashboard?tool=invoice&mode=create' }
 *
 *   // 4. After user creates invoice:
 *   trackActivation(userId, ACTIVATION_EVENTS.FIRST_INVOICE_CREATED);
 *   recordActivationTime(userId, ACTIVATION_EVENTS.FIRST_INVOICE_CREATED);
 *
 *   // 5. Check first-success state
 *   const guard = ensureFirstSuccess({ hasCreatedInvoice: true, ... });
 *   // → { result: 'SUCCESS' }
 *
 *   // 6. Read metrics
 *   const m = getActivationMetrics(userId);
 *   // → { activation_completed: true, time_to_activation_ms: 42000 }
 */

export { ACTIVATION_EVENTS, ACTIVATION_LABELS, ACTIVATION_PATH, ACTIVATION_MINIMUM_SET } from './activation-events';
export type { ActivationEventType }               from './activation-events';

export { trackActivation, hasActivated, getActivatedEvents,
         isActivated, hydrateActivation, resetTracker }        from './activation-tracker';
export type { ActivationRecord }                               from './activation-tracker';

export { runActivationFlow, runActivationFlowFromState }       from './activation-orchestrator';
export type { ActivationPrompt, ActivationFlowResult }         from './activation-orchestrator';

export { ensureFirstSuccess, hasFirstSuccess,
         getFirstSuccessRoute }                                from './first-success-guard';
export type { FirstSuccessResult, FirstSuccessGuidance,
              UserSuccessState }                               from './first-success-guard';

export { ACTIVATION_ROUTES, ESSENTIAL_ROUTES,
         NON_ESSENTIAL_FOR_NEW_USERS,
         isNonEssentialForNewUser, getActivationRedirect }     from './activation-routes';

export { startMetricsSession, recordActivationTime,
         getActivationMetrics, activatedWithinTarget,
         resetMetrics }                                        from './activation-metrics';
export type { ActivationMetrics }                              from './activation-metrics';
