import { NextResponse } from 'next/server';
import { getRequestUser } from '../../../lib/supabase';
import { canAccess } from '../../../../../lib/entitlements';

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

    const access = await canAccess(context.user.id, feature);
    return NextResponse.json({ access });
  } catch (error) {
    console.error('Error fetching entitlements via API:', error);
    return NextResponse.json({ error: 'Failed to fetch entitlements' }, { status: 500 });
  }
}
