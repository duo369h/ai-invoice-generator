import { NextResponse } from 'next/server';
import { getRequestUser } from '../../../lib/supabase';
import { createServiceSupabaseClient } from '../../../lib/supabase-service';
import { getUserEntitlements } from '../../../../../lib/entitlements';

export async function GET(request) {
  try {
    const context = await getRequestUser(request);
    if (!context || !context.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const feature = searchParams.get('feature');

    if (!feature) {
      // Query all entitlements from the database for the user
      const supabase = context.supabase;
      const { data, error } = await supabase
        .from('entitlements')
        .select('*')
        .eq('user_id', context.user.id)
        .maybeSingle();

      if (error) throw error;
      return NextResponse.json({ entitlements: data || null });
    }

    const serviceSupabase = createServiceSupabaseClient();
    if (!serviceSupabase) {
      return NextResponse.json({ error: 'Entitlements service is unavailable' }, { status: 503 });
    }

    const { data: entitlementRow, error: entitlementError } = await serviceSupabase
      .from('entitlements')
      .select('*')
      .eq('user_id', context.user.id)
      .maybeSingle();

    if (entitlementError) throw entitlementError;
    if (entitlementRow && feature in entitlementRow) {
      return NextResponse.json({ access: Boolean(entitlementRow[feature]) });
    }

    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('plan')
      .eq('id', context.user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    const plan = String(profile?.plan || 'free').toLowerCase();
    const entitlements = getUserEntitlements(plan);
    const access = Boolean(entitlements[feature]);
    return NextResponse.json({ access });
  } catch (error) {
    console.error('Error fetching entitlements via API:', error);
    return NextResponse.json({ error: 'Failed to fetch entitlements' }, { status: 500 });
  }
}
