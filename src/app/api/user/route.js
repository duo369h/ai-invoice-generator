import { NextResponse } from 'next/server';
import { getUserById, updateUserPlan } from '../../lib/db';
import { checkQuota } from '../../lib/quota';
import { ensureProfile, getRequestUser, getSupabaseQuota } from '../../lib/supabase';

const DEMO_USER_ID = 'usr_demo123';

export async function GET(request) {
  try {
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

    const user = getUserById(DEMO_USER_ID);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const quota = checkQuota(DEMO_USER_ID);
    return NextResponse.json({
      ...user,
      quota,
      auth_mode: 'demo'
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const context = await getRequestUser(request);
    const body = await request.json();
    const { plan } = body;

    if (!plan) {
      return NextResponse.json({ error: 'Plan is required' }, { status: 400 });
    }

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

    const updatedUser = updateUserPlan(DEMO_USER_ID, plan);
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}
