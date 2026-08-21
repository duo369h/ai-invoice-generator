import { NextResponse } from 'next/server';
import {
  createServiceSupabaseClient,
  ensureProfile,
  getRequestUser,
  createInvoiceDraftFromApprovedQuote,
  mapSupabaseInvoice,
} from '../../../../lib/supabase';
import { authRequiredResponse, requestContextResponse } from '../../../../lib/security';

export async function POST(request, { params }) {
  try {
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'quote invoice draft');
    if (contextFailure) return contextFailure;
    if (context.mode !== 'supabase') return authRequiredResponse('quote invoice draft');

    const profile = await ensureProfile(context.supabase, context.user);
    const writer = createServiceSupabaseClient() || context.supabase;
    const result = await createInvoiceDraftFromApprovedQuote(writer, context.user.id, profile?.plan || 'free', params.id);
    return NextResponse.json({
      ...result.data,
      invoice: mapSupabaseInvoice(result.data.invoice),
    }, { status: result.data.created ? 201 : 200 });
  } catch (error) {
    if (error.code === 'QUOTA_EXCEEDED') return NextResponse.json({ error: error.message, code: error.code }, { status: 403 });
    if (error.code === 'QUOTE_NOT_FOUND') return NextResponse.json({ error: error.message, code: error.code }, { status: 404 });
    if (['QUOTE_NOT_APPROVED', 'QUOTE_ALREADY_CONVERTED'].includes(error.code)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 409 });
    }
    console.error('Error creating Invoice draft from approved Quote:', error);
    return NextResponse.json({ error: error.message || 'Failed to create Invoice draft', code: error.code || 'DATABASE_ERROR' }, { status: error.status || 500 });
  }
}
