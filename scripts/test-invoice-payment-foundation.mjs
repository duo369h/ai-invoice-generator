import assert from "node:assert/strict";
import {
  deriveInvoicePaymentState,
  paymentStatusForInvoice,
  resolveInvoicePaymentReadModel,
} from "../src/core/revenue/invoicePaymentState.js";
import {
  isFirstRevenueTrackedResource,
  resolveFirstRevenueLoop,
} from "../src/core/revenue/firstRevenueLoop.js";

const beforeDueDate = new Date("2026-07-10T00:00:00.000Z");

// 1. Unpaid before due date
const unpaidState = deriveInvoicePaymentState(
  { total: 10000, amount_paid_cents: 0, due_date: "2026-07-20" },
  beforeDueDate
);
assert.equal(unpaidState.paymentStatus, "unpaid", "an invoice without payments is unpaid before its due date");
assert.equal(unpaidState.amountPaidCents, 0);
assert.equal(unpaidState.amountDueCents, 10000);

// 2. Partial payment
const partialState = deriveInvoicePaymentState(
  { total: 10000, amount_paid_cents: 3500, due_date: "2026-07-01" },
  beforeDueDate
);
assert.equal(partialState.paymentStatus, "partial", "a settled deposit is partial even when remaining balance is overdue");
assert.equal(partialState.amountPaidCents, 3500);
assert.equal(partialState.amountDueCents, 6500);

// 3. Paid at or above total
const paidState = deriveInvoicePaymentState(
  { total: 10000, amount_paid_cents: 10000, due_date: "2026-07-01" },
  beforeDueDate
);
assert.equal(paidState.paymentStatus, "paid", "payment at or above the invoice total is paid");
assert.equal(paidState.amountPaidCents, 10000);
assert.equal(paidState.amountDueCents, 0);

// 4. Overdue
const overdueState = deriveInvoicePaymentState(
  { total: 10000, amount_paid_cents: 0, due_date: "2026-07-01" },
  beforeDueDate
);
assert.equal(overdueState.paymentStatus, "overdue", "an unpaid past-due invoice is overdue");
assert.equal(overdueState.amountPaidCents, 0);
assert.equal(overdueState.amountDueCents, 10000);

// First revenue loop payment checks
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
