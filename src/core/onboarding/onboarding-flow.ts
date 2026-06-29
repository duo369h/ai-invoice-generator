/**
 * Corvioz v1 — Onboarding Flow Engine
 *
 * Forces users to reach FIRST SUCCESS as fast as possible.
 * Linear flow only — no branching, no personalization, no AI.
 *
 * Steps:
 *   STEP_1_CREATE_ACCOUNT → STEP_2_GUIDE_DASHBOARD → STEP_3_FIRST_INVOICE_GUIDE
 *   → ONBOARDING_COMPLETE
 */

export type OnboardingStep =
  | 'STEP_1_CREATE_ACCOUNT'
  | 'STEP_2_GUIDE_DASHBOARD'
  | 'STEP_3_FIRST_INVOICE_GUIDE'
  | 'ONBOARDING_COMPLETE';

export interface OnboardingState {
  hasAccountCreated:      boolean;
  hasSeenDashboard:       boolean;
  hasCreatedFirstInvoice: boolean;
}

export interface OnboardingStepResult {
  step:         OnboardingStep;
  /** Copy shown to the user at this step */
  headline:     string;
  /** Supporting instruction */
  instruction:  string;
  /** CTA label for the primary button */
  cta:          string;
  /** Route to push on CTA click */
  cta_route:    string;
  /** Progress fraction 0.0–1.0 (for progress bar) */
  progress:     number;
}

// ── Step definitions ──────────────────────────────────────────────────────────

const STEP_CONFIG: Record<OnboardingStep, Omit<OnboardingStepResult, 'step'>> = {
  STEP_1_CREATE_ACCOUNT: {
    headline:    'Create your account',
    instruction: 'Sign up to save your invoices and quotes.',
    cta:         'Get started',
    cta_route:   '/signup',
    progress:    0.0,
  },
  STEP_2_GUIDE_DASHBOARD: {
    headline:    'Your workspace is ready',
    instruction: 'This is where you manage invoices, quotes, and clients.',
    cta:         'Create first invoice',
    cta_route:   '/dashboard?tool=invoice&mode=create',
    progress:    0.33,
  },
  STEP_3_FIRST_INVOICE_GUIDE: {
    headline:    'Create your first invoice',
    instruction: 'Add a client name, amount, and due date — takes under 60 seconds.',
    cta:         'Create invoice now',
    cta_route:   '/dashboard?tool=invoice&mode=create',
    progress:    0.66,
  },
  ONBOARDING_COMPLETE: {
    headline:    "You're ready",
    instruction: 'Your first invoice is created. You can now send it to your client.',
    cta:         'Go to dashboard',
    cta_route:   '/dashboard',
    progress:    1.0,
  },
};

function makeStep(step: OnboardingStep): OnboardingStepResult {
  return { step, ...STEP_CONFIG[step] };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the single current onboarding step.
 * Linear only — each call advances to the next uncompleted step.
 */
export function onboardingFlow(user: OnboardingState): OnboardingStepResult {
  if (!user.hasAccountCreated)      return makeStep('STEP_1_CREATE_ACCOUNT');
  if (!user.hasSeenDashboard)       return makeStep('STEP_2_GUIDE_DASHBOARD');
  if (!user.hasCreatedFirstInvoice) return makeStep('STEP_3_FIRST_INVOICE_GUIDE');
  return makeStep('ONBOARDING_COMPLETE');
}

/**
 * Returns a numeric progress value (0.0–1.0) for a given user state.
 * Useful for rendering a progress bar without invoking the full flow.
 */
export function getOnboardingProgress(user: OnboardingState): number {
  return onboardingFlow(user).progress;
}

/**
 * Returns true if the user has completed all onboarding steps.
 */
export function isOnboardingComplete(user: OnboardingState): boolean {
  return (
    user.hasAccountCreated &&
    user.hasSeenDashboard  &&
    user.hasCreatedFirstInvoice
  );
}
