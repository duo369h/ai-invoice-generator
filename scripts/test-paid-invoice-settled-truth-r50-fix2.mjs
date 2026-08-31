import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { hasRecordedInvoicePayment } from '../src/core/revenue/invoicePaymentState.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dashboard = await readFile(resolve(root, 'src/components/dashboard/Dashboard.js'), 'utf8');

function matchingBrace(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = openIndex; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '\'' || character === '"' || character === '`') {
      quote = character;
      continue;
    }
    if (character === '{') depth += 1;
    if (character === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error('Unbalanced Dashboard function body');
}

function extractFunctionSource(marker, openMarker = '{') {
  const start = dashboard.indexOf(marker);
  assert.notEqual(start, -1, `Dashboard marker not found: ${marker}`);
  const arrow = dashboard.indexOf('=>', start);
  const open = dashboard.indexOf(openMarker, arrow === -1 ? start : arrow);
  assert.notEqual(open, -1, `Dashboard body not found: ${marker}`);
  return dashboard.slice(start, matchingBrace(dashboard, open) + 1);
}

function extractStatementSource(marker) {
  const start = dashboard.indexOf(marker);
  assert.notEqual(start, -1, `Dashboard marker not found: ${marker}`);
  const end = dashboard.indexOf(';', start);
  assert.notEqual(end, -1, `Dashboard statement end not found: ${marker}`);
  return dashboard.slice(start, end + 1);
}

const openDocumentSource = extractFunctionSource('const openDocument =');
const selectedSettledSource = extractStatementSource('const isSelectedInvoiceSettled =');
const invoiceEditorStart = dashboard.indexOf('{/* Invoice Create / Edit View */}');
const invoiceEditorEnd = dashboard.indexOf('{/* PDF render target (hidden preview for html2pdf screenshot) */}', invoiceEditorStart);
assert.notEqual(invoiceEditorStart, -1, 'Invoice editor marker exists');
assert.notEqual(invoiceEditorEnd, -1, 'Invoice editor end marker exists');
const invoiceEditorSource = dashboard.slice(invoiceEditorStart, invoiceEditorEnd);

assert.equal(
  hasRecordedInvoicePayment({ total: 10000, payment_status: 'paid', amount_paid_cents: 10000 }),
  true,
  'authoritative payment helper identifies fully paid invoices as settled',
);
assert.equal(
  hasRecordedInvoicePayment({ total: 10000, payment_status: 'partial', amount_paid_cents: 2500 }),
  true,
  'partial invoices follow the current server write authority and remain protected',
);
assert.equal(
  hasRecordedInvoicePayment({ total: 10000, payment_status: 'unpaid', amount_paid_cents: 0 }),
  false,
  'unpaid invoices remain mutable under the current server write authority',
);
assert.match(dashboard, /hasRecordedInvoicePayment/, 'Dashboard uses the canonical settled-payment helper');
assert.match(selectedSettledSource, /hasRecordedInvoicePayment/, 'selected Invoice mode uses the canonical settled predicate');

