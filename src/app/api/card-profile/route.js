import { NextResponse } from 'next/server';
import { getCardProfileByUsername, getCardProfileByUserId, saveCardProfile } from '../../lib/db';
import { createPublicSupabaseClient, getRequestUser } from '../../lib/supabase';
import { rateLimit } from '../../lib/rate-limit';
import { failClosedResponse, getIp, isDemoModeAllowed } from '../../lib/security';
import { validateCardProfilePayload, validationResponse } from '../../lib/validation';

export async function GET(request) {
  try {
    const ip = getIp(request);
    const limitResult = rateLimit(ip, 60, 60000);
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    // Case 1: Public profile lookup by username (does not require auth)
    if (username) {
      const context = await getRequestUser(request); // optional auth check
      const publicSupabase = context.mode === 'supabase' ? context.supabase : createPublicSupabaseClient();
      
      if (publicSupabase) {
        const { data, error } = await publicSupabase
          .from('card_profiles')
          .select('*')
          .eq('username', username)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }
        return NextResponse.json(data);
      }

      // Local / Mock fallback
      if (!isDemoModeAllowed()) return failClosedResponse('Public profile');
      const profile = getCardProfileByUsername(username);
      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      return NextResponse.json(profile);
    }

    // Case 2: Private dashboard lookup of own profile
    const context = await getRequestUser(request);
    
    if (context.mode === 'supabase') {
      const { data, error } = await context.supabase
        .from('card_profiles')
        .select('*')
        .eq('user_id', context.user.id)
        .maybeSingle();

      if (error) throw error;
      return NextResponse.json(data || null);
    }

    // Local / Mock / Demo dashboard lookups
    if (!isDemoModeAllowed()) return failClosedResponse('Card profile');
    const targetUserId = context.mode === 'mock' ? 'usr_mock123' : 'usr_demo123';
    const profile = getCardProfileByUserId(targetUserId);
    return NextResponse.json(profile || null);

  } catch (error) {
    console.error('Error fetching card profile:', error);
    return NextResponse.json({ error: 'Failed to fetch card profile' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const ip = getIp(request);
    const limitResult = rateLimit(ip, 60, 60000);
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const context = await getRequestUser(request);
    if (context.mode === 'demo') {
      return NextResponse.json({ error: 'Authentication required to save profile' }, { status: 401 });
    }
    const body = validateCardProfilePayload(await request.json());

    if (context.mode === 'supabase') {
      // Upsert card profile in Supabase
      const payload = {
        user_id: context.user.id,
        ...body,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await context.supabase
        .from('card_profiles')
        .upsert(payload, { onConflict: 'user_id' })
        .select('*')
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    // Local / Mock fallback
    if (!isDemoModeAllowed()) return failClosedResponse('Card profile');
    const targetUserId = context.mode === 'mock' ? 'usr_mock123' : 'usr_demo123';
    const payload = {
      user_id: targetUserId,
      ...body
    };

    const saved = saveCardProfile(payload);
    return NextResponse.json(saved);

  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error saving card profile:', error);
    return NextResponse.json({ error: 'Failed to save card profile' }, { status: 500 });
  }
}
