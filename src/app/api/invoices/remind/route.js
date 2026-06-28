import { NextResponse } from 'next/server';
import {
  createSupabasePortalToken,
  ensureProfile,
  getRequestUser,
  writeAuditLog
} from '../../../lib/supabase';
import { sendPaymentReminderEmail } from '../../../lib/email';
import { getSiteUrl } from '../../../lib/config';
import { getIp, requestContextResponse } from '../../../lib/security';
import { rateLimitAuthenticated } from '../../../lib/rate-limit';

export async function POST(request) {
  try {
    const ip = getIp(request);
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'invoices');
    if (contextFailure) return contextFailure;

    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json(
        { error: limitResult.error || 'Too many requests' },
        { status: limitResult.status || 429 }
      );
    }

    const body = await request.json();
    const invoiceId = body.invoiceId || body.invoice_id;
    const template = body.template || 'soft';
    const reminderText = body.reminderText || body.reminder_text;

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 });
    }
    if (!reminderText) {
      return NextResponse.json({ error: 'reminderText is required' }, { status: 400 });
    }

    if (context.mode !== 'supabase') {
      return NextResponse.json({ error: 'Supabase mode required' }, { status: 400 });
    }

    const { data: invoice, error: invoiceError } = await context.supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', context.user.id)
      .maybeSingle();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (!invoice.client_email) {
      return NextResponse.json({ error: 'Client email is not configured on this invoice' }, { status: 400 });
    }

    // Retrieve freelancer profile for branding / naming
    const profile = await ensureProfile(context.supabase, context.user);
    const freelancerName = profile.name || 'Freelancer';

    // Generate or fetch client portal token
    const portalToken = await createSupabasePortalToken(context.supabase, {
      userId: context.user.id,
      resourceId: invoice.id,
      resourceType: 'invoice'
    });

    if (!portalToken) {
      return NextResponse.json({ error: 'Failed to generate secure portal token' }, { status: 500 });
    }

    const siteUrl = getSiteUrl();
    const portalUrl = `${siteUrl}/portal/token/${portalToken.token}`;

    // Send the payment reminder email
    const emailResult = await sendPaymentReminderEmail(
      invoice.client_email,
      invoice,
      portalUrl,
      reminderText,
      freelancerName
    );

    if (!emailResult.success) {
      return NextResponse.json({ error: emailResult.error || 'Failed to send email' }, { status: 500 });
    }

    // Audit log
    await writeAuditLog(context.supabase, {
      userId: context.user.id,
      action: 'payment_reminder_sent',
      resourceType: 'invoice',
      resourceId: invoice.id,
      ip
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in payment reminder API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
