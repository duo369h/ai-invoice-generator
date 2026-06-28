import { NextResponse } from 'next/server';
import { createPublicSupabaseClient, getRequestUser, writeAuditLog } from '../../lib/supabase';
import { rateLimit, rateLimitAuthenticated } from '../../lib/rate-limit';
import { authRequiredResponse, failClosedResponse, getIp, requestContextResponse } from '../../lib/security';
import { validateCardProfilePayload, validationResponse } from '../../lib/validation';

export async function GET(request) {
  try {
    const ip = getIp(request);
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    // Case 1: Public profile lookup by username (does not require auth)
    if (username) {
      const limitResult = await rateLimit(`public-profile:${ip}`, 60, 60000);
      if (!limitResult.success) {
        return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
      }
      const normalizedUsername = String(username).toLowerCase().trim();
      if (!/^[a-z0-9_-]{3,40}$/.test(normalizedUsername)) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      const context = await getRequestUser(request); // optional auth check
      if (context.mode === 'unconfigured') return failClosedResponse('Public profile');
      const publicSupabase = context.mode === 'supabase' ? context.supabase : createPublicSupabaseClient();
      
      if (publicSupabase) {
        const { data, error } = await publicSupabase
          .from('card_profiles')
          .select('*')
          .eq('username', normalizedUsername)
          .eq('is_public', true)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const { createServiceSupabaseClient } = await import('../../lib/supabase');
        const adminSupabase = createServiceSupabaseClient();
        let plan = 'free';
        if (adminSupabase) {
          const { data: profileData } = await adminSupabase
            .from('profiles')
            .select('plan')
            .eq('id', data.user_id)
            .maybeSingle();
          if (profileData) {
            plan = profileData.plan || 'free';
          }
        }

        return NextResponse.json({ ...data, plan });
      }

      return failClosedResponse('Public profile');
    }

    // Case 2: Private dashboard lookup of own profile
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'card profile');
    if (contextFailure) return contextFailure;
    const privateLimit = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!privateLimit.success) {
      return NextResponse.json({ error: privateLimit.error || 'Too many requests' }, { status: privateLimit.status || 429 });
    }
    
    if (context.mode === 'supabase') {
      const { data, error } = await context.supabase
        .from('card_profiles')
        .select('*')
        .eq('user_id', context.user.id)
        .maybeSingle();

      if (error) throw error;
      return NextResponse.json(data || null);
    }

    return authRequiredResponse('card profile');

  } catch (error) {
    console.error('Error fetching card profile:', error);
    return NextResponse.json({ error: 'Failed to fetch card profile' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const ip = getIp(request);
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'card profile');
    if (contextFailure) return contextFailure;
    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }
    const body = validateCardProfilePayload(await request.json());

    if (context.mode === 'supabase') {
      const payload = {
        user_id: context.user.id,
        ...body,
        updated_at: new Date().toISOString()
      };

      const { data: existing, error: existingError } = await context.supabase
        .from('card_profiles')
        .select('id')
        .eq('user_id', context.user.id)
        .maybeSingle();

      if (existingError) throw existingError;

      const result = existing
        ? await context.supabase
          .from('card_profiles')
          .update(payload)
          .eq('id', existing.id)
          .eq('user_id', context.user.id)
          .select('*')
          .single()
        : await context.supabase
          .from('card_profiles')
          .insert(payload)
          .select('*')
          .single();

      const { data, error } = result;
      if (error) throw error;
      await writeAuditLog(context.supabase, {
        userId: context.user.id,
        action: existing ? 'card_profile_updated' : 'card_profile_created',
        resourceType: 'card_profile',
        resourceId: data.id,
        ip,
      });
      return NextResponse.json(data);
    }

    return authRequiredResponse('card profile');

  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error saving card profile:', error);
    return NextResponse.json({ error: 'Failed to save card profile' }, { status: 500 });
  }
}
