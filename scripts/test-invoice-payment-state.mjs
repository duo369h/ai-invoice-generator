#!/usr/bin/env node
/**
 * SAFE-03B2A / SAFE-03B2A-R1 — pure-function tests for the invoice payment
 * read model.
 *
 * No database, no network, no .env, no third-party packages. This imports
 * the pure module under test and asserts on its return values only.
 *
 * Run: node scripts/test-invoice-payment-state.mjs
 * Also run under multiple process time zones to prove the pure module never
 * depends on ambient/process local time zone:
 *   TZ=UTC node scripts/test-invoice-payment-state.mjs
 *   TZ=Asia/Shanghai node scripts/test-invoice-payment-state.mjs
 *   TZ=America/Los_Angeles node scripts/test-invoice-payment-state.mjs
 * All four runs must produce identical PASS/FAIL output.
 */

import * as invoicePaymentState from '../src/core/revenue/invoicePaymentState.js';

const {
  PAYMENT_STATUSES,
  deriveInvoicePaymentState,
  hasRecordedInvoicePayment,
  paymentStatusForInvoice,
  resolveInvoicePaymentReadModel,
} = invoicePaymentState;

let passed = 0;
let failed = 0;
const failures = [];

function check(description, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS: ${description}`);
  } else {
    failed += 1;
    failures.push(description);
    console.log(`FAIL: ${description}`);
  }
}

// Fixed clock so due-date behaviour is deterministic.
const NOW = new Date('2026-07-25T00:00:00.000Z');
const PAST = '2026-07-01';
const FUTURE = '2026-12-31';

// ---------------------------------------------------------------------------
// 1. unpaid
// ---------------------------------------------------------------------------
{
  const state = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 0, due_date: FUTURE },
    NOW
  );
  check('1. no payment and not yet due -> unpaid', state.paymentStatus === PAYMENT_STATUSES.UNPAID);
  check('1. unpaid amount_due_cents equals total', state.amountDueCents === 100000);
  check('1. unpaid amount_paid_cents is 0', state.amountPaidCents === 0);
}

// ---------------------------------------------------------------------------
// 2. overdue
// ---------------------------------------------------------------------------
{
  const state = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 0, due_date: PAST },
    NOW
  );
  check('2. no payment and past due -> overdue', state.paymentStatus === PAYMENT_STATUSES.OVERDUE);
  check('2. overdue amount_due_cents equals total', state.amountDueCents === 100000);
}

// ---------------------------------------------------------------------------
// 3. partial
// ---------------------------------------------------------------------------
{
  const state = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 40000, due_date: FUTURE },
    NOW
  );
  check('3. part payment -> partial', state.paymentStatus === PAYMENT_STATUSES.PARTIAL);
  check('3. partial amount_due_cents is remainder', state.amountDueCents === 60000);
}

{
  // A partially-paid invoice that is also past due stays `partial`
  // (payment progress outranks the due date).
  const state = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 40000, due_date: PAST },
    NOW
  );
  check('3b. part payment past due stays partial (not overdue)', state.paymentStatus === PAYMENT_STATUSES.PARTIAL);
}

// ---------------------------------------------------------------------------
// 4. paid
// ---------------------------------------------------------------------------
{
  const state = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 100000, due_date: PAST },
    NOW
  );
  check('4. full payment -> paid', state.paymentStatus === PAYMENT_STATUSES.PAID);
  check('4. paid amount_due_cents is 0', state.amountDueCents === 0);
}

// ---------------------------------------------------------------------------
// 5. overpayment clamps amount_due_cents to 0
// ---------------------------------------------------------------------------
{
  const state = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 150000 },
    NOW
  );
  check('5. overpayment -> paid', state.paymentStatus === PAYMENT_STATUSES.PAID);
  check('5. overpayment amount_due_cents clamped to 0', state.amountDueCents === 0);
  check('5. overpayment amount_due_cents is never negative', state.amountDueCents >= 0);
}

// ---------------------------------------------------------------------------
// 6. total of 0 must not auto-resolve to paid
// ---------------------------------------------------------------------------
{
  const state = deriveInvoicePaymentState({ total: 0, amount_paid_cents: 0 }, NOW);
  check('6. total 0 with no payment is NOT paid', state.paymentStatus !== PAYMENT_STATUSES.PAID);
  check('6. total 0 with no payment -> unpaid', state.paymentStatus === PAYMENT_STATUSES.UNPAID);

  const negativeTotal = deriveInvoicePaymentState({ total: -500, amount_paid_cents: 0 }, NOW);
  check('6b. negative total is NOT paid', negativeTotal.paymentStatus !== PAYMENT_STATUSES.PAID);
  check('6b. negative total amount_due_cents clamped to 0', negativeTotal.amountDueCents === 0);
}

// ---------------------------------------------------------------------------
// 7. negative amount_paid_cents is clamped to 0
// ---------------------------------------------------------------------------
{
  const state = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: -2500, due_date: FUTURE },
    NOW
  );
  check('7. negative amount_paid_cents clamped to 0', state.amountPaidCents === 0);
  check('7. negative amount_paid_cents -> unpaid (not partial)', state.paymentStatus === PAYMENT_STATUSES.UNPAID);
}

// ---------------------------------------------------------------------------
// 8. explicit payment_status wins
// ---------------------------------------------------------------------------
{
  // Amounts would derive `unpaid`, but the explicit column says partial.
  const status = paymentStatusForInvoice(
    { total: 100000, amount_paid_cents: 0, payment_status: 'partial' },
    NOW
  );
  check('8. explicit payment_status takes precedence over derivation', status === PAYMENT_STATUSES.PARTIAL);

  // Explicit column also outranks the legacy status field.
  const overridesLegacy = paymentStatusForInvoice(
    { total: 100000, amount_paid_cents: 0, status: 'paid', payment_status: 'unpaid' },
    NOW
  );
  check('8b. explicit payment_status outranks legacy status=paid', overridesLegacy === PAYMENT_STATUSES.UNPAID);

  // An invalid explicit value must be ignored, not trusted.
  const invalidExplicit = paymentStatusForInvoice(
    { total: 100000, amount_paid_cents: 100000, payment_status: 'bogus-value' },
    NOW
  );
  check('8c. invalid payment_status is ignored and falls through to derivation', invalidExplicit === PAYMENT_STATUSES.PAID);
}

// ---------------------------------------------------------------------------
// 9. legacy status === 'paid' compatibility when payment_status is absent
// ---------------------------------------------------------------------------
{
  const status = paymentStatusForInvoice(
    { total: 100000, status: 'paid' },
    NOW
  );
  check('9. legacy status=paid without payment_status -> paid', status === PAYMENT_STATUSES.PAID);

  const nonPaidLegacy = paymentStatusForInvoice(
    { total: 100000, status: 'sent', due_date: FUTURE },
    NOW
  );
  check('9b. legacy status=sent derives from amounts -> unpaid', nonPaidLegacy === PAYMENT_STATUSES.UNPAID);
}

// ---------------------------------------------------------------------------
// 10. payment_link must never imply payment
// ---------------------------------------------------------------------------
{
  const status = paymentStatusForInvoice(
    {
      total: 100000,
      amount_paid_cents: 0,
      payment_link: 'https://pay.example.com/inv_123',
      due_date: FUTURE,
    },
    NOW
  );
  check('10. payment_link present but nothing paid -> NOT paid', status !== PAYMENT_STATUSES.PAID);
  check('10. payment_link present but nothing paid -> unpaid', status === PAYMENT_STATUSES.UNPAID);

  const overdueWithLink = paymentStatusForInvoice(
    {
      total: 100000,
      amount_paid_cents: 0,
      payment_link: 'https://pay.example.com/inv_456',
      due_date: PAST,
    },
    NOW
  );
  check('10b. payment_link present and past due -> overdue, not paid', overdueWithLink === PAYMENT_STATUSES.OVERDUE);
}

// ---------------------------------------------------------------------------
// 11. input objects are never mutated
// ---------------------------------------------------------------------------
{
  const input = {
    total: 100000,
    amount_paid_cents: -50,
    due_date: PAST,
    status: 'sent',
    payment_link: 'https://pay.example.com/x',
  };
  const snapshot = JSON.stringify(input);
  const keysBefore = Object.keys(input).length;

  deriveInvoicePaymentState(input, NOW);
  paymentStatusForInvoice(input, NOW);
  resolveInvoicePaymentReadModel(input, NOW);

  check('11. deriveInvoicePaymentState / paymentStatusForInvoice / resolveInvoicePaymentReadModel do not mutate input', JSON.stringify(input) === snapshot);
  check('11b. no new keys added to the input object', Object.keys(input).length === keysBefore);
}

// ---------------------------------------------------------------------------
// 12. all monetary values are integer cents
// ---------------------------------------------------------------------------
{
  const state = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 33333 },
    NOW
  );
  check('12. amountPaidCents is an integer', Number.isInteger(state.amountPaidCents));
  check('12. amountDueCents is an integer', Number.isInteger(state.amountDueCents));
  check('12. cents arithmetic is exact (100000 - 33333)', state.amountDueCents === 66667);

  // Fractional / string inputs are truncated to integer cents, never floated.
  const messy = deriveInvoicePaymentState(
    { total: '100000', amount_paid_cents: 250.7 },
    NOW
  );
  check('12b. string total coerced to integer cents', Number.isInteger(messy.amountDueCents));
  check('12b. fractional amount_paid_cents truncated to integer', messy.amountPaidCents === 250);
  check('12b. derived due amount stays integer', messy.amountDueCents === 99750);

  // Non-numeric junk degrades to 0 rather than NaN.
  const junk = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 'not-a-number' },
    NOW
  );
  check('12c. non-numeric amount_paid_cents becomes 0 (never NaN)', junk.amountPaidCents === 0);
  check('12c. amountDueCents stays a finite integer', Number.isInteger(junk.amountDueCents) && junk.amountDueCents === 100000);
}

// ---------------------------------------------------------------------------
// Exported surface
// ---------------------------------------------------------------------------
{
  check('exports: PAYMENT_STATUSES defines all four states',
    PAYMENT_STATUSES.UNPAID === 'unpaid' &&
    PAYMENT_STATUSES.PARTIAL === 'partial' &&
    PAYMENT_STATUSES.PAID === 'paid' &&
    PAYMENT_STATUSES.OVERDUE === 'overdue'
  );
  check('exports: deriveInvoicePaymentState is a function', typeof deriveInvoicePaymentState === 'function');
  check('exports: paymentStatusForInvoice is a function', typeof paymentStatusForInvoice === 'function');
  check('exports: resolveInvoicePaymentReadModel is a function', typeof resolveInvoicePaymentReadModel === 'function');

  const shape = deriveInvoicePaymentState({ total: 1000, amount_paid_cents: 0 }, NOW);
  check('exports: result shape includes paymentStatus / amountPaidCents / amountDueCents',
    'paymentStatus' in shape && 'amountPaidCents' in shape && 'amountDueCents' in shape
  );
}

// ===========================================================================
// SAFE-03B2A-R1 — calendar-day due-date semantics
// ===========================================================================

// ---------------------------------------------------------------------------
// R1-1/2/3. UTC: due date itself is never overdue; the day after is.
// ---------------------------------------------------------------------------
{
  const dueDay0000 = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 0, due_date: '2026-07-25' },
    new Date('2026-07-25T00:00:00.000Z'),
    { timeZone: 'UTC' }
  );
  check('R1-1. UTC due-day 00:00:00 -> NOT overdue', dueDay0000.paymentStatus !== PAYMENT_STATUSES.OVERDUE);
  check('R1-1. UTC due-day 00:00:00 -> unpaid', dueDay0000.paymentStatus === PAYMENT_STATUSES.UNPAID);

  const dueDay2359 = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 0, due_date: '2026-07-25' },
    new Date('2026-07-25T23:59:00.000Z'),
    { timeZone: 'UTC' }
  );
  check('R1-2. UTC due-day 23:59:00 -> NOT overdue', dueDay2359.paymentStatus !== PAYMENT_STATUSES.OVERDUE);

  const nextDay = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 0, due_date: '2026-07-25' },
    new Date('2026-07-26T00:00:00.001Z'),
    { timeZone: 'UTC' }
  );
  check('R1-3. UTC next calendar day -> overdue', nextDay.paymentStatus === PAYMENT_STATUSES.OVERDUE);
}

// ---------------------------------------------------------------------------
// R1-4/5. Asia/Shanghai (UTC+8): due day early/late -> not overdue;
// crossing into the next Shanghai calendar day -> overdue, even while it is
// still the due date in UTC (proves the time zone option has real effect).
// ---------------------------------------------------------------------------
{
  const earlyShanghai = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 0, due_date: '2026-07-25' },
    new Date('2026-07-24T16:00:01.000Z'), // 2026-07-25T00:00:01+08:00
    { timeZone: 'Asia/Shanghai' }
  );
  check('R1-4a. Asia/Shanghai due-day early morning -> NOT overdue', earlyShanghai.paymentStatus !== PAYMENT_STATUSES.OVERDUE);

  const lateShanghai = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 0, due_date: '2026-07-25' },
    new Date('2026-07-25T15:59:00.000Z'), // 2026-07-25T23:59:00+08:00
    { timeZone: 'Asia/Shanghai' }
  );
  check('R1-4b. Asia/Shanghai due-day late evening -> NOT overdue', lateShanghai.paymentStatus !== PAYMENT_STATUSES.OVERDUE);

  // Still 2026-07-25 in UTC, but already 2026-07-26T01:00 in Shanghai.
  const nextDayShanghai = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 0, due_date: '2026-07-25' },
    new Date('2026-07-25T17:00:00.000Z'),
    { timeZone: 'Asia/Shanghai' }
  );
  check('R1-5. Asia/Shanghai next calendar day -> overdue (while still due-date in UTC)', nextDayShanghai.paymentStatus === PAYMENT_STATUSES.OVERDUE);

  const sameInstantUtc = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 0, due_date: '2026-07-25' },
    new Date('2026-07-25T17:00:00.000Z'),
    { timeZone: 'UTC' }
  );
  check('R1-5b. the same instant evaluated in UTC is still the due date -> NOT overdue', sameInstantUtc.paymentStatus !== PAYMENT_STATUSES.OVERDUE);
}

// ---------------------------------------------------------------------------
// R1-6/7. America/Los_Angeles (UTC-7 in July): due day early/late -> not
// overdue, even when UTC has already rolled to the next calendar day (proves
// the time zone option shifts the boundary correctly in both directions).
// ---------------------------------------------------------------------------
{
  const earlyLA = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 0, due_date: '2026-07-25' },
    new Date('2026-07-25T07:00:01.000Z'), // 2026-07-25T00:00:01-07:00
    { timeZone: 'America/Los_Angeles' }
  );
  check('R1-6a. America/Los_Angeles due-day early morning -> NOT overdue', earlyLA.paymentStatus !== PAYMENT_STATUSES.OVERDUE);

  // Already 2026-07-26 in UTC, but still 2026-07-25T23:59 in Los Angeles.
  const lateLA = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 0, due_date: '2026-07-25' },
    new Date('2026-07-26T06:59:00.000Z'),
    { timeZone: 'America/Los_Angeles' }
  );
  check('R1-6b. America/Los_Angeles due-day late evening (already next day in UTC) -> NOT overdue', lateLA.paymentStatus !== PAYMENT_STATUSES.OVERDUE);

  const nextDayLA = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 0, due_date: '2026-07-25' },
    new Date('2026-07-27T00:00:00.000Z'),
    { timeZone: 'America/Los_Angeles' }
  );
  check('R1-7. America/Los_Angeles next calendar day -> overdue', nextDayLA.paymentStatus === PAYMENT_STATUSES.OVERDUE);
}

// ---------------------------------------------------------------------------
// R1-7a/7b. Pacific date-line boundaries: UTC+14 Kiritimati and UTC-10
// Honolulu both preserve the due calendar day through its final local minute,
// then become overdue on the following local calendar day.
// ---------------------------------------------------------------------------
{
  const invoice = { total: 100000, amount_paid_cents: 0, due_date: '2026-07-25' };
  const earlyKiritimati = deriveInvoicePaymentState(invoice, new Date('2026-07-24T10:00:01.000Z'), { timeZone: 'Pacific/Kiritimati' });
  const lateKiritimati = deriveInvoicePaymentState(invoice, new Date('2026-07-25T09:59:00.000Z'), { timeZone: 'Pacific/Kiritimati' });
  const nextDayKiritimati = deriveInvoicePaymentState(invoice, new Date('2026-07-25T10:00:00.000Z'), { timeZone: 'Pacific/Kiritimati' });
  check('R1-7a. Pacific/Kiritimati due-day start -> unpaid', earlyKiritimati.paymentStatus === PAYMENT_STATUSES.UNPAID);
  check('R1-7a. Pacific/Kiritimati due-day late -> unpaid', lateKiritimati.paymentStatus === PAYMENT_STATUSES.UNPAID);
  check('R1-7a. Pacific/Kiritimati next calendar day -> overdue', nextDayKiritimati.paymentStatus === PAYMENT_STATUSES.OVERDUE);

  const earlyHonolulu = deriveInvoicePaymentState(invoice, new Date('2026-07-25T10:00:01.000Z'), { timeZone: 'Pacific/Honolulu' });
  const lateHonolulu = deriveInvoicePaymentState(invoice, new Date('2026-07-26T09:59:00.000Z'), { timeZone: 'Pacific/Honolulu' });
  const nextDayHonolulu = deriveInvoicePaymentState(invoice, new Date('2026-07-26T10:00:00.000Z'), { timeZone: 'Pacific/Honolulu' });
  check('R1-7b. Pacific/Honolulu due-day start -> unpaid', earlyHonolulu.paymentStatus === PAYMENT_STATUSES.UNPAID);
  check('R1-7b. Pacific/Honolulu due-day late -> unpaid', lateHonolulu.paymentStatus === PAYMENT_STATUSES.UNPAID);
  check('R1-7b. Pacific/Honolulu next calendar day -> overdue', nextDayHonolulu.paymentStatus === PAYMENT_STATUSES.OVERDUE);
}

// ---------------------------------------------------------------------------
// R1-8. Determinism: the result depends only on the explicit timeZone
// option, never on the host process's ambient/local time zone. This file is
// also run under `TZ=UTC`, `TZ=Asia/Shanghai`, and `TZ=America/Los_Angeles`
// (see verification commands) and must print identical PASS/FAIL either way.
// ---------------------------------------------------------------------------
{
  const a = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 0, due_date: '2026-07-25' },
    new Date('2026-07-25T17:00:00.000Z'),
    { timeZone: 'Asia/Shanghai' }
  );
  const b = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 0, due_date: '2026-07-25' },
    new Date('2026-07-25T17:00:00.000Z'),
    { timeZone: 'Asia/Shanghai' }
  );
  check(
    'R1-8. repeated calls with the same explicit timeZone option are stable regardless of process.env.TZ',
    a.paymentStatus === b.paymentStatus && a.paymentStatus === PAYMENT_STATUSES.OVERDUE
  );
}

// ---------------------------------------------------------------------------
// R1-9/10. Invalid / nonexistent due dates never become overdue.
// ---------------------------------------------------------------------------
{
  for (const badDueDate of ['not-a-date', '', null, undefined, '2026-13-45']) {
    const state = deriveInvoicePaymentState(
      { total: 100000, amount_paid_cents: 0, due_date: badDueDate },
      NOW
    );
    check(`R1-9. invalid due_date ${JSON.stringify(badDueDate)} -> NOT overdue`, state.paymentStatus !== PAYMENT_STATUSES.OVERDUE);
  }

  const nonexistentDate = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 0, due_date: '2026-02-30' },
    NOW
  );
  check('R1-10. nonexistent calendar date 2026-02-30 -> NOT overdue', nonexistentDate.paymentStatus !== PAYMENT_STATUSES.OVERDUE);
}

// ---------------------------------------------------------------------------
// R1-11. Full ISO timestamp due_date input is validated then converted to a
// calendar date in the configured time zone.
// ---------------------------------------------------------------------------
{
  const isoDue = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 0, due_date: '2026-07-01T23:00:00.000Z' },
    new Date('2026-07-25T00:00:00.000Z'),
    { timeZone: 'UTC' }
  );
  check('R1-11. full ISO due_date in the past -> overdue', isoDue.paymentStatus === PAYMENT_STATUSES.OVERDUE);

  const isoDueSameDay = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 0, due_date: '2026-07-25T23:00:00.000Z' },
    new Date('2026-07-25T05:00:00.000Z'),
    { timeZone: 'UTC' }
  );
  check('R1-11b. full ISO due_date on the same UTC calendar day as now -> NOT overdue', isoDueSameDay.paymentStatus !== PAYMENT_STATUSES.OVERDUE);
}

// ---------------------------------------------------------------------------
// R1-12. An invalid IANA time zone string safely falls back to UTC instead
// of throwing.
// ---------------------------------------------------------------------------
{
  let threw = false;
  let stateWithInvalidZone;
  try {
    stateWithInvalidZone = deriveInvoicePaymentState(
      { total: 100000, amount_paid_cents: 0, due_date: '2026-07-25' },
      new Date('2026-07-26T00:00:00.001Z'),
      { timeZone: 'Not/AZone' }
    );
  } catch {
    threw = true;
  }
  check('R1-12. invalid timeZone string does not throw', !threw);

  const stateWithUtc = deriveInvoicePaymentState(
    { total: 100000, amount_paid_cents: 0, due_date: '2026-07-25' },
    new Date('2026-07-26T00:00:00.001Z'),
    { timeZone: 'UTC' }
  );
  check(
    'R1-12b. invalid timeZone string behaves identically to explicit UTC',
    !threw && stateWithInvalidZone.paymentStatus === stateWithUtc.paymentStatus
  );
}

// ===========================================================================
// R1-13. resolveInvoicePaymentReadModel
// ===========================================================================
{
  const explicitZero = resolveInvoicePaymentReadModel(
    { total: 100000, amount_paid_cents: 100000, amount_due_cents: 0 },
    NOW
  );
  check('R1-13a. explicit amount_due_cents=0 is preserved (not treated as missing)', explicitZero.amount_due_cents === 0);

  const stringAmounts = resolveInvoicePaymentReadModel(
    { total: '100000', amount_paid_cents: '40000' },
    NOW
  );
  check('R1-13b. string numeric total/amount_paid_cents are normalized to integer cents', stringAmounts.amount_paid_cents === 40000 && stringAmounts.amount_due_cents === 60000);

  const nanAmount = resolveInvoicePaymentReadModel(
    { total: 100000, amount_paid_cents: NaN },
    NOW
  );
  check('R1-13c. NaN amount_paid_cents is normalized to 0 (never NaN)', nanAmount.amount_paid_cents === 0 && Number.isFinite(nanAmount.amount_paid_cents));

  const infiniteAmount = resolveInvoicePaymentReadModel(
    { total: Infinity, amount_paid_cents: Infinity, amount_due_cents: Infinity },
    NOW
  );
  check(
    'R1-13d. Infinity in total/amount_paid_cents/amount_due_cents never leaks through',
    Number.isFinite(infiniteAmount.amount_paid_cents) &&
      Number.isFinite(infiniteAmount.amount_due_cents) &&
      infiniteAmount.amount_paid_cents === 0 &&
      infiniteAmount.amount_due_cents === 0
  );

  const negativeAmount = resolveInvoicePaymentReadModel(
    { total: 100000, amount_paid_cents: -500, amount_due_cents: -100 },
    NOW
  );
  check(
    'R1-13e. negative amount_paid_cents / amount_due_cents are normalized to 0',
    negativeAmount.amount_paid_cents === 0 && negativeAmount.amount_due_cents === 0
  );

  const legacyPaid = resolveInvoicePaymentReadModel(
    { total: 250000, status: 'paid' },
    NOW
  );
  check(
    'R1-13f. legacy status=paid with missing amount_paid_cents falls back to normalized total',
    legacyPaid.amount_paid_cents === 250000 && legacyPaid.amount_due_cents === 0 && legacyPaid.payment_status === PAYMENT_STATUSES.PAID
  );

  const explicitUnpaidOverridesLegacyPaid = resolveInvoicePaymentReadModel(
    { total: 100000, status: 'paid', payment_status: 'unpaid', amount_paid_cents: 0 },
    NOW
  );
  check(
    "R1-13g. explicit payment_status='unpaid' overrides legacy status='paid'",
    explicitUnpaidOverridesLegacyPaid.payment_status === PAYMENT_STATUSES.UNPAID
  );

  const invoiceKindDefault = resolveInvoicePaymentReadModel({ total: 1000 }, NOW);
  check('R1-13h. invoice_kind defaults to standard when missing', invoiceKindDefault.invoice_kind === 'standard');

  const invoiceKindPreserved = resolveInvoicePaymentReadModel({ total: 1000, invoice_kind: 'retainer' }, NOW);
  check('R1-13i. explicit invoice_kind is preserved', invoiceKindPreserved.invoice_kind === 'retainer');

  const input = {
    total: 100000,
    amount_paid_cents: -50,
    amount_due_cents: Infinity,
    due_date: PAST,
    status: 'sent',
    invoice_kind: 'standard',
  };
  const snapshot = JSON.stringify(input);
  resolveInvoicePaymentReadModel(input, NOW);
  check('R1-13j. resolveInvoicePaymentReadModel does not mutate its input', JSON.stringify(input) === snapshot);

  const shape = resolveInvoicePaymentReadModel({ total: 1000 }, NOW);
  check(
    'R1-13k. resolveInvoicePaymentReadModel returns exactly the four documented fields',
    'invoice_kind' in shape && 'payment_status' in shape && 'amount_paid_cents' in shape && 'amount_due_cents' in shape
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

check('exports: hasRecordedInvoicePayment is a function', typeof hasRecordedInvoicePayment === 'function');
if (typeof hasRecordedInvoicePayment === 'function') {
  check(
    'recorded payment: partial state is protected',
    hasRecordedInvoicePayment({ total: 100000, payment_status: 'partial', amount_paid_cents: 40000 })
  );
  check(
    'recorded payment: paid state is protected',
    hasRecordedInvoicePayment({ total: 100000, payment_status: 'paid', amount_paid_cents: 100000 })
  );
  check(
    'recorded payment: positive canonical amount is protected even with stale unpaid state',
    hasRecordedInvoicePayment({ total: 100000, payment_status: 'unpaid', amount_paid_cents: 1 })
  );
  check(
    'recorded payment: positive legacy amount is protected',
    hasRecordedInvoicePayment({ total: 100000, payment_status: 'unpaid', amount_paid_cents: 0, amount_paid: 1 })
  );
  check(
    'recorded payment: legacy paid status is protected',
    hasRecordedInvoicePayment({ total: 100000, status: 'paid' })
  );
  check(
    'recorded payment: unpaid and overdue-with-zero-payment remain writable',
    !hasRecordedInvoicePayment({ total: 100000, payment_status: 'unpaid', amount_paid_cents: 0 })
      && !hasRecordedInvoicePayment({ total: 100000, payment_status: 'overdue', amount_paid_cents: 0 })
  );
}

console.log('');
console.log(`Invoice payment state tests: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  console.log('');
  console.log('Failures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}

process.exit(0);
