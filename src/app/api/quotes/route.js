import { NextResponse } from 'next/server';
import { createServiceSupabaseClient, createSupabasePortalToken, getRequestUser, writeAuditLog, recordServerGrowthEvent, trackProfileMetric } from '../../lib/supabase';
import { rateLimitAuthenticated } from '../../lib/rate-limit';
import { authRequiredResponse, getIp, requestContextResponse } from '../../lib/security';
import { enumValue, validateObject, validateQuotePayload, validationResponse } from '../../lib/validation';
import { recordProductAnalyticsEvent } from '../../lib/product-analytics-server';
import { getFirstRevenueLoopContext } from '../../lib/first-revenue-loop';
import { canTransitionFirstRevenueQuote } from '../../../core/revenue/firstRevenueLoop';

function isCleanUnclaimedFirstRevenueContext(firstRevenueLoop) {
  const { decision, loop, quote, invoice } = firstRevenueLoop || {};
  const hasNoClaimedLoop = loop === null || (
    loop?.quote_id === null
    && loop.invoice_id === null
    && loop.legacy_blocked_at === null
  );

  return Boolean(
    hasNoClaimedLoop
    && quote === null
    && invoice === null
    && decision?.mode === 'allowance'
    && decision?.canCreateQuote === true
  );
}

function isValidClaimedFirstRevenueAnchor(firstRevenueLoop) {
  const { decision, loop, quote, invoice } = firstRevenueLoop || {};
  const hasConsistentInvoice = loop?.invoice_id === null
    ? invoice === null
    : typeof loop?.invoice_id === 'string'
      && loop.invoice_id.length > 0
      && typeof invoice?.id === 'string'
      && invoice.id === loop.invoice_id;

  return Boolean(
    typeof loop?.quote_id === 'string'
    && loop.quote_id.length > 0
    && typeof quote?.id === 'string'
    && quote.id.length > 0
    && quote.id === loop.quote_id
    && loop.legacy_blocked_at === null
    && hasConsistentInvoice
    && decision?.mode === 'allowance'
    && decision?.canCreateQuote === false
  );
}

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

    const serviceSupabase = createServiceSupabaseClient();
    if (!serviceSupabase) {
      return NextResponse.json({ error: 'First revenue loop service is unavailable' }, { status: 503 });
    }

    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('plan')
      .eq('id', context.user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    const plan = profile?.plan || 'free';

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
      const quotesTablePayload = {
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

      let shouldClaimFirstRevenueQuote = false;
      if (plan === 'free') {
        const firstRevenueLoop = await getFirstRevenueLoopContext(serviceSupabase, context.user.id, plan);

        if (id) {
          const transition = canTransitionFirstRevenueQuote({
            plan,
            loop: firstRevenueLoop.loop,
            quote: firstRevenueLoop.quote,
            requestedStatus: status,
          });
          if (!transition.allowed || firstRevenueLoop.quote?.id !== id) {
            return NextResponse.json({ error: transition.reason }, { status: 403 });
          }
        } else {
          shouldClaimFirstRevenueQuote = isCleanUnclaimedFirstRevenueContext(firstRevenueLoop);
          if (!shouldClaimFirstRevenueQuote && !isValidClaimedFirstRevenueAnchor(firstRevenueLoop)) {
            return NextResponse.json({ error: 'FIRST_REVENUE_QUOTE_ALREADY_CLAIMED' }, { status: 409 });
          }
        }
      }

      let data;
      let error;
      if (id) {
        ({ data, error } = await serviceSupabase
          .from('quotes')
          .update(quotesTablePayload)
          .eq('id', id)
          .eq('user_id', context.user.id)
          .select('*')
          .single());
      } else if (shouldClaimFirstRevenueQuote) {
        const profileName =
          context.user.user_metadata?.name ||
          context.user.user_metadata?.full_name ||
          context.user.email?.split('@')[0] ||
          'User';
        const firstRevenueRpcPayload = {
          ...quotesTablePayload,
          _profile_email: context.user.email || '',
          _profile_name: profileName,
        };
        ({ data, error } = await serviceSupabase.rpc('create_first_revenue_quote', {
          p_user_id: context.user.id,
          p_quote: firstRevenueRpcPayload,
        }));
        if (Array.isArray(data)) data = data[0] || null;
      } else {
        ({ data, error } = await serviceSupabase
          .from('quotes')
          .insert(quotesTablePayload)
          .select('*')
          .single());
      }

      if (error?.message?.includes('first_revenue_quote_already_claimed') || error?.message?.includes('first_revenue_loop_legacy_blocked')) {
        return NextResponse.json({ error: 'FIRST_REVENUE_QUOTE_ALREADY_CLAIMED' }, { status: 409 });
      }
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
      const profile = await (await import('../../lib/supabase')).ensureProfile(context.supabase, context.user);
      const plan = profile?.plan || 'free';
      const serviceSupabase = createServiceSupabaseClient();
      if (!serviceSupabase) {
        return NextResponse.json({ error: 'Quote service is unavailable' }, { status: 503 });
      }
      if (plan === 'free') {
        const firstRevenueLoop = await getFirstRevenueLoopContext(serviceSupabase, context.user.id, plan);
        const transition = canTransitionFirstRevenueQuote({
          plan,
          loop: firstRevenueLoop.loop,
          quote: firstRevenueLoop.quote,
          requestedStatus: status,
        });
        if (!transition.allowed || firstRevenueLoop.quote?.id !== id) {
          return NextResponse.json({ error: transition.reason || 'first_revenue_quote_unavailable' }, { status: 403 });
        }
      }

      const { data, error } = await serviceSupabase
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
            await sendQuoteApprovedEmail(profile.email, data, profile.name || 'Photographer');
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

export async function DELETE(request) {
  try {
    const ip = getIp(request);
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'quotes');
    if (contextFailure) return contextFailure;

    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
    }

    if (context.mode === 'supabase') {
      const { data: deletedQuote, error } = await context.supabase
        .from('quotes')
        .delete()
        .eq('id', id)
        .eq('user_id', context.user.id)
        .select('id')
        .maybeSingle();

      if (error?.code === '23503') {
        return NextResponse.json(
          { error: 'This quote is linked to a revenue workflow and cannot be deleted.' },
          { status: 409 }
        );
      }
      if (error) throw error;
      if (!deletedQuote) {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
      }

      try {
        await writeAuditLog(context.supabase, {
          userId: context.user.id,
          action: 'quote_deleted',
          resourceType: 'quote',
          resourceId: deletedQuote.id,
          ip,
        });
      } catch (auditError) {
        console.error('Failed to write quote deletion audit log:', auditError);
      }

      return NextResponse.json({ success: true, id: deletedQuote.id });
    }

    return authRequiredResponse('quotes');
  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json({ error: 'Failed to delete quote' }, { status: 500 });
  }
}
