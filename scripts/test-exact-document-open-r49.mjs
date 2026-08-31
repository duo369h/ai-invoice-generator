import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';

const root = process.cwd();
const dashboardPath = path.join(root, 'src/components/dashboard/Dashboard.js');
const dashboard = readFileSync(dashboardPath, 'utf8');
const dependencyRoot = process.env.CORVIOZ_NODE_MODULES_ROOT || root;
const sharedRequire = createRequire(path.join(dependencyRoot, 'package.json'));
const { chromium } = sharedRequire('playwright');
const nextCli = sharedRequire.resolve('next/dist/bin/next');

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

function extractConstArrow(name) {
  const start = dashboard.indexOf(`const ${name} =`);
  assert.notEqual(start, -1, `Dashboard must define ${name}`);
  const arrow = dashboard.indexOf('=>', start);
  const open = dashboard.indexOf('{', arrow);
  return dashboard.slice(start, matchingBrace(dashboard, open) + 1);
}

function extractClickBody(marker) {
  const markerIndex = dashboard.indexOf(marker);
  assert.notEqual(markerIndex, -1, `Dashboard marker not found: ${marker}`);
  const onClick = dashboard.lastIndexOf('onClick={() => {', markerIndex);
  assert.notEqual(onClick, -1, `Dashboard click handler not found for: ${marker}`);
  const arrow = dashboard.indexOf('=>', onClick);
  const open = dashboard.indexOf('{', arrow);
  return dashboard.slice(open + 1, matchingBrace(dashboard, open));
}

const openDocumentSource = extractConstArrow('openDocument');
const quoteListEditSource = extractClickBody('openDocument({ documentType: \'quote\', id: q.id })');
const invoiceListEditSource = extractClickBody('openDocument({ documentType: \'invoice\', id: inv.id })');

