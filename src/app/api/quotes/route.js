import { NextResponse } from 'next/server';
import { getQuotesByUserId, savePortalToken, saveQuote, updateQuoteStatus } from '../../lib/db';
import { createSupabasePortalToken, getRequestUser, writeAuditLog } from '../../lib/supabase';
import { rateLimit } from '../../lib/rate-limit';
import { defaultPortalExpiry, failClosedResponse, generatePortalToken, getIp, hashPortalToken, isDemoModeAllowed } from '../../lib/security';
import { enumValue, validateObject, validateQuotePayload, validationResponse } from '../../lib/validation';

function createLocalPortalToken({ ownerId, resourceType, resourceId }) {
  const token = generatePortalToken();
  savePortalToken({
    token_hash: hashPortalToken(token),
    owner_id: ownerId,
    resource_type: resourceType,
    resource_id: resourceId,
    scope: 'view:comment',
    expires_at: defaultPortalExpiry(),
    revoked_at: null,
  });
  return token;
}

export async function GET(request) {
  try {
    const ip = getIp(request);
    const limitResult = await rateLimit(ip, 60, 60000);
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const context = await getRequestUser(request);
    
    if (context.mode === 'supabase') {
      const { data, error } = await context.supabase
        .from('quotes')
        .select('*')
        .eq('user_id', context.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ data: data || [] });
    }

    // Local / Mock fallback
    if (!isDemoModeAllowed()) return failClosedResponse('Quotes');
    const targetUserId = context.mode === 'mock' ? 'usr_mock123' : 'usr_demo123';
    const quotes = getQuotesByUserId(targetUserId);
    return NextResponse.json({ data: quotes });

  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const ip = getIp(request);
    const limitResult = await rateLimit(ip, 60, 60000);
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const context = await getRequestUser(request);
    if (context.mode === 'demo') {
      return NextResponse.json({ error: 'Authentication required to save quotes' }, { status: 401 });
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

      return NextResponse.json({ ...data, portal_token: portalToken }, { status: 201 });
    }

    // Local / Mock fallback
    if (!isDemoModeAllowed()) return failClosedResponse('Quotes');
    const targetUserId = context.mode === 'mock' ? 'usr_mock123' : 'usr_demo123';
    const payload = {
      id: id || `quote_${Math.random().toString(36).substring(2, 14)}`,
      user_id: targetUserId,
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
      status
    };

    const saved = saveQuote(payload);
    const portalToken = createLocalPortalToken({
      ownerId: targetUserId,
      resourceType: 'quote',
      resourceId: saved.id,
    });
    return NextResponse.json({ ...saved, portal_token: portalToken }, { status: 201 });

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
    const limitResult = await rateLimit(ip, 60, 60000);
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const context = await getRequestUser(request);
    if (context.mode === 'demo') {
      return NextResponse.json({ error: 'Authentication required to modify quotes' }, { status: 401 });
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
      return NextResponse.json(data);
    }

    // Local / Mock fallback
    if (!isDemoModeAllowed()) return failClosedResponse('Quotes');
    const updated = updateQuoteStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
    return NextResponse.json(updated);

  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error updating quote status:', error);
    return NextResponse.json({ error: 'Failed to update quote status' }, { status: 500 });
  }
}
