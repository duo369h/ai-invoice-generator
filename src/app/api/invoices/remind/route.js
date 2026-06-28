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
import { injectPaymentOptimization } from '../../../../core/ai/AI_DECISION_INJECTION_MAP';
import { getDecision } from '../../../../core/ai/AI_DECISION_CORE';
import { assertCoreDecisionSource } from '../../../../core/ai/AI_DECISION_GUARD';

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

    // AI Injection Layer (Payment Flow) - Observability only
    injectPaymentOptimization({
      stage: "PAYMENT",
      userProfile: context.user,
      clientContext: invoice.client_name,
      historicalOutcomes: [],
      currentInvoice: invoice
    });
    const decision = getDecision(context.user.id, {
      clientContext: invoice.client_name,
      amount: invoice.total,
      reminderTemplate: template,
      urgency: template === 'firm' ? 'high' : 'medium',
    });
    assertCoreDecisionSource("AI_DECISION_CORE");

    const finalReminderText = reminderText;

    // Send the payment reminder email
    const emailResult = await sendPaymentReminderEmail(
      invoice.client_email,
      invoice,
      portalUrl,
      finalReminderText,
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

    const res = { success: true, core_decision: decision.output };
    return NextResponse.json({
      ...res,
      data: res,
      ai: {
        mode: "core_driven",
        source: "AI_DECISION_CORE"
      }
    });
  } catch (error) {
    console.error('Error in payment reminder API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