assert.match(dashboard, /function ClientDocumentsPanel\([\s\S]*?onOpenDocument/, 'Client Documents must accept the shared open callback');
assert.match(dashboard, /Open \$\{type === 'quote' \? 'Quote' : 'Invoice'\}/, 'Client Documents must expose an explicit accessible Open action');

function createOpenDocumentHarness() {
  const factory = new Function('openDocumentSource', `
    let activeTab = 'clients';
    let quoteView = 'list';
    let invoiceView = 'list';
    let qId = '';
    let qNumber = '';
    let qClientId = null;
    let qClientName = '';
    let qClientEmail = '';
    let qClientAddress = '';
    let qItems = [];
    let qTaxRate = 0;
    let qDiscountRate = 0;
    let qCurrency = 'USD';
    let qNotes = '';
    let qDate = '';
    let qStatus = 'draft';
    let selectedQuotePresetId = 'stale-preset';
    let isFirstQuoteFlow = true;
    let qClientNameTouched = true;
    let qClientEmailTouched = true;
    let qSubmitAttempted = true;
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
    let invStatus = 'pending';
    let invPaymentLink = '';
    let invQuoteId = null;
    let invBillingType = 'standard';
    let invoiceFlowStage = 'create';
    let invoiceFlowLocked = false;
    let showPaymentWaitingBanner = true;
    const quotes = [
      { id: 'quote-a', quote_number: 'QT-SAME', client_id: 'client-r49', client_name: 'Quote A Client', client_email: 'a@example.com', client_address: 'A address', items: [{ description: 'Quote A item', quantity: 2, unitPrice: 101 }], tax_rate: 5, discount_rate: 2, currency: 'USD', notes: 'Quote A notes', created_at: '2026-08-01T00:00:00Z', status: 'approved' },
      { id: 'quote-b', quote_number: 'QT-SAME', client_id: 'client-r49', client_name: 'Quote B Client', client_email: 'b@example.com', client_address: 'B address', items: [{ description: 'Quote B item', quantity: 3, unit_price: 20200 }], tax_rate: 7, discount_rate: 4, currency: 'EUR', notes: 'Quote B notes', created_at: '2026-08-02T00:00:00Z', status: 'sent' },
      { id: 'quote-c', quote_number: 'QT-C', client_id: null, client_name: 'Null Quote Client', items: [{ description: 'Quote C item', quantity: 1, unitPrice: 303 }], currency: 'CAD', notes: 'Quote C notes', created_at: '2026-08-05T00:00:00Z', status: 'draft' },
    ];
    const invoices = [
      { id: 'invoice-a', invoice_number: 'INV-SAME', client_id: 'client-r49', client_name: 'Invoice A Client', client_email: 'ia@example.com', client_address: 'IA address', items: [{ description: 'Invoice A item', quantity: 1, unit_price: 40400 }], tax_rate: 8, discount_rate: 1, currency: 'GBP', notes: 'Invoice A notes', invoice_date: '2026-08-03', due_date: '2026-09-03', payment_terms: 'Net 14', status: 'pending', payment_link: 'https://pay.example/a', quote_id: 'quote-a' },
      { id: 'invoice-b', invoice_number: 'INV-SAME', client_id: 'client-r49', client_name: 'Invoice B Client', client_email: 'ib@example.com', client_address: 'IB address', items: [{ description: 'Invoice B item', quantity: 2, unitPrice: 505 }], tax_rate: 9, discount_rate: 3, currency: 'AUD', notes: 'Invoice B notes', invoice_date: '2026-08-04', due_date: '2026-09-04', payment_terms: 'Net 30', status: 'paid', payment_link: 'https://pay.example/b', quote_id: 'quote-b' },
      { id: 'invoice-c', invoice_number: 'INV-C', client_id: null, client_name: 'Null Invoice Client', items: [{ description: 'Invoice C item', quantity: 1, unitPrice: 606 }], currency: 'CAD', notes: 'Invoice C notes', invoice_date: '2026-08-05', due_date: '2026-09-05', status: 'draft', quote_id: null },
    ];
    const set = (name) => (value) => { ${'return'} setters[name](value); };
    const setters = {
      qId: (value) => { qId = value; }, qNumber: (value) => { qNumber = value; }, qClientId: (value) => { qClientId = value; }, qClientName: (value) => { qClientName = value; }, qClientEmail: (value) => { qClientEmail = value; }, qClientAddress: (value) => { qClientAddress = value; }, qItems: (value) => { qItems = value; }, qTaxRate: (value) => { qTaxRate = value; }, qDiscountRate: (value) => { qDiscountRate = value; }, qCurrency: (value) => { qCurrency = value; }, qNotes: (value) => { qNotes = value; }, qDate: (value) => { qDate = value; }, qStatus: (value) => { qStatus = value; }, selectedQuotePresetId: (value) => { selectedQuotePresetId = value; }, isFirstQuoteFlow: (value) => { isFirstQuoteFlow = value; }, qClientNameTouched: (value) => { qClientNameTouched = value; }, qClientEmailTouched: (value) => { qClientEmailTouched = value; }, qSubmitAttempted: (value) => { qSubmitAttempted = value; },
      invId: (value) => { invId = value; }, invClientId: (value) => { invClientId = value; }, invNumber: (value) => { invNumber = value; }, invClientName: (value) => { invClientName = value; }, invClientEmail: (value) => { invClientEmail = value; }, invClientAddress: (value) => { invClientAddress = value; }, invItems: (value) => { invItems = value; }, invTaxRate: (value) => { invTaxRate = value; }, invDiscountRate: (value) => { invDiscountRate = value; }, invCurrency: (value) => { invCurrency = value; }, invNotes: (value) => { invNotes = value; }, invDate: (value) => { invDate = value; }, invDueDate: (value) => { invDueDate = value; }, invPaymentTerms: (value) => { invPaymentTerms = value; }, invStatus: (value) => { invStatus = value; }, invPaymentLink: (value) => { invPaymentLink = value; }, invQuoteId: (value) => { invQuoteId = value; }, invBillingType: (value) => { invBillingType = value; }, invoiceFlowStage: (value) => { invoiceFlowStage = value; }, invoiceFlowLocked: (value) => { invoiceFlowLocked = value; }, showPaymentWaitingBanner: (value) => { showPaymentWaitingBanner = value; },
    };
    const setQId = set('qId'), setQNumber = set('qNumber'), setQClientId = set('qClientId'), setQClientName = set('qClientName'), setQClientEmail = set('qClientEmail'), setQClientAddress = set('qClientAddress'), setQItems = set('qItems'), setQTaxRate = set('qTaxRate'), setQDiscountRate = set('qDiscountRate'), setQCurrency = set('qCurrency'), setQNotes = set('qNotes'), setQDate = set('qDate'), setQStatus = set('qStatus'), setSelectedQuotePresetId = set('selectedQuotePresetId'), setIsFirstQuoteFlow = set('isFirstQuoteFlow'), setQClientNameTouched = set('qClientNameTouched'), setQClientEmailTouched = set('qClientEmailTouched'), setQSubmitAttempted = set('qSubmitAttempted');
    const setInvId = set('invId'), setInvClientId = set('invClientId'), setInvNumber = set('invNumber'), setInvClientName = set('invClientName'), setInvClientEmail = set('invClientEmail'), setInvClientAddress = set('invClientAddress'), setInvItems = set('invItems'), setInvTaxRate = set('invTaxRate'), setInvDiscountRate = set('invDiscountRate'), setInvCurrency = set('invCurrency'), setInvNotes = set('invNotes'), setInvDate = set('invDate'), setInvDueDate = set('invDueDate'), setInvPaymentTerms = set('invPaymentTerms'), setInvStatus = set('invStatus'), setInvPaymentLink = set('invPaymentLink'), setInvQuoteId = set('invQuoteId'), setInvBillingType = set('invBillingType'), setInvoiceFlowStage = set('invoiceFlowStage'), setInvoiceFlowLocked = set('invoiceFlowLocked'), setShowPaymentWaitingBanner = set('showPaymentWaitingBanner');
    const setQuoteView = (value) => { quoteView = value; };
    const setInvoiceView = (value) => { invoiceView = value; };
    const handleDashboardTabChange = (value) => { activeTab = value; };
    const deserializeInvoiceNotes = (notes) => ({ notes: typeof notes === 'string' ? notes : notes?.notes || '', billing_type: typeof notes === 'object' && notes?.billing_type ? notes.billing_type : 'standard' });
    const ${'openDocument'} = eval('(' + openDocumentSource.replace(/^const openDocument = /, '') + ')');
    return {
      openDocument,
      getQuote: () => ({ qId, qNumber, qClientId, qClientName, qClientEmail, qClientAddress, qItems, qTaxRate, qDiscountRate, qCurrency, qNotes, qDate, qStatus, selectedQuotePresetId, isFirstQuoteFlow, qClientNameTouched, qClientEmailTouched, qSubmitAttempted, quoteView, activeTab }),
      getInvoice: () => ({ invId, invClientId, invNumber, invClientName, invClientEmail, invClientAddress, invItems, invTaxRate, invDiscountRate, invCurrency, invNotes, invDate, invDueDate, invPaymentTerms, invStatus, invPaymentLink, invQuoteId, invBillingType, invoiceFlowStage, invoiceFlowLocked, showPaymentWaitingBanner, invoiceView, activeTab }),
      seedQuote: (state) => { qId = state.qId; qClientId = state.qClientId; qNumber = state.qNumber; qClientName = state.qClientName; },
      seedInvoice: (state) => { invId = state.invId; invClientId = state.invClientId; invNumber = state.invNumber; invClientName = state.invClientName; },
    };
  `);
  return factory(openDocumentSource);
}

const harness = createOpenDocumentHarness();

function expectQuote(h, id, expected) {
  assert.equal(h.openDocument({ documentType: 'quote', id }), true, `Quote ${id} opens`);
  const state = h.getQuote();
  assert.equal(state.qId, id);
  const { qItems, ...expectedFields } = expected;
  assert.deepEqual({ qClientId: state.qClientId, qNumber: state.qNumber, qClientName: state.qClientName, qClientEmail: state.qClientEmail, qClientAddress: state.qClientAddress, qCurrency: state.qCurrency, qNotes: state.qNotes, qDate: state.qDate, qStatus: state.qStatus, qTaxRate: state.qTaxRate, qDiscountRate: state.qDiscountRate, selectedQuotePresetId: state.selectedQuotePresetId, isFirstQuoteFlow: state.isFirstQuoteFlow, quoteView: state.quoteView, activeTab: state.activeTab }, expectedFields);
  assert.deepEqual(state.qItems, expected.qItems);
}

function expectInvoice(h, id, expected) {
  assert.equal(h.openDocument({ documentType: 'invoice', id }), true, `Invoice ${id} opens`);
  const state = h.getInvoice();
  assert.equal(state.invId, id);
  const { invItems, ...expectedFields } = expected;
  assert.deepEqual({ invClientId: state.invClientId, invNumber: state.invNumber, invClientName: state.invClientName, invClientEmail: state.invClientEmail, invClientAddress: state.invClientAddress, invCurrency: state.invCurrency, invNotes: state.invNotes, invDate: state.invDate, invDueDate: state.invDueDate, invPaymentTerms: state.invPaymentTerms, invStatus: state.invStatus, invPaymentLink: state.invPaymentLink, invQuoteId: state.invQuoteId, invBillingType: state.invBillingType, invTaxRate: state.invTaxRate, invDiscountRate: state.invDiscountRate, invoiceFlowStage: state.invoiceFlowStage, invoiceFlowLocked: state.invoiceFlowLocked, showPaymentWaitingBanner: state.showPaymentWaitingBanner, invoiceView: state.invoiceView, activeTab: state.activeTab }, expectedFields);
  assert.deepEqual(state.invItems, expected.invItems);
}

expectQuote(harness, 'quote-a', { qClientId: 'client-r49', qNumber: 'QT-SAME', qClientName: 'Quote A Client', qClientEmail: 'a@example.com', qClientAddress: 'A address', qCurrency: 'USD', qNotes: 'Quote A notes', qDate: '2026-08-01', qStatus: 'approved', qTaxRate: 5, qDiscountRate: 2, selectedQuotePresetId: '', isFirstQuoteFlow: false, quoteView: 'edit', activeTab: 'quotes', qItems: [{ description: 'Quote A item', quantity: 2, unitPrice: 101 }] });
expectQuote(harness, 'quote-b', { qClientId: 'client-r49', qNumber: 'QT-SAME', qClientName: 'Quote B Client', qClientEmail: 'b@example.com', qClientAddress: 'B address', qCurrency: 'EUR', qNotes: 'Quote B notes', qDate: '2026-08-02', qStatus: 'sent', qTaxRate: 7, qDiscountRate: 4, selectedQuotePresetId: '', isFirstQuoteFlow: false, quoteView: 'edit', activeTab: 'quotes', qItems: [{ description: 'Quote B item', quantity: 3, unitPrice: 202 }] });
expectQuote(harness, 'quote-a', { qClientId: 'client-r49', qNumber: 'QT-SAME', qClientName: 'Quote A Client', qClientEmail: 'a@example.com', qClientAddress: 'A address', qCurrency: 'USD', qNotes: 'Quote A notes', qDate: '2026-08-01', qStatus: 'approved', qTaxRate: 5, qDiscountRate: 2, selectedQuotePresetId: '', isFirstQuoteFlow: false, quoteView: 'edit', activeTab: 'quotes', qItems: [{ description: 'Quote A item', quantity: 2, unitPrice: 101 }] });
expectQuote(harness, 'quote-c', { qClientId: null, qNumber: 'QT-C', qClientName: 'Null Quote Client', qClientEmail: '', qClientAddress: '', qCurrency: 'CAD', qNotes: 'Quote C notes', qDate: '2026-08-05', qStatus: 'draft', qTaxRate: 0, qDiscountRate: 0, selectedQuotePresetId: '', isFirstQuoteFlow: false, quoteView: 'edit', activeTab: 'quotes', qItems: [{ description: 'Quote C item', quantity: 1, unitPrice: 303 }] });

const unknownQuoteBefore = harness.getQuote();
assert.equal(harness.openDocument({ documentType: 'quote', id: 'missing-id' }), false, 'unknown Quote ID fails closed');
assert.deepEqual(harness.getQuote(), unknownQuoteBefore, 'unknown Quote ID does not replace the previous Quote editor');
assert.equal(harness.openDocument({ documentType: 'invoice', id: 'quote-a' }), false, 'cross-type ID confusion fails closed');
assert.equal(harness.openDocument({ documentType: 'unsupported', id: 'quote-a' }), false, 'unsupported document type fails closed');
assert.equal(harness.openDocument({ documentType: 'quote' }), false, 'missing ID fails closed');

expectInvoice(harness, 'invoice-a', { invClientId: 'client-r49', invNumber: 'INV-SAME', invClientName: 'Invoice A Client', invClientEmail: 'ia@example.com', invClientAddress: 'IA address', invCurrency: 'GBP', invNotes: 'Invoice A notes', invDate: '2026-08-03', invDueDate: '2026-09-03', invPaymentTerms: 'Net 14', invStatus: 'pending', invPaymentLink: 'https://pay.example/a', invQuoteId: 'quote-a', invBillingType: 'standard', invTaxRate: 8, invDiscountRate: 1, invoiceFlowStage: 'create', invoiceFlowLocked: true, showPaymentWaitingBanner: false, invoiceView: 'edit', activeTab: 'invoices', invItems: [{ description: 'Invoice A item', quantity: 1, unitPrice: 404 }] });
expectInvoice(harness, 'invoice-b', { invClientId: 'client-r49', invNumber: 'INV-SAME', invClientName: 'Invoice B Client', invClientEmail: 'ib@example.com', invClientAddress: 'IB address', invCurrency: 'AUD', invNotes: 'Invoice B notes', invDate: '2026-08-04', invDueDate: '2026-09-04', invPaymentTerms: 'Net 30', invStatus: 'paid', invPaymentLink: 'https://pay.example/b', invQuoteId: 'quote-b', invBillingType: 'standard', invTaxRate: 9, invDiscountRate: 3, invoiceFlowStage: 'create', invoiceFlowLocked: true, showPaymentWaitingBanner: false, invoiceView: 'edit', activeTab: 'invoices', invItems: [{ description: 'Invoice B item', quantity: 2, unitPrice: 505 }] });
expectInvoice(harness, 'invoice-a', { invClientId: 'client-r49', invNumber: 'INV-SAME', invClientName: 'Invoice A Client', invClientEmail: 'ia@example.com', invClientAddress: 'IA address', invCurrency: 'GBP', invNotes: 'Invoice A notes', invDate: '2026-08-03', invDueDate: '2026-09-03', invPaymentTerms: 'Net 14', invStatus: 'pending', invPaymentLink: 'https://pay.example/a', invQuoteId: 'quote-a', invBillingType: 'standard', invTaxRate: 8, invDiscountRate: 1, invoiceFlowStage: 'create', invoiceFlowLocked: true, showPaymentWaitingBanner: false, invoiceView: 'edit', activeTab: 'invoices', invItems: [{ description: 'Invoice A item', quantity: 1, unitPrice: 404 }] });
const unknownInvoiceBefore = harness.getInvoice();
assert.equal(harness.openDocument({ documentType: 'invoice', id: 'missing-id' }), false, 'unknown Invoice ID fails closed');
assert.deepEqual(harness.getInvoice(), unknownInvoiceBefore, 'unknown Invoice ID does not replace the previous Invoice editor');

assert.match(quoteListEditSource, /openDocument\(\{ documentType: 'quote', id: q\.id \}\)/, 'Quote list Edit delegates to the shared contract');
assert.match(invoiceListEditSource, /openDocument\(\{ documentType: 'invoice', id: inv\.id \}\)/, 'Invoice list Edit delegates to the shared contract');
assert.doesNotMatch(openDocumentSource, /fetch\s*\(|\.\s*(?:post|patch|put|delete)\s*\(/i, 'openDocument has no network or mutation path');
assert.match(openDocumentSource, /\.id\s*===\s*id/, 'openDocument uses strict canonical ID equality');
assert.match(openDocumentSource, /quotes\.find\(\(document\) => document\?\.id === id\)/, 'Quote lookup is scoped to the loaded Quote collection');
assert.match(openDocumentSource, /invoices\.find\(\(document\) => document\?\.id === id\)/, 'Invoice lookup is scoped to the loaded Invoice collection');
assert.doesNotMatch(openDocumentSource, /quotes\.find\([^)]*(?:quote_number|client_name|client_email|amount|status)/, 'Quote lookup does not use display or relation fields');
assert.doesNotMatch(openDocumentSource, /invoices\.find\([^)]*(?:invoice_number|client_name|client_email|amount|status)/, 'Invoice lookup does not use display or relation fields');
assert.doesNotMatch(dashboard, /\?(?:quoteId|invoiceId|documentId)=/, 'R49 adds no exact-document query parameter');

function base64Url(value) { return Buffer.from(JSON.stringify(value)).toString('base64url'); }
function createBrowserSession() {
  const user = { id: 'client-directory-r49-user', aud: 'authenticated', role: 'authenticated', email: 'r49@example.com', app_metadata: { provider: 'email' }, user_metadata: {} };
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  return { access_token: [base64Url({ alg: 'none', typ: 'JWT' }), base64Url({ ...user, exp: expiresAt }), 'r49-test-signature'].join('.'), refresh_token: 'r49-refresh', expires_in: 3600, expires_at: expiresAt, token_type: 'bearer', user };
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version' });
  response.end(JSON.stringify(body));
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function startMockSupabase() {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url, 'http://127.0.0.1');
    if (request.method === 'GET' && requestUrl.pathname === '/auth/v1/user') {
      sendJson(response, 200, createBrowserSession().user);
      return;
    }
    if (request.method === 'GET' && requestUrl.pathname === '/rest/v1/entitlements') {
      sendJson(response, 200, [{ user_id: 'client-directory-r49-user', invoice: true, export_pdf: false, client_portal: false, crm: false, automation: false, advanced_invoicing: false }]);
      return;
    }
    sendJson(response, 404, { error: 'unhandled mock request' });
  });
  const port = await getFreePort();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))) };
}

