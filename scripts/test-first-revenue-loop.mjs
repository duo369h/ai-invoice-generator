import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveFirstRevenueLoop } from '../src/core/revenue/firstRevenueLoop.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationPath = path.join(root, 'supabase/migration-first-revenue-loops.sql');

const noQuote = resolveFirstRevenueLoop({ plan: 'free' });
assert.deepEqual(noQuote, {
  stage: 'no_quote',
  mode: 'allowance',
  quoteId: null,
  invoiceId: null,
  canCreateQuote: true,
  canSendQuote: false,
  canOpenQuotePortal: false,
  canCreateInvoiceDraft: false,
  canPreparePayment: false,
});

assert.equal(
  resolveFirstRevenueLoop({
    plan: 'free',
    loop: { quote_id: 'quote-1', invoice_id: null, legacy_blocked_at: null },
    quote: { id: 'quote-1', status: 'sent' },
  }).stage,
  'sent',
  'a sent anchor quote must await a client decision'
);

assert.equal(
  resolveFirstRevenueLoop({
    plan: 'free',
    loop: { quote_id: 'quote-1', invoice_id: null, legacy_blocked_at: null },
    quote: { id: 'quote-1', status: 'approved' },
  }).canCreateInvoiceDraft,
  true,
  'only an approved anchor quote can create the free invoice draft'
);

assert.equal(
  resolveFirstRevenueLoop({
    plan: 'free',
    loop: { quote_id: 'quote-1', invoice_id: 'invoice-1', legacy_blocked_at: null },
    quote: { id: 'quote-1', status: 'converted' },
    invoice: { id: 'invoice-1', status: 'pending', payment_link: '' },
  }).stage,
  'invoice_draft',
  'an invoice without a payment link remains in payment preparation'
);

assert.equal(
  resolveFirstRevenueLoop({
    plan: 'free',
    loop: { quote_id: 'quote-1', invoice_id: 'invoice-1', legacy_blocked_at: null },
    quote: { id: 'quote-1', status: 'converted' },
    invoice: { id: 'invoice-1', status: 'pending', payment_link: 'https://pay.example.com/invoice-1' },
  }).stage,
  'complete',
  'a linked invoice with an external payment link completes payment preparation'
);

assert.equal(
  resolveFirstRevenueLoop({
    plan: 'free',
    loop: { quote_id: null, invoice_id: null, legacy_blocked_at: '2026-07-10T00:00:00.000Z' },
  }).stage,
  'unavailable',
  'historical free users marked by cutover cannot claim a new loop'
);

assert.equal(
  resolveFirstRevenueLoop({ plan: 'pro' }).mode,
  'plan',
  'paid plans continue to use subscription entitlements rather than the free allowance'
);

assert.equal(
  resolveFirstRevenueLoop({
    plan: 'free',
    loop: { quote_id: 'quote-1', invoice_id: null, legacy_blocked_at: null },
    quote: null,
  }).stage,
  'no_quote',
  'a stale loop that points to a missing quote should be treated as recoverable and allow a fresh first quote'
);

assert.equal(
  resolveFirstRevenueLoop({
    plan: 'free',
    loop: { quote_id: 'quote-1', invoice_id: null, legacy_blocked_at: null },
    quote: null,
  }).canCreateQuote,
  true,
  'a stale loop should not deny the first-quote action when the referenced quote is missing'
);

const migration = fs.readFileSync(migrationPath, 'utf8');
for (const requiredFragment of [
  'CREATE TABLE IF NOT EXISTS public.first_revenue_loops',
  'ON DELETE RESTRICT',
  'ALTER TABLE public.first_revenue_loops ENABLE ROW LEVEL SECURITY',
  'REVOKE ALL ON TABLE public.first_revenue_loops FROM anon, authenticated',
  'CREATE OR REPLACE FUNCTION public.claim_first_revenue_quote',
  'CREATE OR REPLACE FUNCTION public.claim_first_revenue_invoice_draft',
  'SECURITY INVOKER',
  'legacy_blocked_at',
  'REVOKE ALL ON FUNCTION public.claim_first_revenue_quote',
  'REVOKE ALL ON FUNCTION public.claim_first_revenue_invoice_draft',
  'GRANT EXECUTE ON FUNCTION public.claim_first_revenue_quote',
  'GRANT EXECUTE ON FUNCTION public.claim_first_revenue_invoice_draft',
]) {
  assert.ok(migration.includes(requiredFragment), `missing migration security contract: ${requiredFragment}`);
}

console.log('First revenue loop resolver and migration contract tests passed.');
