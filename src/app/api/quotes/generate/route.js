import { NextResponse } from 'next/server';
import { getRequestUser } from '../../../lib/supabase';
import { rateLimitAuthenticated } from '../../../lib/rate-limit';
import { requestContextResponse } from '../../../lib/security';
import { validateParsePayload, validationResponse } from '../../../lib/validation';
import { checkRevenueLock } from '../../../../../lib/revenue/revenueLock';

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
        unitPrice: 0
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

    const parsed = fallbackQuoteParse(message_text);
    const res = {
      parsed_data: parsed,
      core_decision: null,
    };
    return NextResponse.json({
      ...res,
      data: res,
      ai: {
        mode: "parser_only",
        source: "quotes_generate",
        authority: "suggestion_only",
      }
    });

  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error generating quote:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
