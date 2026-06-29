/**
 * Corvioz v1 — Activation Funnel Orchestrator
 *
 * Determines the single next action a user should take to reach activation.
 * Returns ONE prompt at a time. No branching. No AI. No multi-CTA output.
 *
 * Flow:
 *   landing → dashboard → create invoice / quote / client → activation success
 *
 * RULE:
 *   - ONE prompt at a time
 *   - NO multiple CTAs
 *   - NO AI decisions
 *   - Linear progression only
 */

import { ACTIVATION_EVENTS } from './activation-events';
import { hasActivated, isActivated } from './activation-tracker';

export type ActivationPrompt =
  | 'SHOW_DASHBOARD_GUIDE'
  | 'PROMPT_FIRST_INVOICE'
  | 'PROMPT_FIRST_QUOTE'
  | 'PROMPT_FIRST_CLIENT'
  | 'ACTIVATION_COMPLETE';

export interface ActivationFlowResult {
  prompt:       ActivationPrompt;
  /** Human-readable instruction shown to the user */
  message:      string;
  /** The route the UI should navigate to for this prompt */
  action_route: string;
}

const PROMPTS: Record<ActivationPrompt, Omit<ActivationFlowResult, 'prompt'>> = {
  SHOW_DASHBOARD_GUIDE: {
    message:      'Welcome to Corvioz. Let\'s set up your workspace.',
    action_route: '/dashboard',
  },
  PROMPT_FIRST_INVOICE: {
    message:      'Create your first invoice and get paid.',
    action_route: '/dashboard?tool=invoice&mode=create',
  },
  PROMPT_FIRST_QUOTE: {
    message:      'Send your first quote to a client.',
    action_route: '/dashboard?tool=quote&mode=create',
  },
  PROMPT_FIRST_CLIENT: {
    message:      'Add a client to start your workspace.',
    action_route: '/dashboard?action=create-client',
  },
  ACTIVATION_COMPLETE: {
    message:      'You\'re set up. Your workspace is ready.',
    action_route: '/dashboard',
  },
};

function makeResult(prompt: ActivationPrompt): ActivationFlowResult {
  return { prompt, ...PROMPTS[prompt] };
}

/**
 * Returns the single next activation step for a user.
 * Evaluates state linearly — no branching, no personalization.
 *
 * @param userId - The user's stable ID
 */
export function runActivationFlow(userId: string): ActivationFlowResult {
  // Step 0: User must see the dashboard first
  if (!hasActivated(userId, ACTIVATION_EVENTS.DASHBOARD_VIEWED)) {
    return makeResult('SHOW_DASHBOARD_GUIDE');
  }

  // Step 1: Primary goal — create an invoice
  if (!hasActivated(userId, ACTIVATION_EVENTS.FIRST_INVOICE_CREATED)) {
    return makeResult('PROMPT_FIRST_INVOICE');
  }

  // Activation complete — user has reached first success
  return makeResult('ACTIVATION_COMPLETE');
}

/**
 * Stateless variant — accepts an explicit user state object rather than
 * reading from the tracker. Use in UI components and server-rendered pages.
 */
export function runActivationFlowFromState(user: {
  hasSeenDashboard:    boolean;
  hasCreatedInvoice:   boolean;
  hasCreatedQuote?:    boolean;
  hasCreatedClient?:   boolean;
}): ActivationFlowResult {
  if (!user.hasSeenDashboard)  return makeResult('SHOW_DASHBOARD_GUIDE');
  if (!user.hasCreatedInvoice) return makeResult('PROMPT_FIRST_INVOICE');
  return makeResult('ACTIVATION_COMPLETE');
}
