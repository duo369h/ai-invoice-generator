import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { paymentStatusForInvoice } from '../src/core/revenue/invoicePaymentState.js';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const dashboardPath = path.resolve(scriptDirectory, '../src/components/dashboard/Dashboard.js');
const dashboard = fs.readFileSync(dashboardPath, 'utf8');

function extractArrowFunction(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `source contains ${marker}`);
  const arrowStart = source.indexOf('=>', start);
  const bodyStart = source.indexOf('{', arrowStart);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = bodyStart; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }
    if (character === '{') depth += 1;
    if (character === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(source.indexOf('=', start) + 1, index + 1);
    }
  }
  throw new Error(`could not extract ${marker}`);
}

const timelineSource = extractArrowFunction(dashboard, 'export const getInvoiceTimelineState');
const getInvoiceTimelineState = new Function('paymentStatusForInvoice', `return ${timelineSource}`)(paymentStatusForInvoice);

function stage(state, key) {
  return state.stages.find((item) => item.key === key);
}

const invoiceFixtures = {
  pending: { id: 'invoice-a', status: 'pending', payment_status: 'unpaid', total: 10000, amount_paid_cents: 0 },
  sent: { id: 'invoice-b', status: 'sent', payment_status: 'unpaid', total: 10000, amount_paid_cents: 0 },
  partial: { id: 'invoice-c', status: 'sent', payment_status: 'partial', total: 10000, amount_paid_cents: 2500 },
  paid: { id: 'invoice-d', status: 'sent', payment_status: 'paid', total: 10000, amount_paid_cents: 10000 },
  overdue: { id: 'invoice-e', status: 'pending', payment_status: 'overdue', total: 10000, amount_paid_cents: 0 },
};

const unsavedDraftTimeline = getInvoiceTimelineState({ status: 'draft' });
assert.equal(stage(unsavedDraftTimeline, 'created').done, false, 'unsaved Invoice must not claim Created completed');
assert.equal(stage(unsavedDraftTimeline, 'sent').done, false, 'unsaved draft must not claim Sent completed');
assert.equal(stage(unsavedDraftTimeline, 'completed').done, false, 'unsaved draft must not claim Completed');

const persistedDraftTimeline = getInvoiceTimelineState({ id: 'invoice-draft', status: 'draft', payment_status: 'unpaid' });
assert.equal(stage(persistedDraftTimeline, 'created').done, true, 'persisted draft may claim Created completed');

const unsavedSentTimeline = getInvoiceTimelineState({ status: 'sent', payment_status: 'unpaid' });
assert.equal(stage(unsavedSentTimeline, 'sent').done, false, 'unsaved Invoice must not claim Sent completed');

const unsavedPaidTimeline = getInvoiceTimelineState({ status: 'draft', payment_status: 'paid', amount_paid_cents: 10000 });
assert.equal(stage(unsavedPaidTimeline, 'completed').done, false, 'unsaved Invoice must not claim Completed from payment state');

const pendingTimeline = getInvoiceTimelineState(invoiceFixtures.pending);
assert.equal(stage(pendingTimeline, 'sent').done, false, 'pending Invoice must not claim Sent completed');
assert.equal(stage(pendingTimeline, 'sent').active, true, 'pending Invoice may show Sent as the next active step');

const sentTimeline = getInvoiceTimelineState(invoiceFixtures.sent);
assert.equal(stage(sentTimeline, 'sent').done, true, 'status=sent supports Sent completed');
assert.equal(stage(sentTimeline, 'completed').done, false, 'unpaid sent Invoice must not claim Completed');
assert.equal(stage(sentTimeline, 'opened'), undefined, 'Opened is not shown without authoritative open evidence');

const partialTimeline = getInvoiceTimelineState(invoiceFixtures.partial);
assert.equal(stage(partialTimeline, 'completed').done, false, 'partial payment must not claim Completed');

const paidTimeline = getInvoiceTimelineState(invoiceFixtures.paid);
assert.equal(stage(paidTimeline, 'sent').done, true, 'paid Invoice keeps Sent only when status proves Sent');
assert.equal(stage(paidTimeline, 'completed').done, true, 'fully paid Invoice may claim Completed');

const overdueTimeline = getInvoiceTimelineState(invoiceFixtures.overdue);
assert.equal(stage(overdueTimeline, 'sent').done, false, 'overdue payment state does not prove Sent');
assert.equal(stage(overdueTimeline, 'completed').done, false, 'overdue unpaid Invoice must not claim Completed');

const sequence = ['pending', 'sent', 'partial', 'paid', 'overdue', 'pending'];
const isolatedStates = sequence.map((fixture) => getInvoiceTimelineState(invoiceFixtures[fixture]));
assert.deepEqual(
  isolatedStates[0],
  getInvoiceTimelineState(invoiceFixtures.pending),
  'returning to pending after other documents must not leak timeline state',
);

const invoiceEditorSource = dashboard.slice(dashboard.indexOf('/* Invoice Create / Edit View */'));
assert.match(invoiceEditorSource, /!isSelectedInvoiceSettled\s*&&\s*renderInvoiceFlowStepper\(\)/, 'settled Invoice must hide the composer stepper');
assert.doesNotMatch(invoiceEditorSource, /\{\s*renderInvoiceFlowStepper\(\)\s*\}/, 'settled Invoice must not unconditionally render the composer stepper');
assert.match(invoiceEditorSource, /invStatus\s*===\s*['"]sent['"][\s\S]{0,160}['"]Sent['"]/, 'sent Invoice status must not display Pending until sent');

assert.match(dashboard, /ClientDocumentsPanel[\s\S]*?onOpenDocument/, 'Client Documents must use the shared exact-open callback');
assert.match(dashboard, /openDocument\(\{ documentType: 'invoice', id: inv\.id \}\)/, 'Invoice list must use the shared exact-open callback');
assert.match(dashboard, /invoices\.find\(\(document\) => document\?\.id === id\)/, 'Invoice exact-open must use canonical ID equality');
assert.doesNotMatch(timelineSource, /fetch\s*\(|\.\s*(?:post|patch|put|delete)\s*\(/i, 'timeline state has no network write or fetch path');
assert.doesNotMatch(timelineSource, /opened_at|viewed_at|client_opened_at|updated_at/, 'timeline does not fabricate activity from unsupported timestamps');

console.log('R50_FIX_2_5_INVOICE_WORKFLOW_TRUTH=PASS');
