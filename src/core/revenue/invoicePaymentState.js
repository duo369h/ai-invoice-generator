/**
 * SAFE-03B2A / SAFE-03B2A-R1 — Invoice payment read model (pure functions).
 *
 * This module is deliberately side-effect free: it does not access the
 * database, the network, the filesystem, or environment variables. It only
 * interprets invoice rows that already exist in production.
 *
 * All monetary values are integer cents. No floating-point money arithmetic
 * is performed anywhere in this module.
 *
 * Due-date handling is calendar-day based, not timestamp based. A `due_date`
 * of `'2026-07-25'` means the calendar day 2026-07-25 — it is never decoded
 * as a UTC midnight instant. An invoice only becomes `overdue` once "today"
 * (evaluated in the configured IANA time zone, default UTC) is a later
 * calendar day than the due date. The due date itself is never overdue.
 */

export const PAYMENT_STATUSES = Object.freeze({
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
});

const VALID_PAYMENT_STATUSES = Object.freeze([
  PAYMENT_STATUSES.UNPAID,
  PAYMENT_STATUSES.PARTIAL,
  PAYMENT_STATUSES.PAID,
  PAYMENT_STATUSES.OVERDUE,
]);

const DEFAULT_TIME_ZONE = 'UTC';
const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Coerces a value to a non-negative integer number of cents.
 * Invalid / missing / non-finite values become 0. Negative values are
 * clamped to 0.
 */
function toNonNegativeCents(value) {
  if (value === null || value === undefined) return 0;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  const asInt = Math.trunc(numeric);
  return asInt < 0 ? 0 : asInt;
}

/**
 * Coerces a value to an integer number of cents, allowing negatives through
 * (used for `total`, which is validated separately by the caller).
 * Invalid / missing / non-finite values become 0.
 */
function toIntegerCents(value) {
  if (value === null || value === undefined) return 0;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.trunc(numeric);
}

/**
 * Returns `timeZone` if it is a valid IANA time zone identifier that
 * `Intl.DateTimeFormat` accepts; otherwise falls back to UTC. Never throws.
 */
