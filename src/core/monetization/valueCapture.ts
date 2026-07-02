export type MonetizationMoment =
  | 'post_export'
  | 'invoice_created'
  | 'quote_generated'
  | 'usage_threshold'
  | 'client_signal';

export type ValueCaptureMessage = {
  badge: string;
  headline: string;
  body: string;
  primaryCta: string;
  secondaryCta: string;
  roiAnchor: string;
};

const messages: Record<MonetizationMoment, ValueCaptureMessage> = {
  post_export: {
    badge: 'Document preview ready',
    headline: 'Your client-ready document preview is ready.',
    body: 'You already created the value. Upgrade when you need the clean PDF, client portal, and full delivery workflow without the preview watermark.',
    primaryCta: 'Unlock Clean Export',
    secondaryCta: 'Download Watermarked Preview',
    roiAnchor: 'Upgrade when clean client delivery saves repeated admin time.',
  },
  invoice_created: {
    badge: 'Document ready',
    headline: 'Your document is ready. Unlock the delivery workflow when you need it.',
    body: 'Keep the client document moving with clean export, client portal access, and organized follow-up.',
    primaryCta: 'Export clean client document',
    secondaryCta: 'Keep editing preview',
    roiAnchor: 'Pro is designed for repeated client delivery workflows.',
  },
  quote_generated: {
    badge: 'Quote ready',
    headline: 'The quote is ready. Keep the approval path organized.',
    body: 'Upgrade when approved quotes need clean documents, client links, and connected delivery records.',
    primaryCta: 'Unlock Client Workflow',
    secondaryCta: 'Keep Preview Version',
    roiAnchor: 'Use Pro when quote follow-up becomes a repeated workflow.',
  },
  usage_threshold: {
    badge: 'Workflow limit reached',
    headline: 'Your client workflow is ready for more structure.',
    body: 'Upgrade when clean exports, client links, and organized delivery records become part of your regular workflow.',
    primaryCta: 'Upgrade Workspace',
    secondaryCta: 'Continue Preview',
    roiAnchor: 'Upgrade when repeated delivery costs more time than the plan.',
  },
  client_signal: {
    badge: 'Client workflow active',
    headline: 'You have client work worth keeping organized.',
    body: 'Upgrade when client delivery, clean documents, and follow-up history need to stay connected.',
    primaryCta: 'Unlock client-ready workflow',
    secondaryCta: 'Continue with preview',
    roiAnchor: 'The plan is anchored to client delivery, not feature collecting.',
  },
};

export function getValueCaptureMessage(moment: MonetizationMoment): ValueCaptureMessage {
  return messages[moment] ?? messages.post_export;
}

export function getPaymentTriggerMoment(input: {
  actionName?: string;
  documentType?: string;
  exportAttempts?: number;
  clientsCount?: number;
} = {}): MonetizationMoment {
  if ((input.exportAttempts ?? 0) >= 2) return 'usage_threshold';
  if ((input.clientsCount ?? 0) > 0) return 'client_signal';
  if (input.actionName === 'create_invoice' || input.documentType === 'invoice') return 'invoice_created';
  if (input.actionName === 'create_quote' || input.documentType === 'quote') return 'quote_generated';
  return 'post_export';
}

export function getPricingAnchorCopy(planId: string): string {
  if (planId === 'starter') return 'Best for organizing early client work with a consistent process.';
  if (planId === 'pro') return 'Pro is the delivery layer after value is already created.';
  if (planId === 'studio') return 'Studio is for teams where client delivery volume already justifies operations.';
  return 'Best for exploring the workflow before client volume grows.';
}
