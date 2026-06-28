// Corvioz Revenue Principle v9.1
// The system must optimize for first payment conversion.
// Every feature must contribute to revenue perception or payment activation.
// No feature is allowed to be neutral.

import { NextResponse } from 'next/server';
import { getRequestUser, writeAuditLog } from '../../../lib/supabase';
import { rateLimitAuthenticated } from '../../../lib/rate-limit';
import { requestContextResponse, getIp } from '../../../lib/security';
import { checkRevenueLock } from '../../../../../lib/revenue/revenueLock';
import { attachIncomeNarrative } from '../../../../../lib/proposal/money-context';
import { getPricingIntelligence } from '../../../../core/pricing/PRICING_INTELLIGENCE_ENGINE';
import { getRevenueDecision } from '../../../../core/revenue/REVENUE_DECISION_ENGINE';

function fallbackProposalParse(serviceType, description, clientContext) {
  const service = serviceType || 'Freelance Services';
  const desc = description || 'Project implementation and support';
  const client = clientContext || 'Valued Client';

  return {
    title: `${service} Proposal for ${client}`,
    overview: `Overview of the project for ${client}. We understand you require ${desc} for your ${service} needs. Our team is ready to deliver a high-quality solution to meet your goals.`,
    scope: `Detailed scope of services for ${service}:\n- Kickoff and requirements analysis\n- Design and wireframing\n- Implementation and core development\n- Quality assurance and feedback loops\n- Final handoff, launch support, and code transfer`,
    timeline: `- **Week 1**: Kickoff & Scoping\n- **Week 2-3**: Execution & Development Phase\n- **Week 4**: QA, Revisions & Final Handoff`,
    deliverables: `- Production-ready ${service} source files\n- System setup & deployment guidelines\n- 2 rounds of design/implementation revisions\n- 14 days of post-launch direct support`,
    explanation_text: 'Pricing is calculated by the deterministic pricing engine and returned separately from proposal copy.',
    cta: `To proceed, please schedule a kickoff call or reply directly to this proposal to sign off and begin development.`
  };
}

function stripRevenueOutputFields(value) {
  if (!value || typeof value !== 'object') return value;

  const blockedKeys = new Set([
    'price',
    'recommended_price',
    'recommendedPrice',
    'pricing',
    'pricing_reason',
    'pricingReason',
    'pricing_suggestion',
    'pricingSuggestion',
    'ai_pricing_suggestion',
    'aiPricingSuggestion',
  ]);

  if (Array.isArray(value)) {
    return value.map(stripRevenueOutputFields);
  }

  return Object.entries(value).reduce((acc, [key, child]) => {
    if (!blockedKeys.has(key)) {
      acc[key] = stripRevenueOutputFields(child);
    }
    return acc;
  }, {});
}

export async function POST(request) {
  try {
    const ip = getIp(request);
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'proposal generation');
    if (contextFailure) return contextFailure;

    const limitResult = await rateLimitAuthenticated('quoteGenerate', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json(
        { error: limitResult.error || 'Too many requests. Please try again later.' },
        { status: limitResult.status || 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { service_type, description, client_context } = body;

    if (!service_type || !description) {
      return NextResponse.json({ error: 'Service type and project description are required.' }, { status: 400 });
    }

    // 1. Check Revenue Lock
    const lockResult = await checkRevenueLock(context.user.id, 'proposal');
    if (!lockResult.allowed) {
      return NextResponse.json(
        { error: lockResult.reason, code: 'REVENUE_LOCK_BLOCKED', suggestedUpgrade: lockResult.suggestedUpgrade },
        { status: 403 }
      );
    }

    const parsedProposal = stripRevenueOutputFields(
      fallbackProposalParse(service_type, description, client_context)
    );

    // 4. Log the audit event to record daily limits
    if (context.mode === 'supabase') {
      await writeAuditLog(context.supabase, {
        userId: context.user.id,
        action: 'proposal_generated',
        resourceType: 'proposal',
        resourceId: context.user.id,
        ip
      });
    }

    // Calculate pricing suggestions based on proposal context
    let jobType = 'web_design';
    const sType = (service_type || '').toLowerCase();
    if (sType.includes('ui') || sType.includes('ux') || sType.includes('design')) {
      jobType = sType.includes('web') ? 'web_design' : 'ui_ux';
    } else if (sType.includes('logo') || sType.includes('brand')) {
      jobType = 'logo';
    } else if (sType.includes('invoice') || sType.includes('billing') || sType.includes('system') || sType.includes('code') || sType.includes('dev')) {
      jobType = 'invoice_system';
    } else if (sType.includes('marketing') || sType.includes('seo') || sType.includes('growth')) {
      jobType = 'marketing';
    }

    let clientType = 'small_business';
    const cContext = (client_context || '').toLowerCase();
    if (cContext.includes('enterprise') || cContext.includes('corporate') || cContext.includes('large')) {
      clientType = 'enterprise';
    } else if (cContext.includes('startup') || cContext.includes('vc')) {
      clientType = 'startup';
    } else if (cContext.includes('individual') || cContext.includes('personal') || cContext.includes('freelancer')) {
      clientType = 'individual';
    }

    let urgency = 'medium';
    const descLower = (description || '').toLowerCase();
    if (descLower.includes('urgent') || descLower.includes('asap') || descLower.includes('rush') || descLower.includes('quick')) {
      urgency = 'high';
    } else if (descLower.includes('flexible') || descLower.includes('later') || descLower.includes('slow')) {
      urgency = 'low';
    }

    let clarity = 'medium';
    if (descLower.includes('not sure') || descLower.includes('unclear') || descLower.includes('vague') || descLower.includes('scoping')) {
      clarity = 'low';
    } else if (descLower.includes('detailed') || descLower.includes('specification') || descLower.includes('spec') || descLower.includes('clear')) {
      clarity = 'high';
    }

    const pricingInput = {
      jobType,
      clientType,
      urgency,
      clarity
    };

    const pricingResult = getPricingIntelligence(pricingInput);
    const decision = getRevenueDecision(pricingResult, pricingInput);

    const finalProposal = attachIncomeNarrative(parsedProposal);
    return NextResponse.json({
      parsed_data: finalProposal,
      pricing: pricingResult,
      revenue_decision: decision
    });

  } catch (error) {
    console.error('Error generating proposal:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
