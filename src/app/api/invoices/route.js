import { NextResponse } from 'next/server';
import {
  createSupabasePortalToken,
  ensureProfile,
  getRequestUser,
  getSupabaseQuota,
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
      payment_link
    } = body;

    // Calculate subtotal and total in cents
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 1) * Math.round(Number(item.unitPrice || item.unit_price || 0) * 100)), 0);
    const discount_amount = Math.round(subtotal * (Number(discount_rate) / 100));
    const taxable_amount = Math.max(0, subtotal - discount_amount);
    const tax_amount = Math.round(taxable_amount * (Number(tax_rate) / 100));
    const total = taxable_amount + tax_amount;

    // Default status: quotes -> draft, invoices -> pending, receipts -> paid
    let defaultStatus = 'pending';
    if (doc_type === 'quote') {
      defaultStatus = 'draft';
    } else if (doc_type === 'receipt') {
      defaultStatus = 'paid';
    }

    if (context.mode === 'supabase') {
      const profile = await ensureProfile(context.supabase, context.user);
      const quota = await getSupabaseQuota(context.supabase, context.user.id, profile.plan);

      if (!quota.invoicesAllowed) {
        return NextResponse.json(
          { error: 'Monthly invoice limit reached. Please upgrade to Pro.', code: 'QUOTA_EXCEEDED' },
          { status: 403 }
        );
      }

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
        notes: notes || ''
      };

      const { data, error } = await context.supabase
        .from('invoices')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;

      // V3_REVENUE_HOOK_POINT
      // DO NOT IMPLEMENT YET
      await trackProfileMetric(context.supabase, context.user.id, 'first_invoice_created_at');

      try {
        await incrementSupabaseInvoiceUsage(context.supabase, context.user.id);
      } catch (useErr) {
        console.error('Failed to increment supabase invoice usage:', useErr);
      }

      let portalToken = '';
      try {
        portalToken = await createSupabasePortalToken(context.supabase, {
          ownerId: context.user.id,
          resourceType: 'invoice',
          resourceId: data.id,
        });
      } catch (tokenErr) {
        console.error('Failed to create invoice portal token:', tokenErr);
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
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
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

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields: id and status' }, { status: 400 });
    }

    if (context.mode === 'supabase') {
      const { data, error } = await context.supabase
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
          const { createSupabasePortalToken } = await import('../../lib/supabase');
          const portalToken = await createSupabasePortalToken(context.supabase, {
            ownerId: context.user.id,
            resourceType: 'invoice',
            resourceId: data.id
          });
          const portalUrl = `${getSiteUrl()}/portal/${portalToken}`;
          
          const { data: profile } = await context.supabase
            .from('profiles')
            .select('name')
            .eq('id', context.user.id)
            .maybeSingle();

          const { sendInvoiceSentEmail } = await import('../../lib/email');
          await sendInvoiceSentEmail(data.client_email, data, portalUrl, profile?.name || 'Freelancer');
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