async function startNextTestServer(mockSupabaseUrl) {
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [nextCli, 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: root, env: { ...process.env, NODE_PATH: path.join(dependencyRoot, 'node_modules'), NEXT_PUBLIC_SUPABASE_URL: mockSupabaseUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'r49-test-anon-key' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let serverOutput = '';
  child.stdout.on('data', (chunk) => { serverOutput += chunk.toString(); });
  child.stderr.on('data', (chunk) => { serverOutput += chunk.toString(); });
  const deadline = Date.now() + 60_000;
  try {
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`Next test server exited with ${child.exitCode}`);
      try {
        const healthResponse = await fetch(`${baseUrl}/auth`);
        if (healthResponse.ok) return { baseUrl, close: () => closeNextTestServer(child) };
      } catch (_) {}
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error('Timed out waiting for Next test server');
  } catch (error) {
    child.kill('SIGTERM');
    throw new Error(`${error.message}\n${serverOutput}`);
  }
}

async function closeNextTestServer(child) {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([new Promise((resolve) => child.once('exit', resolve)), new Promise((resolve) => setTimeout(resolve, 5000))]);
  if (child.exitCode === null) child.kill('SIGKILL');
}

function normalApiBody(pathname) {
  if (pathname === '/api/user') return { id: 'client-directory-r49-user', email: 'r49@example.com', name: 'R49 Test User', plan: 'pro', hasActivated: true, auth_mode: 'supabase', quota: {} };
  if (pathname === '/api/clients') return { data: [{ id: 'client-r49', name: 'R49 Client', email: 'client-r49@example.com', address: 'R49 address' }] };
  if (pathname === '/api/quotes') return { data: [
    { id: 'quote-a', quote_number: 'QT-SAME', client_id: 'client-r49', client_name: 'Quote A Client', client_email: 'a@example.com', client_address: 'A address', items: [{ description: 'Quote A item', quantity: 2, unitPrice: 101 }], tax_rate: 5, discount_rate: 2, currency: 'USD', notes: 'Quote A notes', created_at: '2026-08-01T00:00:00Z', status: 'approved' },
    { id: 'quote-b', quote_number: 'QT-SAME', client_id: 'client-r49', client_name: 'Quote B Client', client_email: 'b@example.com', client_address: 'B address', items: [{ description: 'Quote B item', quantity: 3, unit_price: 20200 }], tax_rate: 7, discount_rate: 4, currency: 'EUR', notes: 'Quote B notes', created_at: '2026-08-02T00:00:00Z', status: 'sent' },
  ] };
  if (pathname === '/api/invoices') return { data: [
    { id: 'invoice-a', invoice_number: 'INV-SAME', client_id: 'client-r49', client_name: 'Invoice A Client', client_email: 'ia@example.com', client_address: 'IA address', items: [{ description: 'Invoice A item', quantity: 1, unit_price: 40400 }], tax_rate: 8, discount_rate: 1, currency: 'GBP', notes: 'Invoice A notes', invoice_date: '2026-08-03', due_date: '2026-09-03', payment_terms: 'Net 14', status: 'pending', payment_link: 'https://pay.example/a', quote_id: 'quote-a' },
    { id: 'invoice-b', invoice_number: 'INV-SAME', client_id: 'client-r49', client_name: 'Invoice B Client', client_email: 'ib@example.com', client_address: 'IB address', items: [{ description: 'Invoice B item', quantity: 2, unitPrice: 505 }], tax_rate: 9, discount_rate: 3, currency: 'AUD', notes: 'Invoice B notes', invoice_date: '2026-08-04', due_date: '2026-09-04', payment_terms: 'Net 30', status: 'paid', payment_link: 'https://pay.example/b', quote_id: 'quote-b' },
  ] };
  if (pathname === '/api/card-profile') return { id: 'r49-profile' };
  return { data: [] };
}

async function runBrowserChecks() {
  const mockSupabase = await startMockSupabase();
  const nextServer = await startNextTestServer(mockSupabase.url);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const session = createBrowserSession();
  const requestCounts = new Map();
  const pageErrors = [];
  const visualDirectory = path.join(root, 'output', 'r49-exact-open-visual');
  mkdirSync(visualDirectory, { recursive: true });
  try {
    await context.addInitScript((storedSession) => { window.localStorage.setItem('corvioz_analytics_consent', 'accepted'); window.localStorage.setItem('sb-127-auth-token', JSON.stringify(storedSession)); }, session);
    await context.addCookies([{ name: 'sb-127-auth-token.0', value: encodeURIComponent(JSON.stringify(session)), url: nextServer.baseUrl }]);
    page.on('pageerror', (error) => pageErrors.push(error));
    await page.route('**/api/**', async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      requestCounts.set(pathname, (requestCounts.get(pathname) || 0) + 1);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(normalApiBody(pathname)) });
    });
    await page.goto(`${nextServer.baseUrl}/dashboard?tool=clients`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Client Directory', exact: true }).waitFor({ state: 'visible' });
    const debugPanelClose = page.getByRole('button', { name: 'Close Debug Panel', exact: true });
    if (await debugPanelClose.count() > 0) await debugPanelClose.click();
    const documentsToggle = page.getByRole('button', { name: 'View documents for R49 Client', exact: true });
    await documentsToggle.click();
    const panel = page.getByTestId('client-documents-panel-client-r49');
    await panel.waitFor({ state: 'visible' });
    assert.equal(await panel.getByRole('button', { name: 'Open Quote QT-SAME', exact: true }).count(), 2, 'both linked Quote rows expose Open');
    assert.equal(await panel.getByRole('button', { name: 'Open Invoice INV-SAME', exact: true }).count(), 2, 'both linked Invoice rows expose Open');
    await page.screenshot({ path: path.join(visualDirectory, 'client-documents-linked-desktop.png'), fullPage: true });

    const openAndAssert = async (type, index, heading, expectedValue) => {
      await panel.getByRole('button', { name: type === 'quote' ? 'Open Quote QT-SAME' : 'Open Invoice INV-SAME', exact: true }).nth(index).click();
      await page.getByRole('heading', { name: heading, exact: true }).waitFor({ state: 'visible' });
      const values = await page.locator('input, textarea').evaluateAll((elements) => elements.map((element) => element.value));
      assert.ok(values.includes(expectedValue), `${type} row ${index} hydrates its exact record; url=${page.url()}; values=${JSON.stringify(values)}`);
      assert.doesNotMatch(page.url(), /(?:quoteId|invoiceId|documentId)=/, 'exact open remains in-session without URL persistence');
      if (type === 'invoice') {
        const settled = index === 1;
        const editorControls = page.locator('input.form-input, select.form-select, textarea.form-textarea');
        const controlStates = await editorControls.evaluateAll((elements) => elements.map((element) => ({ disabled: element.disabled, readOnly: element.readOnly })));
        assert.equal(
          await page.getByRole('button', { name: 'Save draft', exact: true }).count(),
          settled ? 0 : 1,
          settled ? 'settled Invoice has no Save draft action' : 'unpaid Invoice keeps Save draft action',
        );
        assert.equal(
          await page.getByRole('button', { name: 'Continue to preview', exact: true }).count(),
          settled ? 0 : 1,
          settled ? 'settled Invoice has no preview mutation path' : 'unpaid Invoice keeps preview action',
        );
        assert.equal(
          await page.locator('button').filter({ hasText: '+ Add Item' }).count(),
          settled ? 0 : 1,
          settled ? 'settled Invoice has no add-line-item control' : 'unpaid Invoice keeps add-line-item control',
        );
        if (settled) {
          assert.ok(controlStates.length > 0 && controlStates.every(({ disabled, readOnly }) => disabled || readOnly), 'settled Invoice fields are all read-only or disabled');
          assert.equal(await page.getByText('Read only · Recorded payment', { exact: true }).count(), 2, 'settled Invoice shows explicit read-only truth in banner and status');
          await page.screenshot({ path: path.join(visualDirectory, 'settled-invoice-desktop.png'), fullPage: true });
          await page.setViewportSize({ width: 390, height: 900 });
          await page.screenshot({ path: path.join(visualDirectory, 'settled-invoice-390.png'), fullPage: true });
          await page.setViewportSize({ width: 1280, height: 900 });
        } else {
          assert.ok(controlStates.some(({ disabled, readOnly }) => !disabled && !readOnly), 'unpaid Invoice retains an editable field');
          await page.screenshot({ path: path.join(visualDirectory, 'unpaid-invoice-desktop.png'), fullPage: true });
        }
      }
      await page.getByRole('button', { name: type === 'quote' ? 'Cancel' : 'Exit to dashboard', exact: true }).click();
      if (type === 'invoice') await page.getByRole('button', { name: 'Clients', exact: true }).click();
      else await page.getByRole('button', { name: 'Clients', exact: true }).click();
      await page.getByRole('heading', { name: 'Client Directory', exact: true }).waitFor({ state: 'visible' });
      const returnedDocumentsToggle = page.getByRole('button', { name: /documents for R49 Client/, exact: true });
      if (await returnedDocumentsToggle.count() === 0) {
        await page.screenshot({ path: path.join(visualDirectory, `return-${type}-${index}.png`), fullPage: true });
        throw new Error(`Client Documents control missing after ${type} return at ${page.url()}; buttons=${JSON.stringify(await page.getByRole('button').allTextContents())}`);
      }
      if (await returnedDocumentsToggle.getAttribute('aria-expanded') !== 'true') await returnedDocumentsToggle.click();
      await panel.waitFor({ state: 'visible' });
    };

    await openAndAssert('quote', 1, 'Edit Quote QT-SAME', 'Quote A Client');
    await openAndAssert('quote', 0, 'Edit Quote QT-SAME', 'Quote B Client');
    await openAndAssert('quote', 1, 'Edit Quote QT-SAME', 'Quote A Client');
    await openAndAssert('invoice', 0, 'Edit Document INV-SAME', 'Invoice A Client');
    await openAndAssert('invoice', 1, 'View Invoice INV-SAME', 'Invoice B Client');
    await openAndAssert('invoice', 0, 'Edit Document INV-SAME', 'Invoice A Client');
    await page.setViewportSize({ width: 390, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, 'Client Documents exact-open surface has no horizontal overflow at 390px');
    await page.screenshot({ path: path.join(visualDirectory, 'client-documents-390.png'), fullPage: true });
    assert.deepEqual(pageErrors, [], 'R49 runtime has no page errors');
    assert.equal(requestCounts.get('/api/quotes'), 1, 'exact open adds no Quote fetch');
    assert.equal(requestCounts.get('/api/invoices'), 1, 'exact open adds no Invoice fetch');
  } finally {
    await context.close();
    await browser.close();
    await nextServer.close();
    await mockSupabase.close();
  }
}

await runBrowserChecks();
console.log('CORVIOZ_EXACT_DOCUMENT_OPEN_CORE_R49_TEST=PASS');
