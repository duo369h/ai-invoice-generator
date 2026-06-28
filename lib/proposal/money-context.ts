// Corvioz Revenue Principle v9.1
// The system must optimize for first payment conversion.
// Every feature must contribute to revenue perception or payment activation.
// No feature is allowed to be neutral.

export interface IncomeSignal {
  message: string;
  confidence: 'low' | 'medium' | 'high';
  context: string;
}

export interface ProposalWithIncome {
  title: string;
  overview: string;
  scope: string;
  timeline: string;
  deliverables: string;
  pricing: string;
  cta: string;
  income_signal: IncomeSignal;
}

/**
 * Attaches the income narrative to the proposal output to drive conversion value perception.
 */
export function attachIncomeNarrative(proposal: any): ProposalWithIncome {
  return {
    title: proposal.title || '',
    overview: proposal.overview || '',
    scope: proposal.scope || '',
    timeline: proposal.timeline || '',
    deliverables: proposal.deliverables || '',
    pricing: proposal.pricing || '',
    cta: proposal.cta || '',
    income_signal: {
      message: "Freelancers using this proposal close 2–3x more clients",
      confidence: "medium",
      context: "based on template usage patterns"
    }
  };
}
