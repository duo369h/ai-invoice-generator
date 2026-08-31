#!/usr/bin/env node

/**
 * Current first-revenue-loop behavior and migration-authority verification.
 *
 * The behavioral portion imports the pure resolver only. The migration
 * portion reads the active timestamped SQL chain as text; it never connects
 * to Supabase, executes SQL, or treats the historical root archive as proof.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveFirstRevenueLoop } from '../src/core/revenue/firstRevenueLoop.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.fetch = () => {
  throw new Error('network access is forbidden in test-first-revenue-loop.mjs');
};

const CURRENT_MIGRATION_AUTHORITY = [
  {
    file: 'supabase/migrations/20260618000000_canonical_corvioz_baseline.sql',
    role: 'canonical local bootstrap; defines first_revenue_loops and the initial claim functions',
    fragments: [
      'CREATE TABLE IF NOT EXISTS public.first_revenue_loops',
      'CREATE OR REPLACE FUNCTION public.claim_first_revenue_quote',
      'CREATE OR REPLACE FUNCTION public.claim_first_revenue_invoice_draft',
    ],
  },
  {
    file: 'supabase/migrations/20260711181554_invoice_payment_foundation.sql',
    role: 'payment ledger columns/table and first-revenue invoice-draft claim',
    fragments: [
      'CREATE TABLE IF NOT EXISTS public.invoice_payments',
      'CREATE OR REPLACE FUNCTION public.record_invoice_payment',
      'CREATE OR REPLACE FUNCTION public.claim_first_revenue_invoice_draft',
      'payment_status',
    ],
  },
  {
    file: 'supabase/migrations/20260711183628_invoice_payments_service_role_permissions.sql',
    role: 'service-role payment ledger write permissions',
    fragments: ['GRANT SELECT, INSERT ON TABLE public.invoice_payments TO service_role'],
  },
  {
    file: 'supabase/migrations/20260711192505_first_revenue_loop_payment_completion.sql',
    role: 'first-revenue stage and payment-completion lifecycle',
    fragments: [
      'ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT',
      'first_revenue_loops_stage_check',
      "stage = 'invoice_created'",
      'first_payment_received_at',
      'completed_at',
    ],
  },
  {
    file: 'supabase/migrations/20260821174436_pricing_quota_client_quote_foundation.sql',
    role: 'current pricing/quota and atomic Quote/Invoice creation authority',
    fragments: [
      'CREATE OR REPLACE FUNCTION public.check_and_create_quote',
      'CREATE OR REPLACE FUNCTION public.check_and_create_invoice',
      'payment_status',
      'amount_due_cents',
    ],
  },
  {
    file: 'supabase/migrations/20260821185325_approved_quote_invoice_draft.sql',
    role: 'approved Quote to Invoice Draft boundary',
    fragments: [
      'CREATE TABLE IF NOT EXISTS public.quote_invoice_conversions',
      'CREATE OR REPLACE FUNCTION public.create_invoice_draft_from_approved_quote',
      "'payment_status', 'unpaid'",
    ],
  },
  {
    file: 'supabase/migrations/20260821190820_payment_idempotency.sql',
    role: 'current idempotent payment RPC authority',
    fragments: [
      'ADD COLUMN IF NOT EXISTS idempotency_key TEXT',
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_payments_user_idempotency_key',
      'p_idempotency_key TEXT DEFAULT NULL',
    ],
  },
  {
    file: 'supabase/migrations/20260821191944_payment_rpc_cleanup.sql',
    role: 'retirement of the legacy six-argument payment RPC and overpayment guard',
    fragments: [
      'DROP FUNCTION public.record_invoice_payment(UUID, UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ)',
      'invoice_payment_exceeds_amount_due',
      'invoice_payment_idempotency_key_reused',
    ],
  },
  {
    file: 'supabase/migrations/20260826004100_paddle_checkout_source_schema_closure_r1.sql',
    role: 'current subscription/entitlement plan schema closure',
    fragments: [
      "CHECK (plan IN ('free', 'starter', 'pro', 'agency', 'studio'))",
      'CREATE TABLE IF NOT EXISTS public.billing_events',
    ],
  },
  {
    file: 'supabase/migrations/20260826010904_paddle_source_schema_strict_closure_r2.sql',
    role: 'current webhook event ordering/idempotency closure',
    fragments: [
      'latest_event_occurred_at',
      'CREATE UNIQUE INDEX IF NOT EXISTS billing_events_event_id_unique',
      'CREATE OR REPLACE FUNCTION public.apply_paddle_webhook_event',
    ],
  },
  {
    file: 'supabase/migrations/20260826113534_migration_authority_reconciliation_r3.sql',
    role: 'current migration reconciliation; retains the baseline event-id constraint',
    fragments: [
      'DROP INDEX public.billing_events_event_id_unique',
      "c.conname = 'billing_events_event_id_key'",
    ],
  },
];

const historicalRootMigration = 'supabase/migration-first-revenue-loops.sql';

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertMigrationAuthority() {
  const files = CURRENT_MIGRATION_AUTHORITY.map(({ file }) => file);
  assert.deepEqual(files, [...files].sort(), 'current migration authority is timestamp ordered');
  assert.equal(files.includes(historicalRootMigration), false, 'historical root migration is not authority');

  for (const migration of CURRENT_MIGRATION_AUTHORITY) {
    assert.equal(fs.existsSync(path.join(root, migration.file)), true, `current migration exists: ${migration.file}`);
    const sql = read(migration.file);
    for (const fragment of migration.fragments) {
      assert.match(sql, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${migration.file}: ${fragment}`);
    }
  }

  console.log('MIGRATION_AUTHORITY_SKIPPED=NO');
  console.log(`CURRENT_MIGRATION_AUTHORITY_FILES=${files.join(',')}`);
  console.log(`HISTORICAL_ROOT_MIGRATION_REQUIRED=NO (${historicalRootMigration})`);
}

function assertStageResolver() {
  assert.deepEqual(resolveFirstRevenueLoop({ plan: 'free' }), {
    stage: 'no_quote',
    mode: 'allowance',
    quoteId: null,
    invoiceId: null,
    canCreateQuote: true,
    canSendQuote: false,
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
    'invoice_created',
    'an unpaid invoice without a payment link remains in payment preparation'
  );

  assert.equal(
    resolveFirstRevenueLoop({
      plan: 'free',
      loop: { quote_id: 'quote-1', invoice_id: 'invoice-1', legacy_blocked_at: null },
      quote: { id: 'quote-1', status: 'converted' },
      invoice: { id: 'invoice-1', status: 'pending', payment_link: 'https://pay.example.com/invoice-1' },
    }).stage,
    'invoice_created',
    'a payment link is not evidence of invoice settlement'
  );

  assert.equal(
    resolveFirstRevenueLoop({
      plan: 'free',
      loop: { quote_id: 'quote-1', invoice_id: 'invoice-1', legacy_blocked_at: null },
      quote: { id: 'quote-1', status: 'converted' },
      invoice: {
        id: 'invoice-1',
        status: 'pending',
        total: 100000,
        payment_status: 'partial',
        amount_paid_cents: 40000,
      },
    }).stage,
    'first_payment_received',
    'a partially paid invoice moves to first_payment_received'
  );

  assert.equal(
    resolveFirstRevenueLoop({
      plan: 'free',
      loop: { quote_id: 'quote-1', invoice_id: 'invoice-1', legacy_blocked_at: null },
      quote: { id: 'quote-1', status: 'converted' },
      invoice: {
        id: 'invoice-1',
        status: 'pending',
        total: 100000,
        payment_status: 'paid',
        amount_paid_cents: 100000,
      },
    }).stage,
    'complete',
    'an invoice with explicit payment_status=paid completes the loop'
  );

  assert.equal(
    resolveFirstRevenueLoop({
      plan: 'free',
      loop: { quote_id: 'quote-1', invoice_id: 'invoice-1', legacy_blocked_at: null },
      quote: { id: 'quote-1', status: 'converted' },
      invoice: { id: 'invoice-1', status: 'paid', total: 100000 },
    }).stage,
    'complete',
    "legacy invoice status='paid' remains compatible"
  );

  assert.equal(
    resolveFirstRevenueLoop({
      plan: 'free',
      loop: { quote_id: null, invoice_id: null, legacy_blocked_at: '2026-07-10T00:00:00.000Z' },
    }).stage,
    'unavailable',
    'historical free users marked by cutover cannot claim a new loop'
  );

  const staleLoop = resolveFirstRevenueLoop({
    plan: 'free',
    loop: { quote_id: 'quote-1', invoice_id: null, legacy_blocked_at: null },
    quote: null,
  });
  assert.equal(staleLoop.stage, 'no_quote', 'a missing anchor quote is recoverable');
  assert.equal(staleLoop.canCreateQuote, true, 'stale loop recovery allows a fresh first quote');

  assert.equal(
    resolveFirstRevenueLoop({ plan: 'pro' }).mode,
    'plan',
    'paid plans use subscription entitlements rather than the free allowance'
  );
}

try {
  assertStageResolver();
  assertMigrationAuthority();
  console.log('FIRST_REVENUE_LOOP_CURRENT_AUTHORITY=PASS');
  console.log('NETWORK_ACCESS=NO');
  console.log('DATABASE_ACCESS=NO');
  console.log('ENV_SECRET_REQUIRED=NO');
} catch (error) {
  console.error('FIRST_REVENUE_LOOP_CURRENT_AUTHORITY=FAIL');
  console.error(error);
  process.exitCode = 1;
}
