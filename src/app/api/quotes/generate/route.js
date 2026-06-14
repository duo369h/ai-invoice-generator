import { NextResponse } from 'next/server';
import { rateLimitByPolicy } from '../../../lib/rate-limit';
import { getIp } from '../../../lib/security';
import { validateParsePayload, validationResponse } from '../../../lib/validation';

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
    const ip = getIp(request);
    const limitResult = await rateLimitByPolicy('quoteGenerate', ip);
    if (!limitResult.success) {
      console.warn(`Rate limit exceeded for IP: ${ip} on POST /api/quotes/generate`);
      return NextResponse.json(
        { error: limitResult.error || 'Too many requests. Please try again later.' },
        { status: limitResult.status || 429 }
      );
    }

    const { message_text } = validateParsePayload(await request.json(), 'message_text');

    const apiKey = process.env.DEEPSEEK_API_KEY;
    const isValidKey = apiKey && 
      apiKey.trim() !== '' && 
      !apiKey.includes('your_') && 
      !apiKey.includes('_here') &&
      apiKey.length > 10;

    if (!isValidKey) {
      console.log('DEEPSEEK_API_KEY not configured. Using local heuristic parser for Quote generation.');
      const parsed = fallbackQuoteParse(message_text);
      return NextResponse.json({ parsed_data: parsed });
    }

    // Call DeepSeek to parse the message text into a structured Quote
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
              content: `You are a helpful assistant that parses client inquiries / messages into a structured Quote JSON. Return ONLY a valid JSON object matching this schema. Do not include markdown formatting or code blocks:
{
  "client_name": "Name of the client/customer (default to 'Valued Client')",
  "client_email": "Email address of the client/customer if available, otherwise empty string",
  "client_address": "Mailing/billing address of the client/customer if available, otherwise empty string",
  "items": [
    {
      "description": "Itemized service description based on their request",
      "quantity": 1,
      "unitPrice": 1500.00 // Price per unit in DECIMAL (e.g. $1500.00 is 1500.00)
    }
  ],
  "currency": "Three letter currency code like USD, EUR, GBP. Default to USD.",
  "discount_rate": 0,
  "tax_rate": 0,
  "notes": "Additional notes, payment terms, or response greetings."
}`
            },
            {
              role: 'user',
              content: message_text
            }
          ],
          response_format: {
            type: 'json_object'
          }
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const result = await response.json();
      const candidateText = result.choices?.[0]?.message?.content;
      if (!candidateText) {
        throw new Error('No content returned from DeepSeek');
      }

      const parsedData = JSON.parse(candidateText.trim());
      return NextResponse.json({ parsed_data: parsedData });
    } catch (apiError) {
      console.error('DeepSeek call failed during Quote generation, using fallback:', apiError.message);
      const parsed = fallbackQuoteParse(message_text);
      return NextResponse.json({ parsed_data: parsed });
    }

  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error generating quote:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
