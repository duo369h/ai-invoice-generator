export interface ArpuSignalInput {
  invoiceCount?: number;
  quoteCount?: number;
  exportCount?: number;
  clientCount?: number;
  featureUseCount?: number;
  planId?: string;
  daysActive?: number;
}

export interface ArpuSignal {
  type: 'high_invoice_frequency' | 'repeated_export_usage' | 'client_growth' | 'feature_saturation';
  strength: number;
  evidence: string;
}

export interface ArpuSignalResult {
  upgradeLikelihoodScore: number;
  signals: ArpuSignal[];
  recommendedPlan: 'starter' | 'pro' | 'studio' | null;
  revenueIntent: 'low' | 'medium' | 'high';
}

const paidPlans = new Set(['starter', 'pro', 'studio']);

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function signal(type: ArpuSignal['type'], strength: number, evidence: string): ArpuSignal {
  return { type, strength: clampScore(strength), evidence };
}

export function detectArpuSignals(input: ArpuSignalInput = {}): ArpuSignalResult {
  const invoiceCount = input.invoiceCount ?? 0;
  const quoteCount = input.quoteCount ?? 0;
  const exportCount = input.exportCount ?? 0;
  const clientCount = input.clientCount ?? 0;
  const featureUseCount = input.featureUseCount ?? 0;
  const daysActive = Math.max(1, input.daysActive ?? 30);
  const currentPlan = String(input.planId ?? 'free').toLowerCase();
  const workflowCount = invoiceCount + quoteCount;
  const signals: ArpuSignal[] = [];

  const monthlyWorkflowRate = (workflowCount / daysActive) * 30;
  if (monthlyWorkflowRate >= 6) {
    signals.push(signal('high_invoice_frequency', 30 + monthlyWorkflowRate * 5, `${workflowCount} quote/invoice workflows over ${daysActive} active days.`));
  }

  if (exportCount >= 2) {
    signals.push(signal('repeated_export_usage', 35 + exportCount * 8, `${exportCount} export attempts indicate client-delivery intent.`));
  }

  if (clientCount >= 3) {
    signals.push(signal('client_growth', 30 + clientCount * 7, `${clientCount} clients indicate expanding workflow complexity.`));
  }

  if (featureUseCount >= 5) {
    signals.push(signal('feature_saturation', 25 + featureUseCount * 6, `${featureUseCount} monetizable feature uses suggest plan ceiling pressure.`));
  }

  const rawScore = signals.reduce((sum, item) => sum + item.strength, 0) / Math.max(1, signals.length);
  const planAdjustment = paidPlans.has(currentPlan) ? -10 : 8;
  const upgradeLikelihoodScore = clampScore(rawScore + planAdjustment);
  const revenueIntent = upgradeLikelihoodScore >= 70 ? 'high' : upgradeLikelihoodScore >= 40 ? 'medium' : 'low';

  let recommendedPlan: ArpuSignalResult['recommendedPlan'] = null;
  if (currentPlan === 'free' && upgradeLikelihoodScore >= 40) recommendedPlan = 'pro';
  if (currentPlan === 'starter' && upgradeLikelihoodScore >= 70) recommendedPlan = 'pro';
  if ((currentPlan === 'pro' || currentPlan === 'starter') && clientCount >= 8) recommendedPlan = 'studio';

  return {
    upgradeLikelihoodScore,
    signals,
    recommendedPlan,
    revenueIntent,
  };
}
