import { NextResponse } from 'next/server';
import { createServiceSupabaseClient, isSupabaseConfigured } from '../../lib/supabase';
import { requireInternalAdmin } from '../../lib/internal-admin';

function cleanString(value, max = 1000) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function toCsvValue(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET(request) {
  const admin = await requireInternalAdmin(request);
  if (admin.response) return admin.response;

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ configured: false, data: [] });
    }

    const supabase = createServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ configured: false, reason: 'service_role_not_configured', data: [] });
    }

    const { searchParams } = new URL(request.url);
    const exportCsv = searchParams.get('format') === 'csv';
    const { data, error } = await supabase
      .from('early_access_waitlist')
      .select('id, name, email, country, role, reason, source, utm, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error?.code === 'PGRST205' || error?.message?.includes('early_access_waitlist')) {
      return NextResponse.json({ configured: false, reason: 'early_access_schema_not_applied', data: [] });
    }
    if (error) throw error;

    if (exportCsv) {
      const headers = ['created_at', 'name', 'email', 'country', 'role', 'reason', 'source', 'status'];
      const rows = (data || []).map((row) => headers.map((key) => toCsvValue(row[key])).join(','));
      return new NextResponse([headers.join(','), ...rows].join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="corvioz-early-access.csv"',
        },
      });
    }

    return NextResponse.json({ configured: true, data: data || [] });
  } catch (error) {
    console.error('Failed to load early access waitlist:', error);
    return NextResponse.json({ error: 'Failed to load early access waitlist' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = cleanString(body.name, 120);
    const email = cleanString(body.email, 254).toLowerCase();
    const country = cleanString(body.country, 120);
    const role = cleanString(body.role, 120);
    const reason = cleanString(body.reason, 2000);
    const source = cleanString(body.source || 'early_access', 200);
    const utm = body.utm && typeof body.utm === 'object' ? body.utm : {};

    if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    if (!validEmail(email)) return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    if (!country) return NextResponse.json({ error: 'Country is required.' }, { status: 400 });
    if (!role) return NextResponse.json({ error: 'Role is required.' }, { status: 400 });
    if (!reason || reason.length < 10) {
      return NextResponse.json({ error: 'Tell us why you want to use Corvioz.' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ stored: false, reason: 'supabase_not_configured' }, { status: 202 });
    }

    const supabase = createServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ stored: false, reason: 'service_role_not_configured' }, { status: 202 });
    }

    const payload = { name, email, country, role, reason, source, utm, status: 'new' };
    const { error } = await supabase.from('early_access_waitlist').insert(payload);
    if (error?.code === 'PGRST205' || error?.message?.includes('early_access_waitlist')) {
      return NextResponse.json({ stored: false, reason: 'early_access_schema_not_applied' }, { status: 202 });
    }
    if (error?.code === '23505') {
      return NextResponse.json({ stored: true, duplicate: true });
    }
    if (error) throw error;

    return NextResponse.json({ stored: true });
  } catch (error) {
    console.error('Failed to join early access:', error);
    return NextResponse.json({ error: 'Failed to join early access' }, { status: 500 });
  }
}
