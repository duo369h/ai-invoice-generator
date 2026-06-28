import { NextResponse } from 'next/server';
import { requireInternalAdmin } from '../../../lib/internal-admin';
import { createServiceSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase';

function rate(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function money(cents) {
  return Math.round(Number(cents || 0)) / 100;
}

function bucket(rows, keyFn, valueFn = () => 1) {
  return rows.reduce((acc, row) => {
    const key = keyFn(row) || 'Unknown';
    acc[key] = (acc[key] || 0) + valueFn(row);
    return acc;
  }, {});
}

export async function GET(request) {
  const admin = await requireInternalAdmin(request);
  if (admin.response) return admin.response;

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ configured: false, reason: 'supabase_not_configured' });
    }
    const supabase = createServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ configured: false, reason: 'service_role_not_configured' });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.max(1, Math.min(180, Number(searchParams.get('days') || 30)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [quotesResult, invoicesResult, outcomesResult, profilesResult] = await Promise.all([
      supabase
        .from('quotes')
        .select('id, user_id, total, currency, status, created_at')
        .gte('created_at', since)
        .limit(20000),
      supabase
        .from('invoices')
        .select('id, user_id, total, currency, status, doc_type, created_at')
        .gte('created_at', since)
        .limit(20000),
      supabase
        .from('revenue_outcomes')
        .select('user_id, outcome, client_type, price_accepted, price_offered, created_at')
        .gte('created_at', since)
        .limit(20000),
      supabase
        .from('profiles')
        .select('id, plan')
        .limit(20000),
    ]);

    const firstError = [quotesResult.error, invoicesResult.error, outcomesResult.error, profilesResult.error]
      .find((error) => error && error.code !== 'PGRST205');
    if (firstError) throw firstError;

    const quotes = quotesResult.data || [];
    const invoices = invoicesResult.data || [];
    const outcomes = outcomesResult.data || [];
    const profiles = profilesResult.data || [];
    const planByUser = new Map(profiles.map((profile) => [profile.id, profile.plan || 'free']));
    const paidInvoices = invoices.filter((invoice) => invoice.status === 'paid');
    const sentOrClosedQuotes = quotes.filter((quote) => ['sent', 'approved', 'declined', 'converted'].includes(quote.status));
    const acceptedQuotes = quotes.filter((quote) => ['approved', 'converted'].includes(quote.status));
    const invoiceCandidates = invoices.filter((invoice) => invoice.doc_type !== 'quote');

    return NextResponse.json({
      configured: true,
      days,
      generated_at: new Date().toISOString(),
      metrics: {
        proposal_acceptance_rate: rate(acceptedQuotes.length, sentOrClosedQuotes.length || quotes.length),
        invoice_payment_rate: rate(paidInvoices.length, invoiceCandidates.length),
        average_revenue: paidInvoices.length
          ? Math.round((paidInvoices.reduce((sum, invoice) => sum + money(invoice.total), 0) / paidInvoices.length) * 100) / 100
          : 0,
      },
      revenue_by_country: bucket(outcomes, () => 'Unknown', (row) => Number(row.price_accepted || row.price_offered || 0)),
      revenue_by_plan: bucket(paidInvoices, (invoice) => planByUser.get(invoice.user_id) || 'free', (invoice) => money(invoice.total)),
      revenue_by_client_type: bucket(outcomes, (row) => row.client_type, (row) => Number(row.price_accepted || row.price_offered || 0)),
      counts: {
        quotes: quotes.length,
        accepted_quotes: acceptedQuotes.length,
        invoices: invoiceCandidates.length,
        paid_invoices: paidInvoices.length,
        outcomes: outcomes.length,
      },
    });
  } catch (error) {
    console.error('Failed to load revenue validation:', error);
    return NextResponse.json({ error: 'Failed to load revenue validation' }, { status: 500 });
  }
}
