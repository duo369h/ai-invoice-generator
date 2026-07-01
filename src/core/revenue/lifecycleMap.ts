export type RevenueLifecycleStage =
  | 'activation'
  | 'value_realization'
  | 'expansion'
  | 'retention'
  | 'upgrade_readiness';

export interface RevenueLifecycleInput {
  invoiceCount?: number;
  quoteCount?: number;
  exportCount?: number;
  clientCount?: number;
  daysActive?: number;
  lastActiveDaysAgo?: number;
  planId?: string;
}

export interface RevenueLifecycleState {
  stage: RevenueLifecycleStage;
  score: number;
  reasons: string[];
  nextBestRevenueAction: string;
}

const paidPlans = new Set(['starter', 'pro', 'studio']);

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function resolveRevenueLifecycleStage(input: RevenueLifecycleInput = {}): RevenueLifecycleState {
  const invoiceCount = input.invoiceCount ?? 0;
  const quoteCount = input.quoteCount ?? 0;
  const exportCount = input.exportCount ?? 0;
  const clientCount = input.clientCount ?? 0;
  const daysActive = input.daysActive ?? 0;
  const lastActiveDaysAgo = input.lastActiveDaysAgo ?? 0;
  const isPaid = paidPlans.has(String(input.planId ?? '').toLowerCase());
  const workflowVolume = invoiceCount + quoteCount;
  const reasons: string[] = [];

  if (workflowVolume === 0 && exportCount === 0) {
    reasons.push('User has not created a billable workflow yet.');
    return {
      stage: 'activation',
      score: clampScore(10 + daysActive),
      reasons,
      nextBestRevenueAction: 'Guide user to create the first invoice or quote before showing paid pressure.',
    };
  }

  if (workflowVolume > 0 && exportCount === 0) {
    reasons.push('User created value but has not reached export monetization yet.');
    return {
      stage: 'value_realization',
      score: clampScore(30 + workflowVolume * 8 + clientCount * 4),
      reasons,
      nextBestRevenueAction: 'Show outcome preview and prepare export-to-payment bridge.',
    };
  }

  if (!isPaid && (exportCount >= 2 || clientCount >= 3 || workflowVolume >= 5)) {
    reasons.push('Free user shows repeated workflow value and should receive contextual upgrade guidance.');
    return {
      stage: 'upgrade_readiness',
      score: clampScore(65 + exportCount * 6 + clientCount * 5 + workflowVolume * 3),
      reasons,
      nextBestRevenueAction: 'Recommend paid plan based on repeated export and client workflow usage.',
    };
  }

  if (isPaid && (clientCount >= 5 || workflowVolume >= 12 || exportCount >= 8)) {
    reasons.push('Paid user shows scaling behavior and may benefit from expansion prompts.');
    return {
      stage: 'expansion',
      score: clampScore(60 + clientCount * 4 + exportCount * 3 + workflowVolume * 2),
      reasons,
      nextBestRevenueAction: 'Surface higher-capacity workflow benefits without changing plan rules.',
    };
  }

  if (isPaid || lastActiveDaysAgo <= 14) {
    reasons.push('User has realized recurring value and should be retained through workflow completion cues.');
    return {
      stage: 'retention',
      score: clampScore(45 + workflowVolume * 3 + exportCount * 4),
      reasons,
      nextBestRevenueAction: 'Reinforce saved time, client-ready delivery, and continued workflow momentum.',
    };
  }

  reasons.push('User is inactive after initial value and needs value-recall messaging.');
  return {
    stage: 'retention',
    score: clampScore(25 + workflowVolume * 2),
    reasons,
    nextBestRevenueAction: 'Use non-invasive value recall before any upgrade suggestion.',
  };
}
