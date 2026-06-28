/**
 * Corvioz v1 — Activation Events
 *
 * Defines the canonical activation event vocabulary.
 * Activation = first successful user action ONLY.
 *
 * NOT engagement. NOT time spent. NOT clicks.
 * ONLY: first time a user creates something of value.
 */

/** Canonical activation event names */
export const ACTIVATION_EVENTS = {
  FIRST_INVOICE_CREATED: 'first_invoice_created',
  FIRST_QUOTE_CREATED:   'first_quote_created',
  FIRST_CLIENT_CREATED:  'first_client_created',
  DASHBOARD_VIEWED:      'dashboard_viewed',
} as const;

export type ActivationEventType =
  typeof ACTIVATION_EVENTS[keyof typeof ACTIVATION_EVENTS];

/**
 * Human-readable labels for each activation event.
 * Used in onboarding copy and progress indicators.
 */
export const ACTIVATION_LABELS: Record<ActivationEventType, string> = {
  first_invoice_created: 'Create your first invoice',
  first_quote_created:   'Generate your first quote',
  first_client_created:  'Add your first client',
  dashboard_viewed:      'See your workspace',
};

/**
 * The ordered activation path — user must complete these in sequence
 * to be considered "activated". Dashboard viewed is step 0 (automatic).
 */
export const ACTIVATION_PATH: ActivationEventType[] = [
  ACTIVATION_EVENTS.DASHBOARD_VIEWED,
  ACTIVATION_EVENTS.FIRST_INVOICE_CREATED,
] as const;

/**
 * The minimum activation set — completing ANY ONE of these
 * counts as a successful first activation.
 */
export const ACTIVATION_MINIMUM_SET: ActivationEventType[] = [
  ACTIVATION_EVENTS.FIRST_INVOICE_CREATED,
  ACTIVATION_EVENTS.FIRST_QUOTE_CREATED,
  ACTIVATION_EVENTS.FIRST_CLIENT_CREATED,
];
