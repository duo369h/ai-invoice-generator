import { NextResponse } from 'next/server';
import { ensureProfile, getRequestUser, getSupabaseQuota } from '../../lib/supabase';
import { rateLimitAuthenticated } from '../../lib/rate-limit';
import { authRequiredResponse, requestContextResponse } from '../../lib/security';
import { validatePlanPayload, validationResponse } from '../../lib/validation';

async function hasBusinessActivation(supabase, userId) {
  const countRows = async (table) => {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.warn(`[api/user] Activation count skipped for ${table}:`, error.message);
      return 0;
    }

    return count || 0;
  };

  const [quoteCount, invoiceCount, clientCount] = await Promise.all([
    countRows('quotes'),
    countRows('invoices'),
    countRows('clients'),
  ]);

  return quoteCount + invoiceCount + clientCount > 0;
}

export async function GET(request) {
  try {
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'user profile');
    if (contextFailure) return contextFailure;
    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }

    if (context.mode === 'supabase') {
      const profile = await ensureProfile(context.supabase, context.user);
      const quota = await getSupabaseQuota(context.supabase, context.user.id, profile.plan);

      // Check if user has activated (created first value via onboarding)
      const { count: activationEventCount } = await context.supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', context.user.id)
        .eq('event', 'FIRST_VALUE_CREATED');

      const hasActivated = (activationEventCount || 0) > 0 || await hasBusinessActivation(context.supabase, context.user.id);

      return NextResponse.json({
        id: profile.id,
        email: profile.email,
        name: profile.name || profile.email,
        plan: profile.plan || 'free',
        paddle_customer_id: profile.paddle_customer_id || '',
        created_at: profile.created_at,
        quota,
        auth_mode: 'supabase',
        hasActivated
      });
    }

    return authRequiredResponse('user profile');
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'user profile');
    if (contextFailure) return contextFailure;
    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }
    validatePlanPayload(await request.json());

    if (context.mode === 'supabase') {
      return NextResponse.json(
        { error: 'Plan changes are handled by Corvioz support during V1 beta' },
        { status: 403 }
      );
    }

    return authRequiredResponse('user profile');
  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}
