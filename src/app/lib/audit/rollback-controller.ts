export type RollbackDomain = 'paywall' | 'pricing' | 'funnel';

export type RollbackControllerInput = {
  domains?: RollbackDomain[];
  reason?: string;
  dry_run?: boolean;
};

export type RollbackStep = {
  domain: RollbackDomain;
  action: string;
  safe_mode: boolean;
};

export type RollbackControllerResult = {
  ready: boolean;
  applied: boolean;
  steps: RollbackStep[];
  reason: string;
};

const DEFAULT_DOMAINS: RollbackDomain[] = ['paywall', 'pricing', 'funnel'];

function normalizeDomains(domains?: RollbackDomain[]) {
  if (!Array.isArray(domains) || domains.length === 0) return DEFAULT_DOMAINS;
  return Array.from(new Set(domains.filter((domain) => DEFAULT_DOMAINS.includes(domain))));
}

function stepFor(domain: RollbackDomain): RollbackStep {
  if (domain === 'paywall') {
    return {
      domain,
      action: 'revert paywall rules to soft upsell only and disable hard blocking in activation flows',
      safe_mode: true,
    };
  }

  if (domain === 'pricing') {
    return {
      domain,
      action: 'revert pricing changes to standard tier order and remove dynamic urgency adjustments',
      safe_mode: true,
    };
  }

  return {
    domain,
    action: 'revert funnel modifications to landing -> signup -> dashboard -> invoice -> payment baseline',
    safe_mode: true,
  };
}

export function createRollbackPlan(input: RollbackControllerInput = {}): RollbackControllerResult {
  const domains = normalizeDomains(input.domains);
  const steps = domains.map(stepFor);

  return {
    ready: steps.length > 0 && steps.every((step) => step.safe_mode),
    applied: input.dry_run !== false ? false : steps.length > 0,
    steps,
    reason: input.reason || 'Rollback controller is ready for paywall, pricing, and funnel safety recovery.',
  };
}
