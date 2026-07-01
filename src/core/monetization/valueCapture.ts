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
    badge: 'Output ready',
    headline: 'Your client-ready document is ready to send.',
    body: 'You already created the value. Upgrade when you need the clean PDF, client portal, and full delivery workflow without the preview watermark.',
    primaryCta: 'Unlock clean client delivery',
    secondaryCta: 'Download watermarked preview',
    roiAnchor: 'One accepted invoice can cover months of Pro.',
  },
  invoice_created: {
    badge: 'Invoice ready',
    headline: 'Your invoice is ready. Now unlock the delivery layer.',
    body: 'Keep the invoice moving with clean export, payment follow-up, and client-ready delivery instead of stopping at the draft.',
    primaryCta: 'Send this invoice cleanly',
    secondaryCta: 'Keep editing preview',
    roiAnchor: 'Pro is priced below the cost of one delayed follow-up.',
  },
  quote_generated: {
    badge: 'Quote ready',
    headline: 'The quote is ready. Keep the approval path moving.',
    body: 'Upgrade when you want the approved quote to become a clean invoice and client portal workflow.',
    primaryCta: 'Unlock quote-to-invoice workflow',
    secondaryCta: 'Keep preview version',
    roiAnchor: 'A single approved quote can pay back the workflow.',
  },
  usage_threshold: {
    badge: 'Workflow limit reached',
    headline: 'You are using Corvioz like a paid workflow now.',
    body: 'When exports, invoices, and clients repeat, Pro keeps the full system unlocked instead of forcing manual workarounds.',
    primaryCta: 'Unlock the full workflow',
    secondaryCta: 'Stay on preview mode',
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
  if (planId === 'starter') return 'Starter pays for itself when it helps one invoice leave on time.';
  if (planId === 'pro') return 'Pro is the delivery layer after value is already created.';
  if (planId === 'studio') return 'Studio is for teams where client delivery volume already justifies operations.';
  return 'Free is for proving value before payment.';
}
