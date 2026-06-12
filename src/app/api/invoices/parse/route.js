import { NextResponse } from 'next/server';
import { checkQuota, incrementAiUsage } from '../../../lib/quota';
import {
  ensureProfile,
  getRequestUser,
  getSupabaseQuota,
  incrementSupabaseAiUsage
} from '../../../lib/supabase';

const DEMO_USER_ID = 'usr_demo123';

// Fallback regex-based parser when DeepSeek API Key is not configured
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
    const { raw_text, type } = await request.json();

    if (!raw_text) {
      return NextResponse.json({ error: 'raw_text is required' }, { status: 400 });
    }

    // Check Quota
    let quota;
    if (context.mode === 'supabase') {
      const profile = await ensureProfile(context.supabase, context.user);
      quota = await getSupabaseQuota(context.supabase, context.user.id, profile.plan);
    } else {
      quota = checkQuota(DEMO_USER_ID);
    }

    if (!quota.aiAllowed) {
      return NextResponse.json(
        { error: 'Monthly AI parse limit reached. Please upgrade to Pro.', code: 'QUOTA_EXCEEDED' },
        { status: 403 }
      );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;

    // Detect placeholder or missing API key
    const isValidKey = apiKey && 
      apiKey.trim() !== '' && 
      !apiKey.includes('your_') && 
      !apiKey.includes('_here') &&
      apiKey.length > 10;

    if (!isValidKey) {
      console.log('DEEPSEEK_API_KEY not configured or is a placeholder. Using local heuristic parser.');
      const parsed = fallbackParse(raw_text, type || 'invoice');
      if (context.mode === 'supabase') {
        await incrementSupabaseAiUsage(context.supabase, context.user.id);
      } else {
        incrementAiUsage(DEMO_USER_ID);
      }
      return NextResponse.json({
        parsed_data: parsed,
        meta: { parser: 'local_heuristic_fallback', note: 'Configure DEEPSEEK_API_KEY in .env.local for AI-powered parsing' }
      });
    }

    // Attempt DeepSeek API call with graceful fallback
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant that parses unstructured text into a JSON object. Return ONLY a valid JSON object matching this schema. Do not include markdown formatting or code blocks:
{
  "client_name": "Name of the client/customer (default to 'Valued Client')",
  "client_email": "Email address of the client/customer if available, otherwise empty string",
  "client_address": "Mailing/billing address of the client/customer if available, otherwise empty string",
  "business_name": "Name of the business issuing the invoice/receipt or empty string",
  "business_email": "Email of the business issuing the invoice/receipt or empty string",
  "business_address": "Address of the business issuing the invoice/receipt or empty string",
  "invoice_number": "Invoice or receipt identifier/number or empty string",
  "currency": "Three letter currency code like usd, eur, gbp, cny. Default to usd.",
  "items": [
    {
      "description": "Description of the service or product",
      "quantity": 1,
      "unit_price": 15000 // Price per unit in CENTS (e.g. $150.00 is 15000)
    }
  ],
  "discount_rate": 0, // Discount rate percentage if mentioned (e.g. 10.5 for 10.5%), otherwise 0
  "tax_rate": 0, // Tax rate percentage if mentioned (e.g. 8.25 for 8.25%), otherwise 0
  "payment_terms": "Net 30", // Payment terms if mentioned, e.g. 'Due on Receipt', 'Net 30', 'Net 60', otherwise 'Net 30'
  "notes": "Additional notes, payment instructions, bank transfer details, etc.",
  "due_date": "Due date in YYYY-MM-DD format if mentioned or calculable"
}`
            },
            {
              role: 'user',
              content: raw_text
            }
          ],
          response_format: {
            type: 'json_object'
          }
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek API Error:', errorText);
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const result = await response.json();
      const candidateText = result.choices?.[0]?.message?.content;
      
      if (!candidateText) {
        throw new Error('No content returned from DeepSeek');
      }

      const parsedData = JSON.parse(candidateText.trim());
      if (context.mode === 'supabase') {
        await incrementSupabaseAiUsage(context.supabase, context.user.id);
      } else {
        incrementAiUsage(DEMO_USER_ID);
      }

      return NextResponse.json({
        parsed_data: parsedData,
        meta: { parser: 'deepseek_ai' }
      });
    } catch (apiError) {
      // Gracefully fall back to heuristic parser if API fails
      console.error('DeepSeek API call failed, falling back to heuristic parser:', apiError.message);
      const parsed = fallbackParse(raw_text, type || 'invoice');
      if (context.mode === 'supabase') {
        await incrementSupabaseAiUsage(context.supabase, context.user.id);
      } else {
        incrementAiUsage(DEMO_USER_ID);
      }
      return NextResponse.json({
        parsed_data: parsed,
        meta: { parser: 'local_heuristic_fallback', note: 'AI API unavailable, used local parser' }
      });
    }

  } catch (error) {
    console.error('Error during AI parsing:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
