import { NextResponse } from 'next/server';
import { getInvoices, saveInvoice, savePortalToken, updateInvoiceStatus } from '../../lib/db';
import { checkQuota } from '../../lib/quota';
import {
  createSupabasePortalToken,
  ensureProfile,
  getRequestUser,
  getSupabaseQuota,
  mapSupabaseInvoice,
  incrementSupabaseInvoiceUsage,
  writeAuditLog
} from '../../lib/supabase';
import { rateLimit } from '../../lib/rate-limit';
import { defaultPortalExpiry, failClosedResponse, generatePortalToken, getIp, hashPortalToken, isDemoModeAllowed } from '../../lib/security';
import { validateInvoicePayload, validateObject, validationResponse } from '../../lib/validation';

const DEMO_USER_ID = 'usr_demo123';

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

    if (context.mode === 'mock') {
      if (!isDemoModeAllowed()) return failClosedResponse('Invoices');
      let invoices = getInvoices().filter(inv => inv.user_id === 'usr_mock123');

      if (status) {
        invoices = invoices.filter(inv => {
          if (status === 'pending') {
            return inv.status === 'pending' || inv.status === 'unpaid' || inv.status === 'sent';
          }
          return inv.status === status;
        });
      }

      const hasMore = invoices.length > limit;
      invoices = invoices.slice(0, limit);

      return NextResponse.json({
        object: 'list',
        data: invoices,
        has_more: hasMore,
        auth_mode: 'mock'
      });
    }

    // fallback to demo mode
    if (!isDemoModeAllowed()) return failClosedResponse('Invoices');
    let invoices = getInvoices().filter(inv => inv.user_id === DEMO_USER_ID || !inv.user_id);

    if (status) {
      invoices = invoices.filter(inv => {
        if (status === 'pending') {
          return inv.status === 'pending' || inv.status === 'unpaid' || inv.status === 'sent';
        }
        return inv.status === status;
      });
    }

    const hasMore = invoices.length > limit;
    invoices = invoices.slice(0, limit);

    return NextResponse.json({
      object: 'list',
      data: invoices,
      has_more: hasMore,
      auth_mode: 'demo'
    });
  } catch (error) {
    console.error('Error in invoices GET:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
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
      return NextResponse.json({ error: 'Authentication required to save invoices' }, { status: 401 });
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
      stripe_payment_link,
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

      const payload = {
        user_id: context.user.id,
        invoice_number: invoice_number || `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: defaultStatus,
        doc_type: doc_type || 'invoice',
        client_id: client_id || null,
        quote_id: quote_id || null,
        stripe_payment_link: stripe_payment_link || payment_link || '',
        client_name,
        client_email: client_email || '',
        client_address: client_address || '',
        business_name: business_name || '',
        business_email: business_email || '',
        business_address: business_address || '',
        logo_url: logo_url || '',
        currency: currency.toUpperCase(),
        items: items.map(item => ({
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

      const { data, error } = await context.supabase
        .from('invoices')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;

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

      return NextResponse.json({ ...mapSupabaseInvoice(data), portal_token: portalToken }, { status: 201 });
    }

    // Check local mock or demo user plan
    if (!isDemoModeAllowed()) return failClosedResponse('Invoices');
    const targetUserId = context.mode === 'mock' ? 'usr_mock123' : DEMO_USER_ID;

    // Check local quota
    const quota = checkQuota(targetUserId);
    if (!quota.invoicesAllowed) {
      return NextResponse.json(
        { error: 'Monthly invoice limit reached. Please upgrade to Pro.', code: 'QUOTA_EXCEEDED' },
        { status: 403 }
      );
    }

    const newInvoice = {
      id: `inv_${Math.random().toString(36).substring(2, 14)}`,
      user_id: targetUserId,
      object: 'invoice',
      doc_type: doc_type || 'invoice',
      invoice_number: invoice_number || `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: defaultStatus,
      client_id: client_id || null,
      quote_id: quote_id || null,
      stripe_payment_link: stripe_payment_link || payment_link || '',
      payment_link: payment_link || stripe_payment_link || '',
      
      // Client
      client_name,
      client_email: client_email || '',
      client_address: client_address || '',
      
      // Business
      business_name: business_name || '',
      business_email: business_email || '',
      business_address: business_address || '',
      logo_url: logo_url || '',
      
      // Financial
      currency: currency.toLowerCase(),
      items: items.map(item => ({
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
      
      // Dates & terms
      invoice_date: invoice_date || new Date().toISOString().substring(0, 10),
      due_date: due_date || '',
      payment_terms: payment_terms || 'Net 30',
      notes: notes || '',
      
      pdf_url: `/dashboard/print?id=${Math.random().toString(36).substring(2, 14)}`,
      created_at: new Date().toISOString()
    };

    saveInvoice(newInvoice);
    const portalToken = createLocalPortalToken({
      ownerId: targetUserId,
      resourceType: 'invoice',
      resourceId: newInvoice.id,
    });

    return NextResponse.json({ ...newInvoice, portal_token: portalToken }, { status: 201 });
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
    const limitResult = await rateLimit(ip, 60, 60000);
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const context = await getRequestUser(request);
    if (context.mode === 'demo') {
      return NextResponse.json({ error: 'Authentication required to modify invoices' }, { status: 401 });
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

      return NextResponse.json(mapSupabaseInvoice(data));
    }

    const targetUserId = context.mode === 'mock' ? 'usr_mock123' : DEMO_USER_ID;
    if (!isDemoModeAllowed()) return failClosedResponse('Invoices');
    
    // Read and verify ownership
    const invoices = getInvoices();
    const invoice = invoices.find(inv => inv.id === id && inv.user_id === targetUserId);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const updated = updateInvoiceStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error updating invoice status:', error);
    return NextResponse.json({ error: 'Failed to update invoice status' }, { status: 500 });
  }
}
