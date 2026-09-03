import { trackPaywallView, trackFeatureBlocked } from '../monetization/revenueEvents';
import { isFeatureBlocked, UsageStats } from '../usage/usageLimiter';
import { shadowValidatePlanRead } from '../../src/core/state/planStateAdapter';
import { recordDecisionTelemetry } from '../../src/core/telemetry/decisionTelemetry';

export interface PaywallTriggerResult {
  shouldBlock: boolean;
  prefilledPlan: 'pro' | 'agency';
  title: string;
  description: string;
  lockedFeatureValue: string;
  psychologicalCopy: {
    workflowClose: string;
    noInterruption: string;
    socialProof: string;
  };
}

export const PSYCHOLOGICAL_COPY = {
  workflowClose: "You are close to completing your workflow",
  noInterruption: "Unlock to continue without interruption",
  socialProof: "Most freelancers upgrade at this stage",
};

export function evaluatePaywallTrigger(
  featureKey: string,
  usage: UsageStats,
  userPlan: string,
  triggerSource: string
): PaywallTriggerResult {
  if (process.env.NODE_ENV !== 'production') {
    shadowValidatePlanRead(
      `paywall.${featureKey}`,
      userPlan,
      { explicitPlan: userPlan },
      'lib/paywall/paywallEngine.ts:evaluatePaywallTrigger',
      console,
    );
  }
  const isBlocked = isFeatureBlocked(featureKey, usage, userPlan);

  if (!isBlocked) {
    const result: PaywallTriggerResult = {
      shouldBlock: false,
      prefilledPlan: 'pro',
      title: '',
      description: '',
      lockedFeatureValue: '',
      psychologicalCopy: PSYCHOLOGICAL_COPY,
    };
    recordDecisionTelemetry({
      source: 'lib/paywall/paywallEngine.ts:evaluatePaywallTrigger',
      decisionType: featureKey === 'export_pdf' ? 'export permission' : 'paywall decision',
      legacyOutput: result,
      adapterOutput: { featureKey, usage, userPlan, result },
      tags: ['PAYWALL', featureKey === 'export_pdf' ? 'EXPORT_PERMISSION' : 'FEATURE_GATE', 'LOG_ONLY', 'v5.2.1'],
    });
    return result;
  }

  // Track feature blocked and paywall view
  trackFeatureBlocked(triggerSource, featureKey);
  trackPaywallView(triggerSource, featureKey, 'pro');

  let title = "Upgrade to Corvioz Pro";
  let description = "Unlock unlimited professional tools and grow your freelance business.";
  let lockedFeatureValue = "Unlimited clients, quotes, and invoices";

  switch (featureKey) {
    case 'create_invoice':
      title = "Unlock unlimited invoices";
      description = `You've reached the free tier limit of ${usage.invoicesCount} invoices. Most freelancers upgrade at this stage to continue billing clients without interruption.`;
      lockedFeatureValue = "Unlimited client billing and direct online payments";
      break;
    case 'create_quote':
      title = "Professional proposal features locked";
      description = `You've reached the free tier limit of ${usage.quotesCount} quote. Lock in more client projects without proposal limits.`;
      lockedFeatureValue = "Unlimited proposal quotes and real-time approval tracking";
      break;
    case 'export_pdf':
      title = "Watermark-free PDF exports locked";
      description = "Present your business professionally. Remove the Corvioz watermark and download beautiful PDFs.";
      lockedFeatureValue = "Watermark-free high-resolution PDF exports with custom branding";
      break;
    case 'send_invoice':
      title = "Professional sending features locked";
      description = "Seamlessly deliver invoices via email and secure web links directly to clients.";
      lockedFeatureValue = "Direct email sending, secure tracking, and client portal integrations";
      break;
    case 'client_portal':
      title = "Client portal access locked";
      description = "Give your clients a unified, premium workspace to review proposals, invoices, and discussion history.";
      lockedFeatureValue = "Interactive client feedback channels and secure portal logins";
      break;
  }

  const result: PaywallTriggerResult = {
    shouldBlock: true,
    prefilledPlan: 'pro',
    title,
    description,
    lockedFeatureValue,
    psychologicalCopy: PSYCHOLOGICAL_COPY,
  };
  recordDecisionTelemetry({
    source: 'lib/paywall/paywallEngine.ts:evaluatePaywallTrigger',
    decisionType: featureKey === 'export_pdf' ? 'export permission' : 'paywall decision',
    legacyOutput: result,
    adapterOutput: { featureKey, usage, userPlan, result },
    tags: ['PAYWALL', featureKey === 'export_pdf' ? 'EXPORT_PERMISSION' : 'FEATURE_GATE', 'LOG_ONLY', 'v5.2.1'],
  });
  return result;
}
