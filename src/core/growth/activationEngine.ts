export type ActivationInput = {
  hasCreatedQuote?: boolean;
  hasCreatedInvoice?: boolean;
  hasExportedDocument?: boolean;
  selectedPlan?: string;
  intendedAction?: 'invoice' | 'quote' | 'proposal' | 'profile';
};

export type ActivationRecommendation = {
  status: 'not_started' | 'first_action_ready' | 'activated';
  suggestedAction: 'create_quote' | 'create_invoice' | 'export_document' | 'open_dashboard';
  headline: string;
  reason: string;
};

export function getActivationRecommendation(input: ActivationInput = {}): ActivationRecommendation {
  if (input.hasExportedDocument || input.hasCreatedInvoice) {
    return {
      status: 'activated',
      suggestedAction: 'open_dashboard',
      headline: 'Activation reached',
      reason: 'A revenue-facing document exists and can be followed up from the dashboard.',
    };
  }

  if (input.hasCreatedQuote) {
    return {
      status: 'first_action_ready',
      suggestedAction: 'create_invoice',
      headline: 'Convert the approved quote into an invoice',
      reason: 'The fastest next value moment is invoice creation from the quote.',
    };
  }

  if (input.intendedAction === 'invoice') {
    return {
      status: 'not_started',
      suggestedAction: 'create_invoice',
      headline: 'Create the first invoice',
      reason: 'The user arrived with invoice intent, so skip broad setup messaging.',
    };
  }

  return {
    status: 'not_started',
    suggestedAction: 'create_quote',
    headline: 'Create the first client quote',
    reason: 'A quote is the lowest-friction start to the Corvioz revenue workflow.',
  };
}
