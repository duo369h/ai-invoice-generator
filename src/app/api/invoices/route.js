import { NextResponse } from 'next/server';
import {
  getRequestUser,
  getSupabaseQuota,
  getDocumentQuota,
  createInvoiceWithAtomicQuota,
  mapSupabaseInvoice,
  incrementSupabaseInvoiceUsage
} from '../../lib/supabase';
import {
  createServiceSupabaseClient,
  createSupabasePortalToken,
  ensureProfile,
  writeAuditLog,
  recordServerGrowthEvent,
  trackProfileMetric
} from '../../lib/supabase-service';
import { rateLimitAuthenticated } from '../../lib/rate-limit';
import { authRequiredResponse, getIp, requestContextResponse } from '../../lib/security';
import { validateInvoicePayload, validateObject, validationResponse } from '../../lib/validation';
import { injectInvoiceEnhancement } from '../../../core/ai/AI_DECISION_INJECTION_MAP';
import { getDecision } from '../../../core/ai/AI_DECISION_CORE';
import { assertCoreDecisionSource } from '../../../core/ai/AI_DECISION_GUARD';
import { getSiteUrl } from '../../lib/config';
import { recordProductAnalyticsEvent } from '../../lib/product-analytics-server';
import { hasRecordedInvoicePayment } from '../../../core/revenue/invoicePaymentState.js';

const LEGACY_INVOICE_STATUS_ALLOWLIST = new Set([
  'draft',
  'pending',
  'sent',
  'approved',
]);

const INVOICE_PAYMENT_GUARD_FIELDS =
  'id,status,payment_status,total,amount_paid_cents,amount_due_cents,due_date';

async function findOwnedInvoiceForWrite(serviceSupabase, id, userId) {
  return serviceSupabase
    .from('invoices')
    .select(INVOICE_PAYMENT_GUARD_FIELDS)
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
}

function settledInvoiceConflictResponse() {
  return NextResponse.json({
    error: 'SETTLED_INVOICE_WRITE_CONFLICT',
    message: 'Invoices with recorded payments cannot be changed or deleted.',
  }, { status: 409 });
}

