import { NextResponse } from 'next/server';
import { getRequestUser, writeAuditLog } from '../../../lib/supabase';
import { rateLimitAuthenticated } from '../../../lib/rate-limit';
import { requestContextResponse, getIp } from '../../../lib/security';
import { validateParsePayload, validationResponse } from '../../../lib/validation';
import { checkRevenueLock } from '../../../../../lib/revenue/revenueLock';
import { executePrompt, formatSystemPrompt } from '../../../../../lib/prompt/promptExecutor';
import { estimateCost } from '../../../../../lib/revenue/costEstimator';

// Heuristic fallback profile generator when DeepSeek API Key is missing
function fallbackProfileParse(text) {
  const words = text.split(/\s+/);
  const name = words.slice(0, 2).join(' ') || 'John Doe';
  const title = words.slice(2, 5).join(' ') || 'Freelancer';
  const bio = text.substring(0, 150) || 'Experienced professional ready to build projects.';

  return {
    name,
    title,
    bio,
    tags: ['Freelancer', 'Consulting'],
    services: [
      {
        name: 'General Consultation',
        description: 'Discuss project requirements and scoping.',
        type: 'fixed',
        amount: 150
      }
    ],
    location: 'San Francisco, CA',
    timezone: 'PST (UTC-8)',
    languages: 'English',
    starting_price: '$1,000',
    contact_email: 'hello@example.com',
    contact_phone: ''
  };
}

export async function POST(request) {
  try {
    const ip = getIp(request);
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'profile generation');
    if (contextFailure) return contextFailure;
    const limitResult = await rateLimitAuthenticated('profileGenerate', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json(
        { error: limitResult.error || 'Too many requests. Please try again later.' },
        { status: limitResult.status || 429 }
      );
    }

    const { raw_text } = validateParsePayload(await request.json());

    // 1. Check Revenue Lock
    const lockResult = await checkRevenueLock(context.user.id, 'profile');
    if (!lockResult.allowed) {
      return NextResponse.json(
        { error: lockResult.reason, code: 'REVENUE_LOCK_BLOCKED', suggestedUpgrade: lockResult.suggestedUpgrade },
        { status: 403 }
      );
    }

    // 2. Prepare Prompt via Executor
    const execution = executePrompt('profile', raw_text);

    // 3. Estimate Cost
    const approxTokens = execution.systemPrompt.length + execution.userInput.length;
    const costResult = estimateCost('profile', approxTokens);

    if (costResult.recommendation === 'block') {
      return NextResponse.json(
        { error: 'High cost risk. AI execution blocked.', code: 'COST_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    const isValidKey = apiKey && 
      apiKey.trim() !== '' && 
      !apiKey.includes('your_') && 
      !apiKey.includes('_here') &&
      apiKey.length > 10;

    let parsedData;
    if (!isValidKey) {
      console.log('DEEPSEEK_API_KEY not configured. Using local heuristic parser for Profile generation.');
      parsedData = fallbackProfileParse(raw_text);
    } else {
      // Call DeepSeek to parse/generate structured profile JSON
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
                content: formatSystemPrompt('profile', `Return ONLY a valid JSON object matching this schema. Do not include markdown formatting or code blocks:
{
  "name": "Full Name",
  "title": "Professional Title (e.g. Senior Fullstack Engineer)",
  "bio": "Compelling bio/introduction",
  "tags": ["tag1", "tag2", "tag3"],
  "services": [
    {
      "name": "Service Name",
      "description": "Short description of the service",
      "type": "fixed" | "hourly",
      "amount": 1000
    }
  ],
  "location": "City, Country",
  "timezone": "UTC offset or timezone name",
  "languages": "Languages spoken",
  "starting_price": "$1,000",
  "contact_email": "optional contact email",
  "contact_phone": "optional contact phone"
}`)
              },
              {
                role: 'user',
                content: execution.userInput
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

        parsedData = JSON.parse(candidateText.trim());
      } catch (apiError) {
        console.error('DeepSeek call failed during Profile generation, using fallback:', apiError.message);
        parsedData = fallbackProfileParse(raw_text);
      }
    }

    // 4. Log the audit event to record daily limits
    if (context.mode === 'supabase') {
      await writeAuditLog(context.supabase, {
        userId: context.user.id,
        action: 'card_profile_created',
        resourceType: 'card_profile',
        resourceId: context.user.id,
        ip
      });
    }

    return NextResponse.json({ parsed_data: parsedData });

  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error generating profile:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
