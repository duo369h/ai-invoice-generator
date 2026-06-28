import { NextResponse } from 'next/server';
import {
  getRequestUser,
} from '../../../lib/supabase';
import { rateLimitAuthenticated } from '../../../lib/rate-limit';
import { requestContextResponse } from '../../../lib/security';
import { validateParsePayload, validationResponse } from '../../../lib/validation';
import { checkRevenueLock } from '../../../../../lib/revenue/revenueLock';
import { getDecision } from '../../../../core/ai/AI_DECISION_CORE';
import { assertCoreDecisionSource } from '../../../../core/ai/AI_DECISION_GUARD';

// Deterministic regex-based parser. Revenue parsing must not use AI.
function fallbackParse(text, type) {
  // 1. Extract email addresses
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const emails = text.match(emailRegex) || [];
  const client_email = emails[0] || '';
  const business_email = emails[1] || '';

  // Create a version of the text without emails to prevent name matching issues
  let textWithoutEmails = text;
  emails.forEach(email => {
    textWithoutEmails = textWithoutEmails.replace(email, ' ');
  });

  // 2. Extract currency (USD, EUR, GBP, CNY, etc)
  let currency = 'usd';
  if (text.toLowerCase().includes('eur') || text.includes('€')) currency = 'eur';
  else if (text.toLowerCase().includes('gbp') || text.includes('£')) currency = 'gbp';
  else if (text.toLowerCase().includes('cny') || text.includes('¥')) currency = 'cny';

  // 3. Extract a potential client name (heuristics)
  let client_name = 'Valued Client';
  const clientMatch = textWithoutEmails.match(/(?:bill\s+to|invoice\s+to|send\s+an?\s+invoice\s+to|send\s+to|to)\s+([A-Za-z0-9\s\.\,\-\&]+)/i);
  if (clientMatch) {
    let candidate = clientMatch[1];
    // Stop words for client name truncation
    const stopWords = /\b(?:for|at|with|from|on|by|tax|discount|inv|invoice|receipt|vat|limit)\b|[\(\)\,\;\n\r]|\$?\d+/i;
    const stopIdx = candidate.search(stopWords);
    if (stopIdx !== -1) {
      candidate = candidate.substring(0, stopIdx);
    }
    candidate = candidate.trim().replace(/^[:\s\-\,]+|[:\s\-\,]+$/g, '').trim();
    if (candidate.length > 1) {
      client_name = candidate;
    }
  }

  // 4. Extract business name (heuristics)
  let business_name = '';
  const bizMatch = textWithoutEmails.match(/(?:from|sender|by)\s+([A-Za-z0-9\s\.\,\-\&]+)/i);
  if (bizMatch) {
    let candidate = bizMatch[1];
    // Stop words for business name truncation
    const stopWords = /\b(?:to|for|at|with|on|tax|discount|inv|invoice|receipt|vat|limit)\b|[\(\)\,\;\n\r]|\$?\d+/i;
    const stopIdx = candidate.search(stopWords);
    if (stopIdx !== -1) {
      candidate = candidate.substring(0, stopIdx);
    }
    candidate = candidate.trim().replace(/^[:\s\-\,]+|[:\s\-\,]+$/g, '').trim();
    if (candidate.length > 1) {
      business_name = candidate;
    }
  }

  // 5. Extract tax rate percentage (e.g. tax 8%, tax 8, 8% tax)
  let tax_rate = 0;
  const taxMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:tax|vat|gst)/i) || 
                   text.match(/(?:tax|vat|gst)\s*(?:rate)?\s*(?:of)?\s*(\d+(?:\.\d+)?)\s*%/i) ||
                   text.match(/(?:tax|vat|gst)\s+(\d+(?:\.\d+)?)/i) ||
                   text.match(/(\d+(?:\.\d+)?)\s*%/i);
  if (taxMatch) {
    tax_rate = parseFloat(taxMatch[1]);
  }

  // 6. Extract discount percentage
  let discount_rate = 0;
  const discountMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*discount/i) || 
                        text.match(/discount\s*(?:of)?\s*(\d+(?:\.\d+)?)\s*%/i);
  if (discountMatch) {
    discount_rate = parseFloat(discountMatch[1]);
  }

  // 7. Extract invoice number
  let invoice_number = '';
  const invNumMatch = text.match(/\b(?:invoice|inv|receipt)\b\s*(?:num|number|#|no\.?|id)?\s*([a-z0-9\-]{3,15})\b/i);
  if (invNumMatch) {
    invoice_number = invNumMatch[1].trim().toUpperCase();
  }

  // 8. Extract price & item description
  let detectedPrice = 50000; // default 500.00 in cents
  
  // Look for currency prefix or suffix format (e.g., $800, 800 USD)
  const currencyPriceMatches = [...text.matchAll(/(?:\$|€|£|¥|元)\s*(\d+(?:\.\d{2})?)\b|\b(\d+(?:\.\d{2})?)\s*(?:usd|eur|gbp|cny|jpy|dollars|euros|pounds|yuan|yen)\b/gi)];
  
  if (currencyPriceMatches.length > 0) {
    const match = currencyPriceMatches[0];
    const priceStr = match[1] || match[2];
    const val = parseFloat(priceStr);
    if (!isNaN(val)) {
      detectedPrice = Math.round(val * 100);
    }
  } else {
    // Standalone number fallback: search for first number that is not tax_rate or discount_rate
    const numberRegex = /\b\d+(?:\.\d{2})?\b/g;
    const allNumbers = text.match(numberRegex) || [];
    for (const numStr of allNumbers) {
      const val = parseFloat(numStr);
      if (val !== tax_rate && val !== discount_rate && val > 0) {
        detectedPrice = Math.round(val * 100);
        break;
      }
    }
  }

  // Extract description
  let description = type === 'invoice' ? 'Consulting Services' : 'Retail Purchase';
  const descMatch = textWithoutEmails.match(/(?:for|services|purchase\s+of|of|item)\s+([A-Za-z0-9\s\-\&]+)/i);
  if (descMatch && descMatch[1]) {
    let candidate = descMatch[1];
    const stopWords = /\b(?:tax|discount|inv|invoice|receipt|vat)\b|[\(\)\,\;\n\r]|\$?\d+/i;
    const stopIdx = candidate.search(stopWords);
    if (stopIdx !== -1) {
      candidate = candidate.substring(0, stopIdx);
    }
    candidate = candidate.trim().replace(/^[:\s\-\,]+|[:\s\-\,]+$/g, '').trim();
    if (candidate.length > 1) {
      description = candidate;
    }
  }

  const items = [{
    description: description,
    quantity: 1,
    unit_price: detectedPrice
  }];

  return {
    client_name,
    client_email,
    client_address: '',
    business_name,
    business_email,
    business_address: '',
    invoice_number,
    currency,
    items,
    discount_rate,
    tax_rate,
    payment_terms: 'Net 30',
    notes: '',
    due_date: ''
  };
}

export async function POST(request) {
  try {
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'invoice parser');
    if (contextFailure) return contextFailure;
    const limitResult = await rateLimitAuthenticated('aiParse', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json(
        { error: limitResult.error || 'Too many requests' },
        { status: limitResult.status || 429 }
      );
    }
    const { raw_text, type } = validateParsePayload(await request.json());

    // 1. Check Revenue Lock
    const lockResult = await checkRevenueLock(context.user.id, 'invoice');
    if (!lockResult.allowed) {
      return NextResponse.json(
        { error: lockResult.reason, code: 'REVENUE_LOCK_BLOCKED', suggestedUpgrade: lockResult.suggestedUpgrade },
        { status: 403 }
      );
    }

    const parsed = fallbackParse(raw_text, type || 'invoice');
    const decision = getDecision(context.user.id, {
      clientContext: parsed.client_name,
      amount: parsed.items?.[0]?.unit_price,
      docType: type || 'invoice',
    });
    assertCoreDecisionSource("AI_DECISION_CORE");
    return NextResponse.json({
      parsed_data: parsed,
      core_decision: decision.output,
      ai: {
        mode: "core_driven",
        source: "AI_DECISION_CORE"
      },
      meta: { parser: 'deterministic_heuristic', note: 'Runtime decisions are sourced only from AI_DECISION_CORE.' }
    });

  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error during AI parsing:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