export async function GET(request) {
  try {
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'invoices');
    if (contextFailure) return contextFailure;
    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10); // increased limit to see more history

    if (context.mode === 'supabase') {
      await ensureProfile(context.supabase, context.user);

      let query = context.supabase
        .from('invoices')
        .select('*')
        .eq('user_id', context.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return NextResponse.json({
        object: 'list',
        data: (data || []).map(mapSupabaseInvoice),
        has_more: false,
        auth_mode: 'supabase'
      });
    }

    return authRequiredResponse('invoices');
  } catch (error) {
    console.error('Error in invoices GET:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const ip = getIp(request);
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'invoices');
    if (contextFailure) return contextFailure;

    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }

    const body = validateInvoicePayload(await request.json());

    const {
      id,
      client_name,
      client_email,
      client_address,
      business_name,
      business_email,
      business_address,
      logo_url,
      currency,
      items,
      discount_rate,
      tax_rate,
      invoice_number,
      payment_terms,
      notes,
      invoice_date,
      due_date,
      doc_type,
      client_id,
      quote_id,
      payment_link,
      invoice_kind,
      payment_status,
      amount_paid_cents,
      amount_due_cents
    } = body;

    if (doc_type === 'receipt') {
      return NextResponse.json({
        error: 'RECEIPT_CREATION_NOT_SUPPORTED',
        message: 'Receipts can only be generated from a recorded payment.'
      }, { status: 400 });
    }

    // Calculate subtotal and total in cents
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 1) * Math.round(Number(item.unitPrice || item.unit_price || 0) * 100)), 0);
    const discount_amount = Math.round(subtotal * (Number(discount_rate) / 100));
    const taxable_amount = Math.max(0, subtotal - discount_amount);
    const tax_amount = Math.round(taxable_amount * (Number(tax_rate) / 100));
    const total = taxable_amount + tax_amount;

    const editablePayload = {
      invoice_number,
      client_id: client_id || null,
      quote_id: quote_id || null,
      payment_link: payment_link || '',
      client_name,
      client_email: client_email || '',
      client_address: client_address || '',
      business_name: business_name || '',
      business_email: business_email || '',
      business_address: business_address || '',
      logo_url: logo_url || '',
      currency: currency.toUpperCase(),
      items: items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity) || 1,
        unit_price: Math.round(Number(item.unitPrice || 0) * 100),
        amount: (Number(item.quantity) || 1) * Math.round(Number(item.unitPrice || 0) * 100)
      })),
      subtotal,
      discount_rate: Number(discount_rate),
      discount_amount,
      tax_rate: Number(tax_rate),
      tax_amount,
      total,
      invoice_date: invoice_date || new Date().toISOString().substring(0, 10),
      due_date: due_date || null,
      payment_terms: payment_terms || 'Net 30',
      notes: notes || ''
    };

    if (context.mode === 'supabase' && id) {
      const serviceSupabase = createServiceSupabaseClient();
      if (!serviceSupabase) {
        return NextResponse.json({ error: 'Invoice service is unavailable' }, { status: 503 });
      }

      const { data: existingInvoice, error: lookupError } = await findOwnedInvoiceForWrite(
        serviceSupabase,
        id,
        context.user.id
      );
      if (lookupError) {
        return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
      }
      if (!existingInvoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      if (hasRecordedInvoicePayment(existingInvoice)) {
        return settledInvoiceConflictResponse();
      }

      const { data, error } = await serviceSupabase
        .from('invoices')
        .update(editablePayload)
        .eq('id', id)
        .eq('user_id', context.user.id)
        .eq('payment_status', existingInvoice.payment_status)
        .eq('amount_paid_cents', existingInvoice.amount_paid_cents)
        .select('*')
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
      }
      if (!data) {
        return settledInvoiceConflictResponse();
      }

      try {
        await writeAuditLog(context.supabase, {
          userId: context.user.id,
          action: 'invoice_updated',
          resourceType: 'invoice',
          resourceId: data.id,
          ip,
        });
      } catch (auditError) {
        console.error('Failed to write invoice update audit log:', auditError);
      }

      const res = mapSupabaseInvoice(data);
      return NextResponse.json({ ...res, data: res }, { status: 200 });
    }

    const profile = await ensureProfile(context.supabase, context.user);
    const plan = profile?.plan || 'free';
    const { getUserEntitlements } = await import('../../../../lib/entitlements');
    const entitlements = getUserEntitlements(plan);

    // Bypass plan limit checks during onboarding (until user triggers FIRST_VALUE_CREATED)
    const { count: activationEventCount } = await context.supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', context.user.id)
      .eq('event', 'FIRST_VALUE_CREATED');

    const hasActivated = (activationEventCount || 0) > 0;

    if (!entitlements.invoice && hasActivated) {
      return NextResponse.json({
        error: "UPGRADE_REQUIRED",
        requiredPlan: "pro"
      }, { status: 403 });
    }

    // Default status: quotes -> draft, invoices/receipts -> pending (ledger-neutral)
    let defaultStatus = 'pending';
    if (doc_type === 'quote') {
      defaultStatus = 'draft';
    }

    if (context.mode === 'supabase') {
      const profile = await ensureProfile(context.supabase, context.user);
      // Non-authoritative UX quota precheck for telemetry
      await getDocumentQuota(context.supabase, context.user.id, profile.plan).catch(() => null);

      // AI Injection Layer (Invoice Flow) - Observability only
      const invoice = {
        description: items[0]?.description || 'Services render'
      };

      const aiContext = {
        stage: "INVOICE",
        userProfile: context.user,
        clientContext: client_id,
        historicalOutcomes: [],
        currentInvoice: {
          items
        }
      };

      injectInvoiceEnhancement(aiContext);
      const decision = getDecision(context.user.id, {
        clientContext: client_id,
        amount: total,
        docType: doc_type || 'invoice',
      });
      assertCoreDecisionSource("AI_DECISION_CORE");

      const payload = {
        user_id: context.user.id,
        ...editablePayload,
        invoice_number: invoice_number || `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: defaultStatus,
        doc_type: doc_type || 'invoice',
        items: editablePayload.items.map((item, idx) => ({
          ...item,
          description: idx === 0 ? invoice.description : item.description,
        })),
        invoice_kind: ['standard', 'deposit', 'milestone', 'final'].includes(invoice_kind) ? invoice_kind : 'standard',
        payment_status: 'unpaid',
        amount_paid_cents: 0,
        amount_due_cents: total
      };

      let creation;
      try {
        const serviceSupabase = createServiceSupabaseClient();
        if (!serviceSupabase) {
          return NextResponse.json({ error: 'Invoice service is unavailable' }, { status: 503 });
        }
        creation = await createInvoiceWithAtomicQuota(serviceSupabase, context.user.id, profile.plan, payload);

        // Non-authoritative, idempotent first-revenue invoice tracking (never blocks invoice creation)
        if (profile.plan === 'free' && creation?.data?.id && quote_id) {
          try {
            const { error: trackingError } = await serviceSupabase.rpc('claim_first_revenue_invoice', {
              p_user_id: context.user.id,
              p_quote_id: quote_id,
              p_invoice_id: creation.data.id,
            });
            if (trackingError) {
              console.warn("[FirstRevenue] Non-blocking invoice tracking notice:", trackingError.message || trackingError);
            }
          } catch (trackErr) {
            console.warn("[FirstRevenue] Non-blocking invoice tracking exception:", trackErr.message || trackErr);
          }
        }
      } catch (atomicErr) {
        if (atomicErr.code === "QUOTA_EXCEEDED" || atomicErr.status === 403) {
          return NextResponse.json({
            error: atomicErr.message || "Document limit reached for current cycle.",
            code: "QUOTA_EXCEEDED"
          }, { status: 403 });
        }
        return NextResponse.json({
          error: atomicErr.message || "Database atomic document creation failed.",
          code: "DATABASE_ERROR"
        }, { status: 500 });
      }
      const data = creation.data;
      // V3_REVENUE_HOOK_POINT
      // DO NOT IMPLEMENT YET
      await trackProfileMetric(context.supabase, context.user.id, 'first_invoice_created_at');

      try {
        await incrementSupabaseInvoiceUsage(context.supabase, context.user.id);
      } catch (useErr) {
        console.error('Failed to increment supabase invoice usage:', useErr);
      }

      let portalToken = null;
      if (entitlements.client_portal) {
        try {
          portalToken = await createSupabasePortalToken(context.supabase, {
            ownerId: context.user.id,
            resourceType: 'invoice',
            resourceId: data.id,
          });
        } catch (tokenErr) {
          console.error('Failed to create invoice portal token:', tokenErr);
        }
      }

      await writeAuditLog(context.supabase, {
        userId: context.user.id,
        action: 'invoice_created',
        resourceType: 'invoice',
        resourceId: data.id,
        ip,
      });

      try {
        await recordProductAnalyticsEvent({
          eventName: 'Invoice Created',
          userId: context.user.id,
          source: 'invoices_api',
          properties: {
            identity: context.user.id,
            user_id: context.user.id,
            plan: profile.plan || 'free',
            country: '',
            invoice_id: data.id,
            invoice_number: data.invoice_number,
            total: data.total,
            currency: data.currency,
            source: 'invoices_api',
            timestamp: new Date().toISOString(),
          },
        });
      } catch (analyticsError) {
        console.error('Failed to record invoice creation:', analyticsError);
      }

      const res = { ...mapSupabaseInvoice(data), portal_token: portalToken, core_decision: decision.output };
      return NextResponse.json({
        ...res,
        data: res,
        ai: {
          mode: "core_driven",
          source: "AI_DECISION_CORE"
        }
      }, { status: 201 });
    }

    return authRequiredResponse('invoices');
  } catch (error) {
    if (error.code === "QUOTA_EXCEEDED" || error.status === 403) {
      return NextResponse.json({
        error: error.message || "Document limit reached for current cycle.",
        code: "QUOTA_EXCEEDED"
      }, { status: 403 });
    }
    if (error.code === "DATABASE_ERROR" || error.status === 500) {
      return NextResponse.json({
        error: error.message || "Database error during invoice creation.",
        code: "DATABASE_ERROR"
      }, { status: 500 });
    }
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice", code: "DATABASE_ERROR" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const ip = getIp(request);
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'invoices');
    if (contextFailure) return contextFailure;
    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }
    const body = validateObject(await request.json());
    const { id, status } = body;

    const paymentTruthFields = ['payment_status', 'amount_paid_cents', 'amount_due_cents'];
    if (paymentTruthFields.some((field) => Object.prototype.hasOwnProperty.call(body, field))) {
      return NextResponse.json({ error: 'Payment records determine payment state' }, { status: 400 });
    }

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields: id and status' }, { status: 400 });
    }

    if (status === 'paid') {
      return NextResponse.json({
        error: 'Payment records determine paid state',
        code: 'PAID_STATUS_REQUIRES_PAYMENT_RECORD'
      }, { status: 400 });
    }

    if (typeof status !== 'string' || !LEGACY_INVOICE_STATUS_ALLOWLIST.has(status)) {
      return NextResponse.json({ error: 'INVALID_INVOICE_STATUS' }, { status: 400 });
    }

    if (context.mode === 'supabase') {
      // SAFE-03SEC-B1: runs as service_role, which bypasses RLS. The
      // `.eq('user_id', context.user.id)` filter below is therefore the sole
      // ownership control and must not be removed. `context.user.id` comes from
      // the verified session; `user_id` is never read from the request body.
      const serviceSupabase = createServiceSupabaseClient();
      if (!serviceSupabase) {
        return NextResponse.json({ error: 'Invoice service is unavailable' }, { status: 503 });
      }

      const { data: existingInvoice, error: lookupError } = await findOwnedInvoiceForWrite(
        serviceSupabase,
        id,
        context.user.id
      );
      if (lookupError) {
        return NextResponse.json({ error: 'Failed to update invoice status' }, { status: 500 });
      }
      if (!existingInvoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      if (hasRecordedInvoicePayment(existingInvoice)) {
        return settledInvoiceConflictResponse();
      }
      const { data, error } = await serviceSupabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .eq('user_id', context.user.id)
        .eq('payment_status', existingInvoice.payment_status)
        .eq('amount_paid_cents', existingInvoice.amount_paid_cents)
        .select('*')
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: 'Failed to update invoice status' }, { status: 500 });
      }
      if (!data) {
        return settledInvoiceConflictResponse();
      }

      await writeAuditLog(context.supabase, {
        userId: context.user.id,
        action: 'invoice_status_changed',
        resourceType: 'invoice',
        resourceId: data.id,
        ip,
      });

      if (status === 'sent') {
        await trackProfileMetric(context.supabase, context.user.id, 'invoice_sent_timestamp');
        await recordServerGrowthEvent(context.supabase, {
          eventName: 'invoice_sent',
          userId: context.user.id,
          source: 'user',
          properties: {
            invoice_id: data.id,
            invoice_number: data.invoice_number,
            client_email: data.client_email
          }
        });
      }

      // Trigger email notifications
      if (status === 'sent' && data.client_email) {
        try {
          const profile = await ensureProfile(context.supabase, context.user);
          const plan = profile?.plan || 'free';
          const { getUserEntitlements } = await import('../../../../lib/entitlements');
          const entitlements = getUserEntitlements(plan);

          let portalUrl = null;
          if (entitlements.client_portal) {
            const portalToken = await createSupabasePortalToken(context.supabase, {
              ownerId: context.user.id,
              resourceType: 'invoice',
              resourceId: data.id
            });
            if (portalToken) {
              portalUrl = `${getSiteUrl()}/portal/${portalToken}`;
            }
          }

          const { data: freelancerProfile } = await context.supabase
            .from('profiles')
            .select('name')
            .eq('id', context.user.id)
            .maybeSingle();

          const { sendInvoiceSentEmail } = await import('../../lib/email');
          await sendInvoiceSentEmail(data.client_email, data, portalUrl, freelancerProfile?.name || 'Freelancer');
        } catch (mailErr) {
          console.error('Failed to trigger Invoice Sent email:', mailErr);
        }
      }

      return NextResponse.json(mapSupabaseInvoice(data));
    }

    return authRequiredResponse('invoices');
  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error updating invoice status:', error);
    return NextResponse.json({ error: 'Failed to update invoice status' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const ip = getIp(request);
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'invoices');
    if (contextFailure) return contextFailure;

    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    if (context.mode === 'supabase') {
      // SAFE-03SEC-B1: runs as service_role, which bypasses RLS. The
      // `.eq('user_id', context.user.id)` filter below is therefore the sole
      // ownership control and must not be removed. `context.user.id` comes from
      // the verified session; `user_id` is never read from the request body.
      const serviceSupabase = createServiceSupabaseClient();
      if (!serviceSupabase) {
        return NextResponse.json({ error: 'Invoice service is unavailable' }, { status: 503 });
      }

      const { data: existingInvoice, error: lookupError } = await findOwnedInvoiceForWrite(
        serviceSupabase,
        id,
        context.user.id
      );
      if (lookupError) {
        return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
      }
      if (!existingInvoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      if (hasRecordedInvoicePayment(existingInvoice)) {
        return settledInvoiceConflictResponse();
      }

      const { data: deletedInvoice, error } = await serviceSupabase
        .from('invoices')
        .delete()
        .eq('id', id)
        .eq('user_id', context.user.id)
        .eq('payment_status', existingInvoice.payment_status)
        .eq('amount_paid_cents', existingInvoice.amount_paid_cents)
        .select('id')
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
      }
      if (!deletedInvoice) {
        return settledInvoiceConflictResponse();
      }

      try {
        await writeAuditLog(context.supabase, {
          userId: context.user.id,
          action: 'invoice_deleted',
          resourceType: 'invoice',
          resourceId: deletedInvoice.id,
          ip,
        });
      } catch (auditError) {
        console.error('Failed to write invoice deletion audit log:', auditError);
      }

      return NextResponse.json({ success: true, id: deletedInvoice.id });
    }

    return authRequiredResponse('invoices');
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
