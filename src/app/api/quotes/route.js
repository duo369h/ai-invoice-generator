import { NextResponse } from 'next/server';
import { createSupabasePortalToken, getRequestUser, writeAuditLog, recordServerGrowthEvent, trackProfileMetric } from '../../lib/supabase';
import { rateLimitAuthenticated } from '../../lib/rate-limit';
import { authRequiredResponse, getIp, requestContextResponse } from '../../lib/security';
import { enumValue, validateObject, validateQuotePayload, validationResponse } from '../../lib/validation';
import { recordProductAnalyticsEvent } from '../../lib/product-analytics-server';

export async function GET(request) {
  try {
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'quotes');
    if (contextFailure) return contextFailure;
    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }
    
    if (context.mode === 'supabase') {
      const { data, error } = await context.supabase
        .from('quotes')
        .select('*')
        .eq('user_id', context.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ data: data || [] });
    }

    return authRequiredResponse('quotes');

  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const ip = getIp(request);
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'quotes');
    if (contextFailure) return contextFailure;

    const { ensureProfile } = await import('../../lib/supabase');
    const profile = await ensureProfile(context.supabase, context.user);
    const plan = profile?.plan || 'free';

    if (plan === 'free') {
      // Bypass plan limit checks during onboarding (until user triggers FIRST_VALUE_CREATED)
      const { count: activationEventCount } = await context.supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', context.user.id)
        .eq('event', 'FIRST_VALUE_CREATED');

      const hasActivated = (activationEventCount || 0) > 0;

      if (hasActivated) {
        const { count, error: countErr } = await context.supabase
          .from('quotes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', context.user.id);

        if (!countErr && count !== null && count >= 1) {
          return NextResponse.json({
            error: "UPGRADE_REQUIRED",
            requiredPlan: "starter"
          }, { status: 403 });
        }
      }
    }

    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }
    const body = validateQuotePayload(await request.json());

    const {
      id,
      quote_number,
      client_name,
      client_email,
      client_address,
      items,
      discount_rate,
      tax_rate,
      currency,
      notes,
      status
    } = body;

    const calculatedSubtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 1) * Math.round(Number(item.unitPrice || item.unit_price || 0) * 100)), 0);
    const calculatedDiscountAmount = Math.round(calculatedSubtotal * (Number(discount_rate) / 100));
    const taxableAmount = Math.max(0, calculatedSubtotal - calculatedDiscountAmount);
    const calculatedTaxAmount = Math.round(taxableAmount * (Number(tax_rate) / 100));
    const calculatedTotal = taxableAmount + calculatedTaxAmount;

    if (context.mode === 'supabase') {
      const payload = {
        id: id || undefined,
        user_id: context.user.id,
        quote_number: quote_number || `QT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        client_name,
        client_email,
        client_address,
        items: items.map(item => ({
          description: item.description,
          quantity: Number(item.quantity) || 1,
          unit_price: Math.round(Number(item.unitPrice || 0) * 100),
          amount: (Number(item.quantity) || 1) * Math.round(Number(item.unitPrice || 0) * 100)
        })),
        subtotal: calculatedSubtotal,
        discount_rate: Number(discount_rate),
        discount_amount: calculatedDiscountAmount,
        tax_rate: Number(tax_rate),
        tax_amount: calculatedTaxAmount,
        total: calculatedTotal,
        currency,
        notes,
        status,
        updated_at: new Date().toISOString()
      };

      const result = id
        ? await context.supabase
          .from('quotes')
          .update(payload)
          .eq('id', id)
          .eq('user_id', context.user.id)
          .select('*')
          .single()
        : await context.supabase
          .from('quotes')
          .insert(payload)
          .select('*')
          .single();

      const { data, error } = result;
      if (error) throw error;
      let portalToken = '';
      try {
        portalToken = await createSupabasePortalToken(context.supabase, {
          ownerId: context.user.id,
          resourceType: 'quote',
          resourceId: data.id,
        });
      } catch (tokenErr) {
        console.error('Failed to create quote portal token:', tokenErr);
      }

      await writeAuditLog(context.supabase, {
        userId: context.user.id,
        action: id ? 'quote_updated' : 'quote_created',
        resourceType: 'quote',
        resourceId: data.id,
        ip,
      });

      if (!id) {
        try {
          await recordProductAnalyticsEvent({
            eventName: 'Proposal Created',
            userId: context.user.id,
            source: 'quotes_api',
            properties: {
              identity: context.user.id,
              user_id: context.user.id,
              plan: 'free',
              country: '',
              quote_id: data.id,
              quote_number: data.quote_number,
              total: data.total,
              currency: data.currency,
              source: 'quotes_api',
              timestamp: new Date().toISOString(),
            },
          });
        } catch (analyticsError) {
          console.error('Failed to record proposal creation:', analyticsError);
        }
      }

      return NextResponse.json({ ...data, portal_token: portalToken }, { status: 201 });
    }

    return authRequiredResponse('quotes');

  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error creating quote:', error);
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const ip = getIp(request);
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'quotes');
    if (contextFailure) return contextFailure;
    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }
    const body = validateObject(await request.json());
    const id = body.id;
    const status = enumValue(body.status, 'status', ['draft', 'sent', 'approved', 'declined', 'converted']);

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields: id, status' }, { status: 400 });
    }

    if (context.mode === 'supabase') {
      const { data, error } = await context.supabase
        .from('quotes')
        .update({ status })
        .eq('id', id)
        .eq('user_id', context.user.id)
        .select('*')
        .single();

      if (error) throw error;
      await writeAuditLog(context.supabase, {
        userId: context.user.id,
        action: 'quote_status_changed',
        resourceType: 'quote',
        resourceId: data.id,
        ip,
      });

      if (status === 'sent') {
        await trackProfileMetric(context.supabase, context.user.id, 'quote_sent_timestamp');
        await recordServerGrowthEvent(context.supabase, {
          eventName: 'quote_sent',
          userId: context.user.id,
          source: 'user',
          properties: {
            quote_id: data.id,
            quote_number: data.quote_number,
            client_email: data.client_email
          }
        });
        try {
          await recordProductAnalyticsEvent({
            eventName: 'Proposal Sent',
            userId: context.user.id,
            source: 'quotes_api',
            properties: {
              identity: context.user.id,
              user_id: context.user.id,
              plan: 'free',
              country: '',
              quote_id: data.id,
              quote_number: data.quote_number,
              source: 'quotes_api',
              timestamp: new Date().toISOString(),
            },
          });
        } catch (analyticsError) {
          console.error('Failed to record proposal sent:', analyticsError);
        }
      }

      // Trigger Quote Approved email notification
      if (status === 'approved') {
        try {
          const { data: profile } = await context.supabase
            .from('profiles')
            .select('name, email')
            .eq('id', context.user.id)
            .maybeSingle();

          if (profile?.email) {
            const { sendQuoteApprovedEmail } = await import('../../lib/email');
            await sendQuoteApprovedEmail(profile.email, data, profile.name || 'Freelancer');
          }
        } catch (mailErr) {
          console.error('Failed to trigger Quote Approved email:', mailErr);
        }
      }

      return NextResponse.json(data);
    }

    return authRequiredResponse('quotes');

  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error updating quote status:', error);
    return NextResponse.json({ error: 'Failed to update quote status' }, { status: 500 });
  }
}
