import { NextResponse } from 'next/server';
import { getRequestUser, ensureProfile } from '../../../lib/supabase';
import { getUserEntitlements } from '../../../../../lib/entitlements';

export async function POST(request) {
  try {
    const context = await getRequestUser(request);
    if (!context || context.mode !== 'supabase' || !context.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const profile = await ensureProfile(context.supabase, context.user);
    const plan = profile?.plan || 'free';
    const entitlements = getUserEntitlements(plan);

    if (!entitlements.export_pdf) {
      return NextResponse.json({
        error: 'UPGRADE_REQUIRED',
        requiredPlan: 'pro'
      }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying PDF export entitlement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