function createOpenDocumentHarness() {
  const factory = new Function('hasRecordedInvoicePayment', `
    let activeTab = 'overview';
    let invoiceView = 'list';
    let invId = '';
    let invClientId = null;
    let invNumber = '';
    let invClientName = '';
    let invClientEmail = '';
    let invClientAddress = '';
    let invItems = [];
    let invTaxRate = 0;
    let invDiscountRate = 0;
    let invCurrency = 'USD';
    let invNotes = '';
    let invDate = '';
    let invDueDate = '';
    let invPaymentTerms = 'Net 30';
    let invPaymentLink = '';
    let invQuoteId = null;
    let invBillingType = 'standard';
    let invStatus = 'pending';
    let invoiceFlowStage = 'create';
    let invoiceFlowLocked = false;
    let showPaymentWaitingBanner = false;
    const invoices = [
      { id: 'invoice-paid', invoice_number: 'INV-PAID', client_name: 'Paid Client', client_email: 'paid@example.com', client_address: 'Paid address', items: [{ description: 'Paid item', quantity: 1, unit_price: 10000 }], currency: 'USD', notes: 'Paid notes', invoice_date: '2026-08-01', due_date: '2026-08-31', payment_terms: 'Net 30', status: 'sent', payment_status: 'paid', amount_paid_cents: 10000, amount_due_cents: 0 },
      { id: 'invoice-unpaid', invoice_number: 'INV-UNPAID', client_name: 'Unpaid Client', client_email: 'unpaid@example.com', client_address: 'Unpaid address', items: [{ description: 'Unpaid item', quantity: 1, unit_price: 20000 }], currency: 'EUR', notes: 'Unpaid notes', invoice_date: '2026-08-02', due_date: '2026-09-01', payment_terms: 'Net 15', status: 'pending', payment_status: 'unpaid', amount_paid_cents: 0, amount_due_cents: 20000 },
      { id: 'invoice-partial', invoice_number: 'INV-PARTIAL', client_name: 'Partial Client', items: [{ description: 'Partial item', quantity: 1, unit_price: 30000 }], currency: 'GBP', notes: 'Partial notes', invoice_date: '2026-08-03', due_date: '2026-09-02', payment_terms: 'Net 30', status: 'sent', payment_status: 'partial', amount_paid_cents: 10000, amount_due_cents: 20000 },
    ];
    const set = (setter) => (value) => { setter(value); };
    const setInvId = (value) => { invId = value; };
    const setInvClientId = (value) => { invClientId = value; };
    const setInvNumber = (value) => { invNumber = value; };
    const setInvClientName = (value) => { invClientName = value; };
    const setInvClientEmail = (value) => { invClientEmail = value; };
    const setInvClientAddress = (value) => { invClientAddress = value; };
    const setInvItems = (value) => { invItems = value; };
    const setInvTaxRate = (value) => { invTaxRate = value; };
    const setInvDiscountRate = (value) => { invDiscountRate = value; };
    const setInvCurrency = (value) => { invCurrency = value; };
    const setInvNotes = (value) => { invNotes = value; };
    const setInvDate = (value) => { invDate = value; };
    const setInvDueDate = (value) => { invDueDate = value; };
    const setInvPaymentTerms = (value) => { invPaymentTerms = value; };
    const setInvPaymentLink = (value) => { invPaymentLink = value; };
    const setInvQuoteId = (value) => { invQuoteId = value; };
    const setInvBillingType = (value) => { invBillingType = value; };
    const setInvStatus = (value) => { invStatus = value; };
    const setInvoiceFlowStage = (value) => { invoiceFlowStage = value; };
    const setInvoiceFlowLocked = (value) => { invoiceFlowLocked = value; };
    const setShowPaymentWaitingBanner = (value) => { showPaymentWaitingBanner = value; };
    const setInvoiceView = (value) => { invoiceView = value; };
    const getSelectedInvoice = () => invId ? invoices.find((invoice) => invoice?.id === invId) : null;
    const handleDashboardTabChange = (value) => { activeTab = value; };
    const deserializeInvoiceNotes = (notes) => ({ notes: typeof notes === 'string' ? notes : notes?.notes || '', billing_type: typeof notes === 'object' && notes?.billing_type ? notes.billing_type : 'standard' });
    ${openDocumentSource}
    const selectedSettled = new Function('invId', 'invoices', 'hasRecordedInvoicePayment', 'const getSelectedInvoice = () => invId ? invoices.find((invoice) => invoice?.id === invId) : null; return ' + ${JSON.stringify(selectedSettledSource.replace(/^const isSelectedInvoiceSettled = /, '').replace(/;$/, ''))});
    return {
      openDocument,
      selectedSettled,
      get: () => ({ invId, invNumber, invClientName, invItems, invCurrency, invNotes, invDate, invDueDate, invPaymentTerms, invStatus, invPaymentLink, invQuoteId, invBillingType, invoiceView, invoiceFlowStage, invoiceFlowLocked, showPaymentWaitingBanner, activeTab }),
    };
  `);
  return factory(hasRecordedInvoicePayment);
}

const harness = createOpenDocumentHarness();
for (const [id, settled] of [['invoice-paid', true], ['invoice-unpaid', false], ['invoice-paid', true], ['invoice-partial', true], ['invoice-paid', true]]) {
  assert.equal(harness.openDocument({ documentType: 'invoice', id }), true, `${id} opens through shared exact-open`);
  assert.equal(harness.get().invId, id, `${id} keeps canonical Invoice.id`);
  assert.equal(harness.selectedSettled(harness.get().invId, [
    { id: 'invoice-paid', payment_status: 'paid', amount_paid_cents: 10000, total: 10000 },
    { id: 'invoice-unpaid', payment_status: 'unpaid', amount_paid_cents: 0, total: 20000 },
    { id: 'invoice-partial', payment_status: 'partial', amount_paid_cents: 10000, total: 30000 },
  ], hasRecordedInvoicePayment), settled, `${id} settles the expected editor mode without state leakage`);
}

assert.match(invoiceEditorSource, /View Invoice \$\{invNumber\}/, 'settled Invoice uses a view framing instead of Edit Document');
assert.match(invoiceEditorSource, /isSelectedInvoiceSettled \?/, 'settled Invoice has an explicit read-only presentation branch');
assert.match(invoiceEditorSource, /readOnly=\{isSelectedInvoiceSettled\}/, 'settled Invoice text fields are read-only');
assert.match(invoiceEditorSource, /disabled=\{isSelectedInvoiceSettled\}/, 'settled Invoice select/number controls are disabled');
assert.match(invoiceEditorSource, /!isSelectedInvoiceSettled && \(/, 'settled Invoice mutation CTA group is unavailable');
assert.match(invoiceEditorSource, /!isSelectedInvoiceSettled && \(/, 'settled Invoice line-item mutation controls are unavailable');
assert.match(dashboard, /typeof isSelectedInvoiceSettled !== 'undefined' && isSelectedInvoiceSettled/, 'stale save events fail closed before the Invoice save path');

console.log('R50_FIX2_PAID_INVOICE_SETTLED_TRUTH=PASS');