function safeTimeZone(timeZone) {
  const candidate = typeof timeZone === 'string' && timeZone.trim() ? timeZone.trim() : DEFAULT_TIME_ZONE;
  try {
    // eslint-disable-next-line no-new
    new Intl.DateTimeFormat('en-CA', { timeZone: candidate });
    return candidate;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

/**
 * Returns true when (year, month[1-12], day) form a real calendar date,
 * including leap-year awareness. Never depends on the process's local time
 * zone (uses Date.UTC only as an arithmetic helper).
 */
function isValidCalendarDateParts(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
}

/**
 * Formats `date` (a JS Date / valid timestamp) as a `YYYY-MM-DD` calendar
 * date evaluated in `timeZone`. Does not depend on the process's local time
 * zone — the zone is always passed explicitly to Intl.
 */
function formatCalendarDate(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const map = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  return `${map.year}-${map.month}-${map.day}`;
}

/**
 * Resolves `dueDate` to a `YYYY-MM-DD` calendar date, or `null` when the
 * input is missing / invalid.
 *
 *  - An exact `YYYY-MM-DD` string is the calendar date itself; it is never
 *    reinterpreted as a UTC midnight timestamp, so the result does not
 *    depend on `timeZone` at all.
 *  - Any other input (full ISO timestamp, Date instance, epoch number, ...)
 *    is validated as a real instant first, then converted to the calendar
 *    date it falls on in `timeZone`.
 */
function dueDateToCalendarDate(dueDate, timeZone) {
  if (dueDate === null || dueDate === undefined || dueDate === '') return null;

  if (typeof dueDate === 'string') {
    const match = DATE_ONLY_RE.exec(dueDate.trim());
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      if (!isValidCalendarDateParts(year, month, day)) return null;
      return dueDate.trim();
    }
  }

  const parsed = dueDate instanceof Date ? dueDate : new Date(dueDate);
  const ms = parsed.getTime();
  if (!Number.isFinite(ms)) return null;
  return formatCalendarDate(parsed, timeZone);
}

/**
 * Returns true only when the due date's calendar day is strictly before
 * today's calendar day (both evaluated in `timeZone`). The due date itself
 * is never overdue. Invalid / missing due dates are never overdue.
 */
function isPastDue(dueDate, now, timeZone) {
  const dueCalendarDate = dueDateToCalendarDate(dueDate, timeZone);
  if (dueCalendarDate === null) return false;
  const todayCalendarDate = formatCalendarDate(now, timeZone);
  return dueCalendarDate < todayCalendarDate;
}

/**
 * Returns true when `value` is one of the four supported payment statuses.
 */
export function isValidPaymentStatus(value) {
  return typeof value === 'string' && VALID_PAYMENT_STATUSES.includes(value);
}

/**
 * Derives payment state purely from amounts and the due date.
 *
 * Rules:
 *  - amount_paid_cents below 0 is treated as 0.
 *  - amount_due_cents is never below 0.
 *  - total > 0 and paid >= total                        -> paid
 *  - 0 < paid < total                                    -> partial
 *  - paid === 0 and due date's calendar day has passed   -> overdue
 *  - otherwise                                           -> unpaid
 *
 * A non-positive total never yields `paid` on the strength of
 * `paid >= total` alone.
 *
 * `options.timeZone` is an optional IANA time zone used to evaluate the due
 * date (default `'UTC'`). An invalid time zone string safely falls back to
 * UTC rather than throwing. The result never depends on the process's local
 * time zone.
 *
 * The input object is never mutated.
 */
export function deriveInvoicePaymentState(invoice = {}, now = new Date(), options = {}) {
  const timeZone = safeTimeZone(options?.timeZone);

  const totalCents = toIntegerCents(invoice.total);
  const amountPaidCents = toNonNegativeCents(invoice.amount_paid_cents);

  const explicitDue = invoice.amount_due_cents;
  const amountDueCents =
    explicitDue === null || explicitDue === undefined
      ? Math.max(totalCents - amountPaidCents, 0)
      : Math.max(toIntegerCents(explicitDue), 0);

  let paymentStatus;
  if (totalCents > 0 && amountPaidCents >= totalCents) {
    paymentStatus = PAYMENT_STATUSES.PAID;
  } else if (amountPaidCents > 0 && amountPaidCents < totalCents) {
    paymentStatus = PAYMENT_STATUSES.PARTIAL;
  } else if (amountPaidCents === 0 && isPastDue(invoice.due_date, now, timeZone)) {
    paymentStatus = PAYMENT_STATUSES.OVERDUE;
  } else {
    paymentStatus = PAYMENT_STATUSES.UNPAID;
  }

  return {
    paymentStatus,
    amountPaidCents,
    amountDueCents,
  };
}

/**
 * Resolves the authoritative payment status for an invoice row.
 *
 * Precedence:
 *  1. A valid explicit `invoice.payment_status` is trusted as-is.
 *  2. Legacy compatibility: `invoice.status === 'paid'` maps to `paid`.
 *  3. Otherwise the state is derived from amounts / due date.
 *
 * The presence of `payment_link` is never treated as evidence of payment.
 *
 * The input object is never mutated. `now` and `options` are optional; when
 * omitted this behaves exactly as before (current time, UTC due-date
 * evaluation).
 */
export function paymentStatusForInvoice(invoice = {}, now = new Date(), options = {}) {
  if (isValidPaymentStatus(invoice.payment_status)) {
    return invoice.payment_status;
  }

  if (invoice.status === 'paid') {
    return PAYMENT_STATUSES.PAID;
  }

  return deriveInvoicePaymentState(invoice, now, options).paymentStatus;
}

/**
 * Resolves the full payment read model for an invoice row as plain
 * snake_case fields, ready to be merged into an API response.
 *
 * Returns:
 *   {
 *     invoice_kind,
 *     payment_status,
 *     amount_paid_cents,
 *     amount_due_cents,
 *   }
 *
 * Rules:
 *  1. invoice_kind defaults to 'standard' when missing.
 *  2. `total` is only used to compute payment amounts; it is normalized to
 *     a finite, non-negative integer number of cents for that purpose.
 *  3. An explicit amount_paid_cents is normalized to a finite, non-negative
 *     integer; NaN / Infinity / non-numeric / negative values safely become
 *     0 (never leak through).
 *  4. When amount_paid_cents is missing: legacy `status === 'paid'` rows
 *     fall back to the normalized total; otherwise 0.
 *  5. An explicit amount_due_cents is normalized the same way as #3; a
 *     legitimate explicit 0 is preserved (nullish-checked, not truthy).
 *  6. When amount_due_cents is missing: max(total - amount_paid_cents, 0).
 *  7. payment_status is resolved via paymentStatusForInvoice (so explicit
 *     payment_status continues to take precedence over derivation).
 *  8. The input object is never mutated.
 *  9. No database, network, filesystem, or environment access.
 *
 * This is the single place amount normalization happens; callers that map
 * a database invoice row into an API response should use this function's
 * output directly rather than re-implementing cents normalization.
 */
export function resolveInvoicePaymentReadModel(invoice = {}, now = new Date(), options = {}) {
  const totalCents = toIntegerCents(invoice.total);

  const rawAmountPaid = invoice.amount_paid_cents;
  const amountPaidCents =
    rawAmountPaid === null || rawAmountPaid === undefined
      ? (invoice.status === 'paid' ? Math.max(totalCents, 0) : 0)
      : toNonNegativeCents(rawAmountPaid);

  const rawAmountDue = invoice.amount_due_cents;
  const amountDueCents =
    rawAmountDue === null || rawAmountDue === undefined
      ? Math.max(totalCents - amountPaidCents, 0)
      : toNonNegativeCents(rawAmountDue);

  const paymentStatus = paymentStatusForInvoice(
    { ...invoice, amount_paid_cents: amountPaidCents },
    now,
    options
  );

  return {
    invoice_kind: invoice.invoice_kind ?? 'standard',
    payment_status: paymentStatus,
    amount_paid_cents: amountPaidCents,
    amount_due_cents: amountDueCents,
  };
}

/**
 * Returns true when an invoice carries evidence that a payment has already
 * been recorded. This is the write-safety counterpart to the canonical read
 * model and deliberately reuses its normalization and precedence rules.
 *
 * `amount_paid` is accepted only as a legacy compatibility signal. The
 * canonical schema and route query use `amount_paid_cents`.
 */
export function hasRecordedInvoicePayment(invoice = {}) {
  const readModel = resolveInvoicePaymentReadModel(invoice);
  const legacyAmountPaid = toNonNegativeCents(invoice.amount_paid);

  return legacyAmountPaid > 0
    || readModel.amount_paid_cents > 0
    || readModel.payment_status === PAYMENT_STATUSES.PARTIAL
    || readModel.payment_status === PAYMENT_STATUSES.PAID;
}
