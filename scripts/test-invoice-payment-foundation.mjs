import assert from "node:assert/strict";
import {
  deriveInvoicePaymentState,
} from "../src/core/revenue/invoicePaymentState.js";
import {
  isFirstRevenueTrackedResource,
  resolveFirstRevenueLoop,
} from "../src/core/revenue/firstRevenueLoop.js";

const beforeDueDate = new Date("2026-07-10T00:00:00.000Z");

assert.deepEqual(
  deriveInvoicePaymentState({ totalCents: 10000, amountPaidCents: 0, dueDate: "2026-07-20", now: beforeDueDate }),
  { amount_paid_cents: 0, amount_due_cents: 10000, payment_status: "unpaid" },
  "an invoice without payments is unpaid before its due date"
);

assert.deepEqual(
  deriveInvoicePaymentState({ totalCents: 10000, amountPaidCents: 3500, dueDate: "2026-07-01", now: beforeDueDate }),
  { amount_paid_cents: 3500, amount_due_cents: 6500, payment_status: "partial" },
  "a settled deposit is partial even when the remaining balance is overdue"
);

assert.deepEqual(
  deriveInvoicePaymentState({ totalCents: 10000, amountPaidCents: 10000, dueDate: "2026-07-01", now: beforeDueDate }),
  { amount_paid_cents: 10000, amount_due_cents: 0, payment_status: "paid" },
  "payment at or above the invoice total is paid"
);

assert.deepEqual(
  deriveInvoicePaymentState({ totalCents: 10000, amountPaidCents: 0, dueDate: "2026-07-01", now: beforeDueDate }),
  { amount_paid_cents: 0, amount_due_cents: 10000, payment_status: "overdue" },
  "an unpaid past-due invoice is overdue"
);

const loop = { quote_id: "quote-1", invoice_id: "invoice-1", legacy_blocked_at: null };
const quote = { id: "quote-1", status: "approved" };

assert.equal(
  resolveFirstRevenueLoop({
    plan: "free",
    loop,
    quote,
    invoice: { id: "invoice-1", payment_link: "https://paypal.me/example", payment_status: "unpaid" },
  }).stage,
  "invoice_created",
  "a payment link alone cannot complete the first revenue loop"
);

assert.equal(
  resolveFirstRevenueLoop({
    plan: "free",
    loop,
    quote,
    invoice: { id: "invoice-1", payment_link: "", payment_status: "paid" },
  }).stage,
  "complete",
  "a successful payment completes the first revenue loop"
);

assert.equal(
  isFirstRevenueTrackedResource({ loop, quote, resourceType: "invoice", resourceId: "invoice-1" }),
  true,
  "the linked first-revenue invoice is recognized as a tracked first revenue loop resource"
);

assert.equal(
  isFirstRevenueTrackedResource({ loop, quote, resourceType: "invoice", resourceId: "invoice-other" }),
  false,
  "an unrelated invoice is not recognized as tracked"
);

console.log("Invoice payment foundation contracts passed.");
