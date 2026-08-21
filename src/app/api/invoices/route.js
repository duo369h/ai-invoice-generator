import { NextResponse } from 'next/server';
import {
  createServiceSupabaseClient,
  createSupabasePortalToken,
  ensureProfile,
  getRequestUser,
  getSupabaseQuota,
  getDocumentQuota,
  createInvoiceWithAtomicQuota,
  mapSupabaseInvoice,
  incrementSupabaseInvoiceUsage,
  writeAuditLog,
  recordServerGrowthEvent,
  trackProfileMetric
} from '../../lib/supabase';
import { rateLimitAuthenticated } from '../../lib/rate-limit';
import { authRequiredResponse, getIp, requestContextResponse } from '../../lib/security';
import { validateInvoicePayload, validateObject, validationResponse } from '../../lib/validation';
import { injectInvoiceEnhancement } from '../../../core/ai/AI_DECISION_INJECTION_MAP';
import { getDecision } from '../../../core/ai/AI_DECISION_CORE';
import { assertCoreDecisionSource } from '../../../core/ai/AI_DECISION_GUARD';
import { getSiteUrl } from '../../lib/config';
import { recordProductAnalyticsEvent } from '../../lib/product-analytics-server';

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

    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }
    const body = validateInvoicePayload(await request.json());

    const {
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

    // Calculate subtotal and total in cents
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 1) * Math.round(Number(item.unitPrice || item.unit_price || 0) * 100)), 0);
    const discount_amount = Math.round(subtotal * (Number(discount_rate) / 100));
    const taxable_amount = Math.max(0, subtotal - discount_amount);
    const tax_amount = Math.round(taxable_amount * (Number(tax_rate) / 100));
    const total = taxable_amount + tax_amount;

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
        invoice_number: invoice_number || `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: defaultStatus,
        doc_type: doc_type || 'invoice',
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
        items: items.map((item, idx) => ({
          description: idx === 0 ? invoice.description : item.description,
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
        notes: notes || '',
        invoice_kind: ['standard', 'deposit', 'milestone', 'final'].includes(invoice_kind) ? invoice_kind : 'standard',
        payment_status: 'unpaid',
        amount_paid_cents: 0,
        amount_due_cents: total
      };

      let creation;
      try {
        const serviceSupabase = createServiceSupabaseClient() || context.supabase;
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

    if (id && !status) {
      if (context.mode !== 'supabase') return authRequiredResponse('invoices');
      const items = Array.isArray(body.items) ? body.items : [];
      const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 1) * Math.round(Number(item.unitPrice || item.unit_price || 0) * 100)), 0);
      const discountRate = Number(body.discount_rate || 0);
      const taxRate = Number(body.tax_rate || 0);
      const discountAmount = Math.round(subtotal * (discountRate / 100));
      const taxableAmount = Math.max(0, subtotal - discountAmount);
      const taxAmount = Math.round(taxableAmount * (taxRate / 100));
      const total = taxableAmount + taxAmount;
      const writer = createServiceSupabaseClient() || context.supabase;
      const { data, error } = await writer.from('invoices').update({
        client_name: body.client_name || '', client_email: body.client_email || '', client_address: body.client_address || '',
        currency: String(body.currency || 'USD').toUpperCase(),
        items: items.map((item) => ({ description: item.description, quantity: Number(item.quantity) || 1, unit_price: Math.round(Number(item.unitPrice || item.unit_price || 0) * 100), amount: (Number(item.quantity) || 1) * Math.round(Number(item.unitPrice || item.unit_price || 0) * 100) })),
        discount_rate: discountRate, discount_amount: discountAmount, tax_rate: taxRate, tax_amount: taxAmount,
        subtotal, total, amount_paid_cents: 0, amount_due_cents: total, payment_status: 'unpaid', payment_link: body.payment_link || '',
        invoice_number: body.invoice_number || undefined, invoice_date: body.invoice_date || undefined, due_date: body.due_date || undefined,
        payment_terms: body.payment_terms || 'Net 30', notes: body.notes || '', updated_at: new Date().toISOString()
      }).eq('id', id).eq('user_id', context.user.id).eq('status', 'draft').select('*').single();
      if (error || !data) return NextResponse.json({ error: 'Draft invoice not found or is no longer editable' }, { status: 409 });
      return NextResponse.json(mapSupabaseInvoice(data));
    }

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields: id and status' }, { status: 400 });
    }

    if (status === 'paid') {
      return NextResponse.json({ error: 'Payment records determine paid state' }, { status: 400 });
    }

    if (context.mode === 'supabase') {
      const serviceSupabase = createServiceSupabaseClient() || context.supabase;
      const { data, error } = await serviceSupabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .eq('user_id', context.user.id)
        .select('*')
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
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
            const { createSupabasePortalToken } = await import('../../lib/supabase');
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

      if (status === 'paid') {
        // V3_REVENUE_HOOK_POINT
        // DO NOT IMPLEMENT YET
        try {
          const { data: profile } = await context.supabase
            .from('profiles')
            .select('name, email, plan')
            .eq('id', context.user.id)
            .maybeSingle();

          const { sendInvoicePaidEmail } = await import('../../lib/email');
          if (profile?.email) {
            await sendInvoicePaidEmail(profile.email, data, profile.name || 'Freelancer');
          }
          if (data.client_email) {
            await sendInvoicePaidEmail(data.client_email, data, profile?.name || 'Freelancer');
          }
          await recordProductAnalyticsEvent({
            eventName: 'Invoice Paid',
            userId: context.user.id,
            source: 'invoices_api',
            properties: {
              identity: context.user.id,
              user_id: context.user.id,
              plan: profile?.plan || 'free',
              country: '',
              invoice_id: data.id,
              invoice_number: data.invoice_number,
              total: data.total,
              currency: data.currency,
              source: 'invoices_api',
              timestamp: new Date().toISOString(),
            },
          });
        } catch (mailErr) {
          console.error('Failed to trigger Invoice Paid follow-up:', mailErr);
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
