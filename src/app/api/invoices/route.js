import { NextResponse } from 'next/server';
import { getInvoices, saveInvoice, updateInvoiceStatus } from '../../lib/db';
import { checkQuota } from '../../lib/quota';
import {
  ensureProfile,
  getRequestUser,
  getSupabaseQuota,
  mapSupabaseInvoice
} from '../../lib/supabase';

const DEMO_USER_ID = 'usr_demo123';

export async function GET(request) {
  try {
    const context = await getRequestUser(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (context.mode === 'supabase') {
      await ensureProfile(context.supabase, context.user);

      let query = context.supabase
        .from('invoices')
        .select('*')
        .eq('user_id', context.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status === 'unpaid' ? 'draft' : status);
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

    let invoices = getInvoices();

    if (status) {
      invoices = invoices.filter(inv => inv.status === status);
    }

    invoices = invoices.slice(0, limit);

    return NextResponse.json({
      object: 'list',
      data: invoices,
      has_more: invoices.length > limit
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const context = await getRequestUser(request);
    const body = await request.json();

    const {
      client_name,
      client_email,
      client_address = '',
      business_name = '',
      business_email = '',
      business_address = '',
      logo_url = '',
      currency = 'usd',
      items = [],
      discount_rate = 0,
      tax_rate = 0,
      invoice_number = '',
      payment_terms = 'Net 30',
      notes = '',
      invoice_date = '',
      due_date = '',
      doc_type = 'invoice'
    } = body;

    if (!client_name || !items.length) {
      return NextResponse.json({ error: 'Missing required fields: client_name and items' }, { status: 400 });
    }

    // Calculate subtotal and total in cents
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.unit_price || 0)), 0);
    const discount_amount = Math.round(subtotal * (Number(discount_rate) / 100));
    const taxable_amount = Math.max(0, subtotal - discount_amount);
    const tax_amount = Math.round(taxable_amount * (Number(tax_rate) / 100));
    const total = taxable_amount + tax_amount;

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
        status: 'draft',
        doc_type: doc_type || 'invoice',
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
          unit_price: Number(item.unit_price) || 0,
          amount: (Number(item.quantity) || 1) * (Number(item.unit_price) || 0)
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
      return NextResponse.json(mapSupabaseInvoice(data), { status: 201 });
    }

    // Check local demo quota
    const quota = checkQuota(DEMO_USER_ID);
    if (!quota.invoicesAllowed) {
      return NextResponse.json(
        { error: 'Monthly invoice limit reached. Please upgrade to Pro.', code: 'QUOTA_EXCEEDED' },
        { status: 403 }
      );
    }

    const newInvoice = {
      id: `inv_${Math.random().toString(36).substring(2, 14)}`,
      user_id: DEMO_USER_ID,
      object: 'invoice',
      doc_type: doc_type || 'invoice',
      invoice_number: invoice_number || `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: 'unpaid',
      
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
        unit_price: Number(item.unit_price) || 0,
        amount: (Number(item.quantity) || 1) * (Number(item.unit_price) || 0)
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

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const context = await getRequestUser(request);
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields: id and status' }, { status: 400 });
    }

    if (context.mode === 'supabase') {
      const supabaseStatus = status === 'unpaid' ? 'draft' : status;
      const { data, error } = await context.supabase
        .from('invoices')
        .update({ status: supabaseStatus })
        .eq('id', id)
        .eq('user_id', context.user.id)
        .select('*')
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      return NextResponse.json(mapSupabaseInvoice(data));
    }

    const updated = updateInvoiceStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    return NextResponse.json({ error: 'Failed to update invoice status' }, { status: 500 });
  }
}
