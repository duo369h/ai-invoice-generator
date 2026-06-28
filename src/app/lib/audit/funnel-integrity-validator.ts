import { evaluatePaywallSafety } from '../validation/paywall-safety-guard';

export type FunnelTransition = {
  from: string;
  to: string;
  redirect_ok?: boolean;
  blocked?: boolean;
  paywall_action?: string;
  reason?: string;
};

export type FunnelIntegrityInput = {
  transitions?: FunnelTransition[];
};

export type FunnelIntegrityResult = {
  stable: boolean;
  stability_score: number;
  broken_redirects: string[];
  blocked_flows: string[];
  unintended_paywalls: string[];
};

const REQUIRED_TRANSITIONS: FunnelTransition[] = [
  { from: 'landing', to: 'signup', redirect_ok: true },
  { from: 'signup', to: 'dashboard', redirect_ok: true },
  { from: 'dashboard', to: 'invoice', redirect_ok: true },
  { from: 'invoice', to: 'payment', redirect_ok: true },
];

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function transitionKey(from: unknown, to: unknown) {
  return `${normalize(from)}->${normalize(to)}`;
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

export function validateFunnelIntegrity(input: FunnelIntegrityInput = {}): FunnelIntegrityResult {
  const provided = Array.isArray(input.transitions) && input.transitions.length > 0
    ? input.transitions
    : REQUIRED_TRANSITIONS;
  const providedByKey = new Map(provided.map((transition) => [transitionKey(transition.from, transition.to), transition]));
  const transitions = REQUIRED_TRANSITIONS.map((required) => providedByKey.get(transitionKey(required.from, required.to)) || {
    ...required,
    redirect_ok: false,
    reason: 'Required funnel transition missing from audit input.',
  });

  const brokenRedirects: string[] = [];
  const blockedFlows: string[] = [];
  const unintendedPaywalls: string[] = [];

  transitions.forEach((transition) => {
    const key = transitionKey(transition.from, transition.to);
    if (transition.redirect_ok === false) brokenRedirects.push(key);
    if (transition.blocked) blockedFlows.push(key);

    const safety = evaluatePaywallSafety({
      funnel_step: transition.from,
      action_type: transition.to === 'invoice' ? 'invoice_create_start' : transition.to,
      recommended_action: transition.blocked ? 'block' : 'allow',
      paywall_action: transition.paywall_action,
      invoice_create_count: transition.to === 'invoice' ? 0 : 1,
    });
    if (!safety.allowed || normalize(transition.paywall_action) === 'hard_paywall') {
      unintendedPaywalls.push(`${key}: ${safety.reason || transition.reason || 'Unintended paywall risk detected.'}`);
    }
  });

  const issueCount = brokenRedirects.length + blockedFlows.length + unintendedPaywalls.length;
  const stabilityScore = Math.max(0, Math.round(100 - issueCount * 18));

  return {
    stable: issueCount === 0,
    stability_score: stabilityScore,
    broken_redirects: unique(brokenRedirects),
    blocked_flows: unique(blockedFlows),
    unintended_paywalls: unique(unintendedPaywalls),
  };
}
