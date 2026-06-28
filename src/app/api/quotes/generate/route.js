import { NextResponse } from 'next/server';
import { getRequestUser } from '../../../lib/supabase';
import { rateLimitAuthenticated } from '../../../lib/rate-limit';
import { requestContextResponse } from '../../../lib/security';
import { validateParsePayload, validationResponse } from '../../../lib/validation';
import { checkRevenueLock } from '../../../../../lib/revenue/revenueLock';
import { getPricingIntelligence } from '../../../../core/pricing/PRICING_INTELLIGENCE_ENGINE';
import { getRevenueDecision } from '../../../../core/revenue/REVENUE_DECISION_ENGINE';

function fallbackQuoteParse(text) {
  // Extract email address
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const emails = text.match(emailRegex) || [];
  const client_email = emails[0] || '';

  // Extract currency
  let currency = 'USD';
  if (text.toLowerCase().includes('eur') || text.includes('€')) currency = 'EUR';
  else if (text.toLowerCase().includes('gbp') || text.includes('£')) currency = 'GBP';

  // Extract client name or fallback
  let client_name = 'Valued Client';
  const nameMatch = text.match(/(?:from|sender|by|i\s+am|my\s+name\s+is)\s+([A-Za-z\s]{2,20})/i);
  if (nameMatch && nameMatch[1]) {
    client_name = nameMatch[1].trim();
  }

  // Look for any monetary figure (e.g. $5000, 2000 USD)
  let detectedPrice = 150000; // default 1500.00
  const priceMatches = [...text.matchAll(/(?:\$|€|£|¥)\s*(\d+(?:\.\d{2})?)\b|\b(\d+(?:\.\d{2})?)\s*(?:usd|eur|gbp|budget|cost|price)\b/gi)];
  if (priceMatches.length > 0) {
    const match = priceMatches[0];
    const priceStr = match[1] || match[2];
    const val = parseFloat(priceStr);
    if (!isNaN(val) && val > 0) {
      detectedPrice = Math.round(val * 100);
    }
  }

  // Extract description
  let description = 'Freelance Services Inquiry';
  const descWords = text.split(/\s+/).slice(0, 10).join(' ');
  if (descWords.length > 10) {
    description = descWords + '...';
  }

  return {
    client_name,
    client_email,
    client_address: '',
    items: [
      {
        description: `Estimate for: ${description}`,
        quantity: 1,
        unitPrice: detectedPrice / 100
      }
    ],
    currency,
    notes: 'Draft quote generated automatically from lead message.',
    tax_rate: 0,
    discount_rate: 0
  };
}

export async function POST(request) {
  try {
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'quote generation');
    if (contextFailure) return contextFailure;
    const limitResult = await rateLimitAuthenticated('quoteGenerate', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json(
        { error: limitResult.error || 'Too many requests. Please try again later.' },
        { status: limitResult.status || 429 }
      );
    }

    const { message_text } = validateParsePayload(await request.json(), 'message_text');

    // 1. Check Revenue Lock
    const lockResult = await checkRevenueLock(context.user.id, 'proposal');
    if (!lockResult.allowed) {
      return NextResponse.json(
        { error: lockResult.reason, code: 'REVENUE_LOCK_BLOCKED', suggestedUpgrade: lockResult.suggestedUpgrade },
        { status: 403 }
      );
    }

    // 1.5 Calculate recommended price using Pricing Intelligence Engine
    let jobType = 'web_design';
    const textLower = (message_text || '').toLowerCase();
    if (textLower.includes('ui') || textLower.includes('ux') || textLower.includes('design')) {
      jobType = textLower.includes('web') ? 'web_design' : 'ui_ux';
    } else if (textLower.includes('logo') || textLower.includes('brand')) {
      jobType = 'logo';
    } else if (textLower.includes('invoice') || textLower.includes('billing') || textLower.includes('system') || textLower.includes('code') || textLower.includes('dev')) {
      jobType = 'invoice_system';
    } else if (textLower.includes('marketing') || textLower.includes('seo') || textLower.includes('growth')) {
      jobType = 'marketing';
    }

    let clientType = 'small_business';
    if (textLower.includes('enterprise') || textLower.includes('corporate') || textLower.includes('large')) {
      clientType = 'enterprise';
    } else if (textLower.includes('startup') || textLower.includes('vc')) {
      clientType = 'startup';
    } else if (textLower.includes('individual') || textLower.includes('personal')) {
      clientType = 'individual';
    }

    let urgency = 'medium';
    if (textLower.includes('urgent') || textLower.includes('asap') || textLower.includes('rush') || textLower.includes('quick')) {
      urgency = 'high';
    }

    let clarity = 'medium';
    if (textLower.includes('not sure') || textLower.includes('unclear') || textLower.includes('vague')) {
      clarity = 'low';
    }
    const pricingInput = {
      jobType,
      clientType,
      urgency,
      clarity
    };

    const pricingResult = getPricingIntelligence(pricingInput);
    const decision = getRevenueDecision(pricingResult, pricingInput);

    const parsed = fallbackQuoteParse(message_text);
    if (parsed.items && parsed.items.length > 0) {
      parsed.items[0].unitPrice = pricingResult.recommendedPrice;
    }
    if (decision.upsell && decision.upsell.length > 0) {
      parsed.notes = (parsed.notes || '') + '\n\nSuggested Add-ons:\n' + decision.upsell.map(u => `- ${u}`).join('\n');
    }
    parsed.explanation_text = 'Quote pricing is deterministic and cannot be changed by generated copy.';
    return NextResponse.json({ parsed_data: parsed, pricing: pricingResult, revenue_decision: decision });

  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error generating quote:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
