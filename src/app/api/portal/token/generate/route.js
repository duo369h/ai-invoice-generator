import { NextResponse } from 'next/server';
import { createServiceSupabaseClient, createSupabasePortalToken, getRequestUser, writeAuditLog } from '../../../../lib/supabase';
import { rateLimitAuthenticated } from '../../../../lib/rate-limit';
import { authRequiredResponse, failClosedResponse, getIp, requestContextResponse } from '../../../../lib/security';
import { validateObject, validationResponse } from '../../../../lib/validation';

export async function POST(request) {
  try {
    const ip = getIp(request);
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'portal token');
    if (contextFailure) return contextFailure;

    const { ensureProfile } = await import('../../../../lib/supabase');
    const { getUserEntitlements } = await import('../../../../../../lib/entitlements');
    const profile = await ensureProfile(context.supabase, context.user);
    const plan = profile?.plan || 'free';
    const entitlements = getUserEntitlements(plan);
    if (!entitlements.client_portal) {
      return NextResponse.json({
        error: 'UPGRADE_REQUIRED',
        requiredPlan: 'pro'
      }, { status: 403 });
    }

    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }

    const body = validateObject(await request.json());
    const { resource_id, resource_type } = body;

    if (!resource_id || !resource_type) {
      return NextResponse.json({ error: 'Missing resource_id or resource_type' }, { status: 400 });
    }

    if (resource_type !== 'invoice' && resource_type !== 'quote') {
      return NextResponse.json({ error: 'Invalid resource_type' }, { status: 400 });
    }

    if (context.mode === 'supabase') {
      // 1. Verify ownership of the target resource
      const table = resource_type === 'invoice' ? 'invoices' : 'quotes';
      const { data: resource, error: fetchErr } = await context.supabase
        .from(table)
        .select('id')
        .eq('id', resource_id)
        .eq('user_id', context.user.id)
        .maybeSingle();

      if (fetchErr || !resource) {
        return NextResponse.json({ error: 'Resource not found or unauthorized' }, { status: 404 });
      }

      const serviceSupabase = createServiceSupabaseClient() || context.supabase;

      // 2. Revoke older active tokens for the same resource
      await serviceSupabase
        .from('portal_tokens')
        .update({ revoked_at: new Date().toISOString() })
        .eq('resource_id', resource_id)
        .eq('resource_type', resource_type)
        .eq('owner_id', context.user.id)
        .is('revoked_at', null);

      // 3. Create a fresh portal token
      const token = await createSupabasePortalToken(context.supabase, {
        ownerId: context.user.id,
        resourceType: resource_type,
        resourceId: resource_id,
      });

      // 4. Log the audit event
      await writeAuditLog(context.supabase, {
        userId: context.user.id,
        action: 'portal_token_generated',
        resourceType: resource_type,
        resourceId: resource_id,
        ip,
      });

      return NextResponse.json({ success: true, token });
    }

    return authRequiredResponse('portal token');
  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error generating portal token:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
