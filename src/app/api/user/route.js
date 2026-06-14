import { NextResponse } from 'next/server';
import { getUserById, updateUserPlan } from '../../lib/db';
import { checkQuota } from '../../lib/quota';
import { ensureProfile, getRequestUser, getSupabaseQuota } from '../../lib/supabase';
import { rateLimit } from '../../lib/rate-limit';
import { failClosedResponse, getIp, isDemoModeAllowed } from '../../lib/security';
import { validatePlanPayload, validationResponse } from '../../lib/validation';

const DEMO_USER_ID = 'usr_demo123';

export async function GET(request) {
  try {
    const ip = getIp(request);
    const limitResult = rateLimit(ip, 60, 60000);
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const context = await getRequestUser(request);

    if (context.mode === 'supabase') {
      const profile = await ensureProfile(context.supabase, context.user);
      const quota = await getSupabaseQuota(context.supabase, context.user.id, profile.plan);

      return NextResponse.json({
        id: profile.id,
        email: profile.email,
        name: profile.name || profile.email,
        plan: profile.plan || 'free',
        stripe_customer_id: profile.stripe_customer_id || '',
        created_at: profile.created_at,
        quota,
        auth_mode: 'supabase'
      });
    }

    if (!isDemoModeAllowed()) return failClosedResponse('User profile');
    const targetUserId = context.mode === 'mock' ? 'usr_mock123' : DEMO_USER_ID;
    const user = getUserById(targetUserId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const quota = checkQuota(targetUserId);
    return NextResponse.json({
      ...user,
      quota,
      auth_mode: context.mode === 'mock' ? 'mock' : 'demo'
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
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
      return NextResponse.json({ error: 'Authentication required to update plan' }, { status: 401 });
    }
    const { plan } = validatePlanPayload(await request.json());

    if (context.mode === 'supabase') {
      const profile = await ensureProfile(context.supabase, context.user);
      const { data, error } = await context.supabase
        .from('profiles')
        .update({ plan })
        .eq('id', profile.id)
        .select('*')
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    if (!isDemoModeAllowed()) return failClosedResponse('User profile');
    const targetUserId = context.mode === 'mock' ? 'usr_mock123' : DEMO_USER_ID;
    const updatedUser = updateUserPlan(targetUserId, plan);
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}
