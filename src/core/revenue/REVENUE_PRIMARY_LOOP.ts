/**
 * Corvioz — Revenue Primary Loop
 *
 * Enforces the singular, primary revenue generation track:
 * Proposal → AI Optimize → Client Decision → Win → Invoice → Payment → Revenue Proof
 *
 * RULES:
 *  - NO standalone invoice creation outside a proposal context
 *  - NO standalone quote creation
 *  - NO dashboard revenue entries without proposal origin
 *  - NO standalone monetization decisions
 */

export const ONLY_REVENUE_PATH = "PROPOSAL_LOOP";

export interface RevenuePathContext {
  /** The subsystem initiating the request or entry */
  source?: 'proposal' | 'invoice' | 'quote' | 'dashboard' | 'monetization' | string;
  /** Whether there is a validated parent proposal linked to this action */
  hasProposalParent?: boolean;
  /** The specific action being performed */
  action?: string;
  /** Trigger identifier */
  trigger?: string;
}

export interface RevenuePathValidationResult {
  allowed: boolean;
  redirect?: string;
}

/**
 * Validates whether the incoming action or entry context conforms to the
 * single primary proposal loop.
 *
 * If triggered by any non-compliant path, it enforces redirect to dashboard quote mode.
 */
export function validateRevenuePath(context: RevenuePathContext = {}): RevenuePathValidationResult {
  const source = context.source || '';
  const action = context.action || '';
  const hasProposalParent = context.hasProposalParent === true;

  // Standalone checks
  const isStandaloneInvoice = (source === 'invoice' || action === 'create_invoice') && !hasProposalParent;
  const isStandaloneQuote = (source === 'quote' || action === 'create_quote') && !hasProposalParent;
  const isDashboardRevenueEntry = source === 'dashboard' && (action === 'revenue_entry' || action === 'add_revenue');
  const isStandaloneMonetization = source === 'monetization' && action === 'standalone_decision';

  if (isStandaloneInvoice || isStandaloneQuote || isDashboardRevenueEntry || isStandaloneMonetization) {
    return {
      allowed: false,
      redirect: "/dashboard?tool=quote&mode=create"
    };
  }

  return {
    allowed: true
  };
}
