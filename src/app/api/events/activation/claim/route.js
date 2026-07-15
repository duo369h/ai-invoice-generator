import { NextResponse } from 'next/server';
import { getRequestUser } from '../../../../lib/supabase';
import { authRequiredResponse, requestContextResponse } from '../../../../lib/security';
import { claimFirstActivationEvent } from '../../../../lib/product-analytics-server';

const EVENT_DOCUMENTS = {
  first_quote_created: 'quotes',
  first_invoice_created: 'invoices',
};

export async function POST(request) {
  try {
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'activation_claim');
    if (contextFailure) return contextFailure;
    if (context.mode !== 'supabase') return authRequiredResponse('activation_claim');

    const { event_name: eventName } = await request.json();
    const documentTable = EVENT_DOCUMENTS[eventName];
    if (!documentTable) return NextResponse.json({ error: 'invalid_event' }, { status: 400 });

    const { data, error } = await context.supabase
      .from(documentTable)
      .select('id')
      .eq('user_id', context.user.id)
      .limit(1)
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ claimed: false, error: `no_persisted_${documentTable.slice(0, -1)}` }, { status: 409 });
    }

    const claim = await claimFirstActivationEvent({ eventName, userId: context.user.id });
    return NextResponse.json({ claimed: claim.claimed === true });
  } catch (error) {
    console.warn('[ActivationClaim] Claim failed:', error);
    return NextResponse.json({ claimed: false });
  }
}
