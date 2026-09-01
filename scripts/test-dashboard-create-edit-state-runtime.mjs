import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dashboard = await readFile(resolve(root, 'src/components/dashboard/Dashboard.js'), 'utf8');
const studioSpace = await readFile(resolve(root, 'src/app/dashboard/components/StudioSpace.js'), 'utf8');

function matchingBrace(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
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
  const close = matchingBrace(dashboard, open);
  return dashboard.slice(start, close + 1);
}

function extractClickBody(marker, { afterMarker = false } = {}) {
  const markerIndex = dashboard.indexOf(marker);
  assert.notEqual(markerIndex, -1, `Dashboard marker not found: ${marker}`);
  const onClick = afterMarker
    ? dashboard.indexOf('onClick={() => {', markerIndex)
    : dashboard.lastIndexOf('onClick={() => {', markerIndex);
  assert.notEqual(onClick, -1, `Dashboard click handler not found for: ${marker}`);
  const arrow = dashboard.indexOf('=>', onClick);
  const open = dashboard.indexOf('{', arrow);
  const close = matchingBrace(dashboard, open);
  return dashboard.slice(open + 1, close);
}

function extractSourceClickBody(source, marker) {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `Source marker not found: ${marker}`);
  const onClick = source.lastIndexOf('onClick={() => {', markerIndex);
  assert.notEqual(onClick, -1, `Source click handler not found for: ${marker}`);
  const arrow = source.indexOf('=>', onClick);
  const open = source.indexOf('{', arrow);
  const close = matchingBrace(source, open);
  return source.slice(open + 1, close);
}

function extractQuoteClientSelectValueExpression() {
  const markerIndex = dashboard.indexOf('value={qClientId');
  assert.notEqual(markerIndex, -1, 'Quote Client select value prop not found');
  const open = dashboard.indexOf('{', markerIndex);
  const close = matchingBrace(dashboard, open);
  return dashboard.slice(open + 1, close);
}

function extractQuoteClientSelectChangeBody() {
  const markerIndex = dashboard.indexOf('value={qClientId');
  assert.notEqual(markerIndex, -1, 'Quote Client select marker not found');
  const onChange = dashboard.indexOf('onChange={e => {', markerIndex);
  assert.notEqual(onChange, -1, 'Quote Client select change handler not found');
  const arrow = dashboard.indexOf('=>', onChange);
  const open = dashboard.indexOf('{', arrow);
  const close = matchingBrace(dashboard, open);
  return dashboard.slice(open + 1, close);
}

function extractQuoteQuickSelectBody() {
  const markerIndex = dashboard.indexOf('setQClientName(cli.name);');
  assert.notEqual(markerIndex, -1, 'Quote Quick Select handler not found');
  const onClick = dashboard.lastIndexOf('onClick={() => {', markerIndex);
  assert.notEqual(onClick, -1, 'Quote Quick Select click handler not found');
  const arrow = dashboard.indexOf('=>', onClick);
  const open = dashboard.indexOf('{', arrow);
  const close = matchingBrace(dashboard, open);
  return dashboard.slice(open + 1, close);
}

const dashboardFunctions = {
  resetQuoteCreateState: extractConstArrow('resetQuoteCreateState'),
  resetInvoiceCreateState: extractConstArrow('resetInvoiceCreateState'),
  initCreateQuote: extractConstArrow('initCreateQuote'),
  openInvoiceBuilder: extractConstArrow('openInvoiceBuilder'),
  openInvoiceDraft: extractConstArrow('openInvoiceDraft'),
  initCreateInvoice: extractConstArrow('initCreateInvoice'),
  handleRestorePendingInvoiceDraft: extractConstArrow('handleRestorePendingInvoiceDraft'),
  handleAiQuoteGeneration: extractConstArrow('handleAiQuoteGeneration'),
  handleConvertQuoteToInvoice: extractConstArrow('handleConvertQuoteToInvoice'),
  handleCancelQuote: extractConstArrow('handleCancelQuote'),
  handleCancelInvoice: extractConstArrow('handleCancelInvoice'),
  handleExitInvoiceFlow: extractConstArrow('handleExitInvoiceFlow'),
  openDocument: extractConstArrow('openDocument'),
  handleSaveQuote: extractConstArrow('handleSaveQuote'),
  handleSaveInvoice: extractConstArrow('handleSaveInvoice'),
  editQuote: extractClickBody("openDocument({ documentType: 'quote', id: q.id })"),
  editInvoice: extractClickBody("openDocument({ documentType: 'invoice', id: inv.id })"),
  quoteClientSelectValue: extractQuoteClientSelectValueExpression(),
  quoteClientSelectChange: extractQuoteClientSelectChangeBody(),
  quoteQuickSelect: extractQuoteQuickSelectBody(),
  studioQuoteDraft: extractSourceClickBody(studioSpace, '+ Draft Quote'),
  suggestedFollowUp: extractClickBody('Option 3: Create quote/invoice follow-up', { afterMarker: true }),
};

function createDashboardHarness({ delayAccess = false, accessAllowed = true } = {}) {
  const factory = new Function('functions', 'delayAccess', 'accessAllowed', `
    let invId = '';
    let invClientId = null;
    let pendingSendRetryInvoiceId = '';
    let qId = '';
    let invNumber = '';
    let qNumber = '';
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
    let invoiceView = 'list';
    let invoiceFlowStage = 'create';
    let invoiceFlowLocked = false;
    let showPaymentWaitingBanner = false;
    let qClientName = '';
    let qClientEmail = '';
    let qClientAddress = '';
    let qClientId = null;
    let qItems = [];
    let qTaxRate = 0;
    let qDiscountRate = 0;
    let qCurrency = 'USD';
    let qNotes = '';
    let qDate = '';
    let qStatus = 'draft';
    let quoteView = 'list';
    let selectedQuotePresetId = '';
    let isFirstQuoteFlow = false;
    let qClientNameTouched = false;
    let qClientEmailTouched = false;
    let qSubmitAttempted = false;
    let canCreateFirstRevenueInvoiceDraft = false;
    let firstRevenueLoop = null;
    let suggestedActionDoc = null;
    let pendingSuggestedActionDoc = null;
    let formError = '';
    let formSuccess = '';
    let isSaving = false;
    let activeTab = 'overview';
    let pendingInvoiceDraft = null;
    let showDraftRestorePrompt = false;
    let aiParsedData = null;
    let convertedInvoice = null;
    let isParsingLead = null;
    let session = { access_token: 'access-token' };
    const invoices = [];
    const quotes = [];
    const clients = [
      { id: 'client-a', name: 'Client A', email: 'a@example.com', address: 'A address' },
      { id: 'client-b', name: 'Client B', email: 'b@example.com', address: 'B address' },
    ];
    let leads = [];
    const user = { id: 'user-1' };
    const isDemo = false;
    const isPreview = false;
    const mode = 'live';
    const previewMode = false;
    const isSandboxMode = false;
    const savedInvoices = [];
    const savedQuotes = [];
    const claims = [];
    const events = [];
    const pendingAccessDecisions = [];

    const setInvId = (value) => { invId = value; };
    const setInvClientId = (value) => { invClientId = value; };
    const setPendingSendRetryInvoiceId = (value) => { pendingSendRetryInvoiceId = value; };
    const setQId = (value) => { qId = value; };
    const setInvNumber = (value) => { invNumber = value; };
    const setQNumber = (value) => { qNumber = value; };
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
    const setInvStatus = (value) => { invStatus = value; };
    const setInvPaymentLink = (value) => { invPaymentLink = value; };
    const setInvQuoteId = (value) => { invQuoteId = value; };
    const setInvBillingType = (value) => { invBillingType = value; };
    const setInvoiceView = (value) => { invoiceView = value; };
    const setInvoiceFlowStage = (value) => { invoiceFlowStage = value; };
    const setInvoiceFlowLocked = (value) => { invoiceFlowLocked = value; };
    const setShowPaymentWaitingBanner = (value) => { showPaymentWaitingBanner = value; };
    const setQClientName = (value) => { qClientName = value; };
    const setQClientEmail = (value) => { qClientEmail = value; };
    const setQClientAddress = (value) => { qClientAddress = value; };
    const setQClientId = (value) => { qClientId = value; };
    const setQItems = (value) => { qItems = value; };
    const setQTaxRate = (value) => { qTaxRate = value; };
    const setQDiscountRate = (value) => { qDiscountRate = value; };
    const setQCurrency = (value) => { qCurrency = value; };
    const setQNotes = (value) => { qNotes = value; };
    const setQDate = (value) => { qDate = value; };
    const setQStatus = (value) => { qStatus = value; };
    const setQuoteView = (value) => { quoteView = value; };
    const setSelectedQuotePresetId = (value) => { selectedQuotePresetId = value; };
    const setIsFirstQuoteFlow = (value) => { isFirstQuoteFlow = value; };
    const setQClientNameTouched = (value) => { qClientNameTouched = value; };
    const setQClientEmailTouched = (value) => { qClientEmailTouched = value; };
    const setQSubmitAttempted = (value) => { qSubmitAttempted = value; };
    const setSuggestedActionDoc = (value) => { pendingSuggestedActionDoc = value; };
    const setFormError = (value) => { formError = value; };
    const setFormSuccess = (value) => { formSuccess = value; };
    const setIsSaving = (value) => { isSaving = value; };
    const setActiveTab = (value) => { activeTab = value; };
    const setShowDraftRestorePrompt = (value) => { showDraftRestorePrompt = value; };
    const setIsParsingLead = (value) => { isParsingLead = value; };
    const setLeads = (value) => { leads = typeof value === 'function' ? value(leads) : value; };
    const trackEvent = (name, payload = {}) => { events.push({ name, payload }); };
    const sendEvent = (name, payload = {}) => { events.push({ name, payload }); };
    const evaluateAction = (name, callback) => {
      if (delayAccess) {
        pendingAccessDecisions.push({ name, callback });
        return Promise.resolve(true);
      }
      if (!accessAllowed) return Promise.resolve(false);
      callback?.(true);
      return Promise.resolve(true);
    };
    const allowPendingAccess = () => {
      const decision = pendingAccessDecisions.shift();
      if (accessAllowed) decision?.callback?.(true);
    };
    const handleDashboardTabChange = (tab) => { activeTab = tab; };
    const triggerToast = () => {};
    const setTimeout = (callback) => { callback(); return 0; };
    const getAuthHeaders = (token) => token ? { Authorization: 'Bearer ' + token } : {};
    const fetchData = async () => {};
    const saveLead = async () => ({ success: true });
    const fetch = async (url) => url.includes('/invoice-draft')
      ? ({ ok: true, json: async () => ({ invoice: convertedInvoice }) })
      : ({ ok: true, json: async () => ({ parsed_data: aiParsedData }) });
    const generateRandomNumberString = (prefix) => prefix + '-NEW';
    const getTodayString = () => '2026-07-16';
    const getFutureDateString = () => '2026-08-15';
    const deserializeInvoiceNotes = (notes = '') => {
      if (notes && typeof notes === 'object') {
        return {
          notes: notes.notes || '',
          billing_type: notes.billing_type || 'standard',
          edit_count: 0,
          comments: [],
          files: [],
        };
      }
      const marker = '\\n\\n---METADATA---\\n';
      const markerIndex = typeof notes === 'string' ? notes.lastIndexOf(marker) : -1;
      if (markerIndex >= 0) {
        const publicNotes = notes.slice(0, markerIndex);
        const metadata = JSON.parse(notes.slice(markerIndex + marker.length));
        return {
          notes: publicNotes,
          billing_type: metadata.billing_type || 'standard',
          edit_count: metadata.edit_count || 0,
          comments: metadata.comments || [],
          files: metadata.files || [],
        };
      }
      return { notes: notes || '', billing_type: 'standard', edit_count: 0, comments: [], files: [] };
    };
    const serializeInvoiceNotes = (notes) => notes;
    const getPhotographyWorkflowTemplateById = () => null;
    const readFirstQuoteStartedAt = () => null;
    const saveInvoice = async (payload) => {
      savedInvoices.push(payload);
      return { success: true, data: { id: 'new-invoice-id' } };
    };
    const saveQuote = async (payload) => {
      savedQuotes.push(payload);
      return { success: true, data: { id: 'new-quote-id' } };
    };
    const claimAndEmitFirstActivation = async (payload) => {
      claims.push(payload);
      return true;
    };
    ${dashboardFunctions.resetQuoteCreateState}
    ${dashboardFunctions.resetInvoiceCreateState}
    ${dashboardFunctions.initCreateQuote}
    ${dashboardFunctions.openInvoiceBuilder}
    ${dashboardFunctions.openInvoiceDraft}
    ${dashboardFunctions.initCreateInvoice}
    ${dashboardFunctions.handleRestorePendingInvoiceDraft}
    ${dashboardFunctions.handleAiQuoteGeneration}
    ${dashboardFunctions.handleConvertQuoteToInvoice}
    ${dashboardFunctions.handleCancelQuote}
    ${dashboardFunctions.handleCancelInvoice}
    ${dashboardFunctions.handleExitInvoiceFlow}
    ${dashboardFunctions.openDocument}
    ${dashboardFunctions.handleSaveQuote}
    ${dashboardFunctions.handleSaveInvoice}
    const editQuote = (q) => { quotes.push(q); ${dashboardFunctions.editQuote}};
    const editInvoice = (inv) => { invoices.push(inv); ${dashboardFunctions.editInvoice}};
    const quoteClientSelectValue = new Function('qClientId', 'return ' + ${JSON.stringify(dashboardFunctions.quoteClientSelectValue)});
    const handleQuoteClientSelectChange = (e) => {${dashboardFunctions.quoteClientSelectChange}};
    const quickSelectQuoteClient = (cli) => {${dashboardFunctions.quoteQuickSelect}};
    const clickSuggestedFollowUp = () => {${dashboardFunctions.suggestedFollowUp}};

    return {
      createInvoice: initCreateInvoice,
      billClient: (client) => initCreateInvoice({
        source: 'client_bill',
        clientContext: {
          client_id: client.id,
          client_name: client.name,
          client_email: client.email,
          client_address: client.address,
        },
      }),
      allowPendingAccess,
      createQuote: initCreateQuote,
      cancelInvoice: handleCancelInvoice,
      exitInvoice: handleExitInvoiceFlow,
      cancelQuote: handleCancelQuote,
      editInvoice,
      editQuote,
      draftQuoteForClient: (client) => {${dashboardFunctions.studioQuoteDraft}},
      selectQuoteClient: (value) => handleQuoteClientSelectChange({ target: { value } }),
      quickSelectQuoteClient,
      getQuoteClientSelectValue: () => quoteClientSelectValue(qClientId),
      saveInvoice: handleSaveInvoice,
      saveQuote: handleSaveQuote,
      restorePendingInvoiceDraft: handleRestorePendingInvoiceDraft,
      generateAiQuote: handleAiQuoteGeneration,
      convertQuoteToInvoice: handleConvertQuoteToInvoice,
      clickSuggestedFollowUp,
      setSuggestedAction: (type) => { suggestedActionDoc = { type, id: 'follow-up-id', number: 'DOC-1' }; },
      setPendingInvoiceDraft: (draft) => { pendingInvoiceDraft = draft; },
      setSession: (value) => { session = value; },
      setAiParsedData: (value) => { aiParsedData = value; },
      setConvertedInvoice: (value) => { convertedInvoice = value; },
      seedInvoiceEditor: (state) => {
        invId = state.id;
        invClientId = state.clientId || null;
        invNumber = state.number || 'INV-OLD';
        invClientName = state.clientName || 'Old client';
        invClientEmail = state.clientEmail || 'old@example.com';
        invClientAddress = state.clientAddress || 'Old address';
        invItems = state.items || [{ description: 'Old item', quantity: 1, unitPrice: 10 }];
        invCurrency = state.currency || 'EUR';
        invTaxRate = state.taxRate ?? 17;
        invDiscountRate = state.discountRate ?? 9;
        invNotes = state.notes || 'Old notes';
        invDate = state.date || '2026-01-01';
        invDueDate = state.dueDate || '2026-01-31';
        invPaymentTerms = state.paymentTerms || 'Old terms';
        invStatus = state.status || 'sent';
        invPaymentLink = state.paymentLink || 'https://old.example/pay';
        invQuoteId = state.quoteId || 'old-quote-id';
        invBillingType = state.billingType || 'recurring';
        invoiceFlowStage = state.flowStage || 'send';
        invoiceFlowLocked = state.flowLocked ?? false;
      },
      seedQuoteEditor: (state) => {
        qId = state.id;
        qClientId = state.clientId ?? null;
        qNumber = state.number || 'QT-OLD';
        qClientName = state.clientName || 'Old client';
        qClientEmail = state.clientEmail || 'old@example.com';
        qClientAddress = state.clientAddress || 'Old address';
        qItems = state.items || [{ description: 'Old item', quantity: 1, unitPrice: 10 }];
        qTaxRate = state.taxRate ?? 17;
        qDiscountRate = state.discountRate ?? 9;
        qCurrency = state.currency || 'EUR';
        qNotes = state.notes || 'Old notes';
        qDate = state.date || '2026-01-01';
        qStatus = state.status || 'approved';
        selectedQuotePresetId = state.presetId || 'old-preset';
        isFirstQuoteFlow = state.firstFlow ?? true;
        qClientNameTouched = state.nameTouched ?? true;
        qClientEmailTouched = state.emailTouched ?? true;
        qSubmitAttempted = state.submitAttempted ?? true;
      },
      prepareQuoteForSave: () => {
        if (!qClientName) setQClientName('New client');
        setQItems([{ description: 'New scope', quantity: 1, unitPrice: 100 }]);
      },
      applyQuoteClientContext: (client) => {
        setQClientId(client.id);
        setQClientName(client.name || '');
        setQClientEmail(client.email || '');
        setQClientAddress(client.address || '');
      },
      getInvoice: () => ({ id: invId, clientId: invClientId, quoteId: invQuoteId, number: invNumber, clientName: invClientName, currency: invCurrency, items: invItems, taxRate: invTaxRate, discountRate: invDiscountRate, billingType: invBillingType, paymentLink: invPaymentLink, status: invStatus, view: invoiceView, stage: invoiceFlowStage, locked: invoiceFlowLocked, activeTab }),
      getQuote: () => ({ id: qId, clientId: qClientId, number: qNumber, clientName: qClientName, clientEmail: qClientEmail, clientAddress: qClientAddress, currency: qCurrency, items: qItems, taxRate: qTaxRate, discountRate: qDiscountRate, presetId: selectedQuotePresetId, firstFlow: isFirstQuoteFlow, nameTouched: qClientNameTouched, emailTouched: qClientEmailTouched, submitAttempted: qSubmitAttempted, view: quoteView, activeTab }),
      savedInvoices,
      savedQuotes,
      claims,
      events,
    };
  `);
  return factory(dashboardFunctions, delayAccess, accessAllowed);
}

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
};

async function saveCreatedInvoice(harness) {
  await harness.saveInvoice();
  await flush();
  assert.equal(harness.savedInvoices.at(-1)?.id, undefined);
  assert.equal(harness.claims.at(-1)?.documentType, 'invoice');
}

async function saveCreatedQuote(harness) {
  harness.prepareQuoteForSave();
  await harness.saveQuote();
  await flush();
  assert.equal(harness.savedQuotes.at(-1)?.id, undefined);
  assert.equal(harness.claims.at(-1)?.documentType, 'quote');
}

{
  const harness = createDashboardHarness();
  harness.createInvoice();
  await saveCreatedInvoice(harness);
}

{
  const harness = createDashboardHarness();
  harness.editInvoice({ id: 'invoice-existing', invoice_number: 'INV-OLD', client_name: 'Old client', items: [] });
  harness.createInvoice();
  assert.equal(harness.getInvoice().id, '');
  await saveCreatedInvoice(harness);
}

{
  const harness = createDashboardHarness();
  harness.editInvoice({ id: 'invoice-existing', invoice_number: 'INV-OLD', client_name: 'Old client', items: [{ description: 'Existing', quantity: 1, unit_price: 100 }] });
  assert.equal(harness.getInvoice().id, 'invoice-existing');
  await harness.saveInvoice();
  await flush();
  assert.equal(harness.savedInvoices.at(-1)?.id, 'invoice-existing');
  assert.equal(harness.claims.length, 0);
}

{
  const harness = createDashboardHarness();
  harness.editInvoice({ id: 'invoice-existing', invoice_number: 'INV-OLD', client_name: 'Old client', items: [] });
  harness.cancelInvoice();
  assert.equal(harness.getInvoice().id, 'invoice-existing');
  harness.exitInvoice();
  assert.equal(harness.getInvoice().id, 'invoice-existing');
  harness.createInvoice();
  await saveCreatedInvoice(harness);
}

{
  const harness = createDashboardHarness();
  harness.editInvoice({ id: 'invoice-existing', invoice_number: 'INV-OLD', client_name: 'Old client', items: [] });
  harness.setSuggestedAction('quote');
  harness.clickSuggestedFollowUp();
  assert.equal(harness.getInvoice().id, '', 'Create Invoice follow-up must start a fresh Invoice');
  assert.equal(harness.getInvoice().number, 'INV-NEW');
  assert.equal(harness.getInvoice().clientName, 'Acme Corporation');
  assert.deepEqual(harness.getInvoice().items, [{ description: 'Software Development & Consulting Services', quantity: 1, unitPrice: 1500 }]);
  await saveCreatedInvoice(harness);
}

{
  const harness = createDashboardHarness();
  harness.createInvoice();
  await saveCreatedInvoice(harness);
  harness.createInvoice();
  await saveCreatedInvoice(harness);
  assert.equal(harness.savedInvoices.length, 2);
}

{
  const harness = createDashboardHarness();
  harness.createQuote('quick_action');
  await saveCreatedQuote(harness);
}

{
  const harness = createDashboardHarness();
  harness.editQuote({ id: 'quote-existing', quote_number: 'QT-OLD', client_name: 'Old client', items: [{ description: 'Existing', quantity: 1, unit_price: 100 }] });
  await harness.saveQuote();
  await flush();
  assert.equal(harness.savedQuotes.at(-1)?.id, 'quote-existing');
  assert.equal(harness.claims.length, 0);
}

{
  const harness = createDashboardHarness();
  harness.editQuote({ id: 'quote-existing', quote_number: 'QT-OLD', client_name: 'Old client', items: [] });
  harness.createQuote('quick_action');
  assert.equal(harness.getQuote().id, '');
  await saveCreatedQuote(harness);
}

{
  const harness = createDashboardHarness();
  harness.editQuote({ id: 'quote-existing', quote_number: 'QT-OLD', client_name: 'Old client', items: [] });
  harness.setSuggestedAction('invoice');
  harness.clickSuggestedFollowUp();
  assert.equal(harness.getQuote().id, '', 'Quote follow-up must start a fresh Quote');
  assert.equal(harness.getQuote().number, 'QT-NEW');
  assert.equal(harness.getQuote().clientName, '');
  assert.deepEqual(harness.getQuote().items, [{ description: '', quantity: 1, unitPrice: 0 }]);
  await saveCreatedQuote(harness);
}

const specializedFailures = [];
const verifySpecializedCreate = async (name, verify) => {
  try {
    await verify();
  } catch (error) {
    specializedFailures.push(`${name}: ${error.message}`);
  }
};

await verifySpecializedCreate('Quote edit A to B to A preserves id relation pairing', async () => {
  const harness = createDashboardHarness();
  const quoteA = { id: 'quote-a', quote_number: 'QT-A', client_id: 'client-a', client_name: 'Client A', client_email: 'a@example.com', items: [] };
  const quoteB = { id: 'quote-b', quote_number: 'QT-B', client_id: 'client-b', client_name: 'Client B', client_email: 'b@example.com', items: [] };
  harness.editQuote(quoteA);
  assert.deepEqual({ id: harness.getQuote().id, clientId: harness.getQuote().clientId }, { id: quoteA.id, clientId: quoteA.client_id });
  harness.editQuote(quoteB);
  assert.deepEqual({ id: harness.getQuote().id, clientId: harness.getQuote().clientId }, { id: quoteB.id, clientId: quoteB.client_id });
  harness.editQuote(quoteA);
  assert.deepEqual({ id: harness.getQuote().id, clientId: harness.getQuote().clientId }, { id: quoteA.id, clientId: quoteA.client_id });
});

await verifySpecializedCreate('StudioSpace seeded Quote context survives delayed access A B A', async () => {
  const harness = createDashboardHarness({ delayAccess: true });
  const clientA = { id: 'client-a', name: 'Client A', email: 'a@example.com', address: 'A address' };
  const clientB = { id: 'client-b', name: 'Client B', email: 'b@example.com', address: 'B address' };

  harness.draftQuoteForClient(clientA);
  assert.equal(harness.getQuote().view, 'list', 'StudioSpace Draft Quote waits for access before opening');
  assert.equal(harness.getQuote().activeTab, 'overview', 'StudioSpace Draft Quote does not navigate before access');
  assert.equal(harness.getQuote().clientId, null, 'StudioSpace Draft Quote does not pre-apply client context');
  harness.allowPendingAccess();
  assert.deepEqual(
    { clientId: harness.getQuote().clientId, clientName: harness.getQuote().clientName, clientEmail: harness.getQuote().clientEmail, clientAddress: harness.getQuote().clientAddress },
    { clientId: clientA.id, clientName: clientA.name, clientEmail: clientA.email, clientAddress: clientA.address },
  );

  harness.cancelQuote();
  harness.draftQuoteForClient(clientB);
  assert.equal(harness.getQuote().view, 'list', 'second seeded Quote also waits for access');
  assert.equal(harness.getQuote().clientId, clientA.id, 'previous snapshot remains until the second access decision, without opening a new composer');
  harness.allowPendingAccess();
  assert.deepEqual(
    { clientId: harness.getQuote().clientId, clientName: harness.getQuote().clientName },
    { clientId: clientB.id, clientName: clientB.name },
  );

  harness.cancelQuote();
  harness.draftQuoteForClient(clientA);
  harness.allowPendingAccess();
  assert.deepEqual(
    { clientId: harness.getQuote().clientId, clientName: harness.getQuote().clientName },
    { clientId: clientA.id, clientName: clientA.name },
  );
});

await verifySpecializedCreate('StudioSpace seeded Quote saves canonical id and matching snapshot', async () => {
  const harness = createDashboardHarness({ delayAccess: true });
  const clientB = { id: 'client-b', name: 'Client B', email: 'b@example.com', address: 'B address' };
  harness.draftQuoteForClient(clientB);
  harness.allowPendingAccess();
  harness.prepareQuoteForSave();
  await harness.saveQuote();
  harness.allowPendingAccess();
  await flush();
  assert.equal(harness.savedQuotes.at(-1)?.client_id, clientB.id);
  assert.equal(harness.savedQuotes.at(-1)?.client_name, clientB.name);
  assert.equal(harness.savedQuotes.at(-1)?.client_email, clientB.email);
  assert.equal(harness.savedQuotes.at(-1)?.client_address, clientB.address);
});

await verifySpecializedCreate('StudioSpace Quote access denial leaves no context or transition', async () => {
  const harness = createDashboardHarness({ delayAccess: true, accessAllowed: false });
  harness.draftQuoteForClient({ id: 'client-a', name: 'Client A', email: 'a@example.com', address: 'A address' });
  assert.equal(harness.getQuote().view, 'list');
  assert.equal(harness.getQuote().activeTab, 'overview');
  assert.equal(harness.getQuote().clientId, null);
  assert.equal(harness.getQuote().clientName, '');
  harness.allowPendingAccess();
  assert.equal(harness.getQuote().view, 'list');
  assert.equal(harness.getQuote().activeTab, 'overview');
  assert.equal(harness.getQuote().clientId, null);
});

await verifySpecializedCreate('Generic Quote after seeded context is relation-free', async () => {
  const harness = createDashboardHarness({ delayAccess: true });
  harness.draftQuoteForClient({ id: 'client-a', name: 'Client A', email: 'a@example.com', address: 'A address' });
  harness.allowPendingAccess();
  harness.cancelQuote();
  harness.createQuote();
  harness.allowPendingAccess();
  assert.equal(harness.getQuote().clientId, null);
  harness.prepareQuoteForSave();
  await harness.saveQuote();
  harness.allowPendingAccess();
  await flush();
  assert.equal(harness.savedQuotes.at(-1)?.client_id, null);
});

await verifySpecializedCreate('Blank Quote presents the empty Client option without a null select value', async () => {
  const harness = createDashboardHarness();
  harness.createQuote();
  assert.equal(harness.getQuote().clientId, null);
  assert.equal(harness.getQuoteClientSelectValue(), '', 'canonical null is adapted to the HTML empty option');
});

await verifySpecializedCreate('Quote Client select writes canonical ids and null', async () => {
  const harness = createDashboardHarness();
  harness.createQuote();
  harness.selectQuoteClient('client-b');
  assert.equal(harness.getQuote().clientId, 'client-b');
  assert.equal(harness.getQuoteClientSelectValue(), 'client-b');
  harness.selectQuoteClient('');
  assert.equal(harness.getQuote().clientId, null);
  assert.equal(harness.getQuoteClientSelectValue(), '');
});

await verifySpecializedCreate('Quote Quick Select A to B to A keeps canonical ids and snapshots paired', async () => {
  const harness = createDashboardHarness();
  const clientA = { id: 'client-a', name: 'Client A', email: 'a@example.com', address: 'A address' };
  const clientB = { id: 'client-b', name: 'Client B', email: 'b@example.com', address: 'B address' };
  harness.createQuote();

  harness.quickSelectQuoteClient(clientA);
  assert.deepEqual(
    {
      clientId: harness.getQuote().clientId,
      clientName: harness.getQuote().clientName,
      clientEmail: harness.getQuote().clientEmail,
      clientAddress: harness.getQuote().clientAddress,
    },
    { clientId: clientA.id, clientName: clientA.name, clientEmail: clientA.email, clientAddress: clientA.address },
  );
  harness.quickSelectQuoteClient(clientB);
  assert.deepEqual(
    {
      clientId: harness.getQuote().clientId,
      clientName: harness.getQuote().clientName,
      clientEmail: harness.getQuote().clientEmail,
      clientAddress: harness.getQuote().clientAddress,
    },
    { clientId: clientB.id, clientName: clientB.name, clientEmail: clientB.email, clientAddress: clientB.address },
  );
  harness.quickSelectQuoteClient(clientA);
  assert.deepEqual(
    {
      clientId: harness.getQuote().clientId,
      clientName: harness.getQuote().clientName,
      clientEmail: harness.getQuote().clientEmail,
      clientAddress: harness.getQuote().clientAddress,
    },
    { clientId: clientA.id, clientName: clientA.name, clientEmail: clientA.email, clientAddress: clientA.address },
  );

  await saveCreatedQuote(harness);
  assert.equal(harness.savedQuotes.at(-1)?.client_id, clientA.id);
  assert.deepEqual(
    {
      name: harness.savedQuotes.at(-1)?.client_name,
      email: harness.savedQuotes.at(-1)?.client_email,
      address: harness.savedQuotes.at(-1)?.client_address,
    },
    { name: clientA.name, email: clientA.email, address: clientA.address },
  );
});

await verifySpecializedCreate('Quote Quick Select overwrites an existing relation before save', async () => {
  const harness = createDashboardHarness();
  const clientB = { id: 'client-b', name: 'Client B', email: 'b@example.com', address: 'B address' };
  harness.editQuote({ id: 'quote-a', quote_number: 'QT-A', client_id: 'client-a', client_name: 'Client A', client_email: 'a@example.com', client_address: 'A address', items: [{ description: 'Existing', quantity: 1, unitPrice: 100 }] });
  harness.quickSelectQuoteClient(clientB);
  assert.equal(harness.getQuote().clientId, clientB.id);
  assert.equal(harness.getQuote().clientName, clientB.name);
  await harness.saveQuote();
  await flush();
  assert.equal(harness.savedQuotes.at(-1)?.id, 'quote-a');
  assert.equal(harness.savedQuotes.at(-1)?.client_id, clientB.id);
  assert.equal(harness.savedQuotes.at(-1)?.client_name, clientB.name);
  assert.equal(harness.savedQuotes.at(-1)?.client_email, clientB.email);
  assert.equal(harness.savedQuotes.at(-1)?.client_address, clientB.address);
});

await verifySpecializedCreate('Quote no-linked selection saves a null client_id', async () => {
  const harness = createDashboardHarness();
  harness.createQuote();
  harness.applyQuoteClientContext({ id: 'client-b', name: 'Client B', email: 'b@example.com', address: 'B address' });
  harness.selectQuoteClient('');
  await saveCreatedQuote(harness);
  assert.equal(harness.savedQuotes.at(-1)?.client_id, null);
});

await verifySpecializedCreate('Quote edit relation selection remains deterministic across A null B null', async () => {
  const harness = createDashboardHarness();
  harness.editQuote({ id: 'quote-a', quote_number: 'QT-A', client_id: 'client-a', client_name: 'Client A', items: [] });
  assert.equal(harness.getQuoteClientSelectValue(), 'client-a');
  harness.selectQuoteClient('');
  assert.equal(harness.getQuote().clientId, null);
  assert.equal(harness.getQuoteClientSelectValue(), '');
  harness.selectQuoteClient('client-b');
  assert.equal(harness.getQuote().clientId, 'client-b');
  assert.equal(harness.getQuoteClientSelectValue(), 'client-b');
  harness.selectQuoteClient('');
  assert.equal(harness.getQuote().clientId, null);
  assert.equal(harness.getQuoteClientSelectValue(), '');
});

await verifySpecializedCreate('Quote null relation overwrites prior relation', async () => {
  const harness = createDashboardHarness();
  harness.editQuote({ id: 'quote-a', quote_number: 'QT-A', client_id: 'client-a', client_name: 'Client A', client_email: 'a@example.com', items: [] });
  harness.editQuote({ id: 'quote-c', quote_number: 'QT-C', client_id: null, client_name: 'Client C', client_email: 'c@example.com', items: [] });
  assert.equal(harness.getQuote().id, 'quote-c');
  assert.equal(harness.getQuote().clientId, null);
  assert.equal(harness.getQuoteClientSelectValue(), '', 'null relation renders the No linked Client option');
});

await verifySpecializedCreate('Blank Quote create clears prior relation', async () => {
  const harness = createDashboardHarness();
  harness.seedQuoteEditor({ id: 'quote-a', clientId: 'client-a' });
  harness.createQuote();
  assert.equal(harness.getQuote().id, '');
  assert.equal(harness.getQuote().clientId, null);
});

await verifySpecializedCreate('Client-seeded Quote context can reapply after blank reset', async () => {
  const harness = createDashboardHarness();
  harness.seedQuoteEditor({ id: 'quote-a', clientId: 'client-a' });
  harness.createQuote();
  harness.applyQuoteClientContext({ id: 'client-b', name: 'Client B', email: 'b@example.com', address: 'B address' });
  assert.equal(harness.getQuote().id, '');
  assert.equal(harness.getQuote().clientId, 'client-b');
  assert.equal(harness.getQuote().clientName, 'Client B');
});

await verifySpecializedCreate('Invoice edit A to B to A preserves id relation pairing', async () => {
  const harness = createDashboardHarness();
  const invoiceA = { id: 'invoice-a', invoice_number: 'INV-A', client_id: 'client-a', client_name: 'Client A', client_email: 'a@example.com', items: [] };
  const invoiceB = { id: 'invoice-b', invoice_number: 'INV-B', client_id: 'client-b', client_name: 'Client B', client_email: 'b@example.com', items: [] };
  harness.editInvoice(invoiceA);
  assert.deepEqual({ id: harness.getInvoice().id, clientId: harness.getInvoice().clientId }, { id: invoiceA.id, clientId: invoiceA.client_id });
  harness.editInvoice(invoiceB);
  assert.deepEqual({ id: harness.getInvoice().id, clientId: harness.getInvoice().clientId }, { id: invoiceB.id, clientId: invoiceB.client_id });
  harness.editInvoice(invoiceA);
  assert.deepEqual({ id: harness.getInvoice().id, clientId: harness.getInvoice().clientId }, { id: invoiceA.id, clientId: invoiceA.client_id });
});

await verifySpecializedCreate('Invoice null relation overwrites prior relation', async () => {
  const harness = createDashboardHarness();
  harness.editInvoice({ id: 'invoice-a', invoice_number: 'INV-A', client_id: 'client-a', client_name: 'Client A', client_email: 'a@example.com', items: [] });
  harness.editInvoice({ id: 'invoice-c', invoice_number: 'INV-C', client_id: null, client_name: 'Client C', client_email: 'c@example.com', items: [] });
  assert.equal(harness.getInvoice().id, 'invoice-c');
  assert.equal(harness.getInvoice().clientId, null);
});

await verifySpecializedCreate('Client Bill to Invoice edit does not leak relation', async () => {
  const harness = createDashboardHarness();
  harness.billClient({ id: 'client-a', name: 'Client A', email: 'a@example.com', address: 'A address' });
  harness.editInvoice({ id: 'invoice-b', invoice_number: 'INV-B', client_id: 'client-b', client_name: 'Client B', client_email: 'b@example.com', items: [] });
  assert.deepEqual({ id: harness.getInvoice().id, clientId: harness.getInvoice().clientId }, { id: 'invoice-b', clientId: 'client-b' });
});

await verifySpecializedCreate('Generic creates do not retain document relations', async () => {
  const harness = createDashboardHarness();
  harness.editInvoice({ id: 'invoice-a', invoice_number: 'INV-A', client_id: 'client-a', client_name: 'Client A', items: [] });
  harness.createInvoice();
  assert.equal(harness.getInvoice().id, '');
  assert.equal(harness.getInvoice().clientId, null);
  harness.editQuote({ id: 'quote-a', quote_number: 'QT-A', client_id: 'client-a', client_name: 'Client A', items: [] });
  harness.createQuote();
  assert.equal(harness.getQuote().id, '');
  assert.equal(harness.getQuote().clientId, null);
});

await verifySpecializedCreate('Quote cancel residual is cleared before the next create', async () => {
  const harness = createDashboardHarness();
  harness.editQuote({ id: 'quote-a', quote_number: 'QT-A', client_id: 'client-a', client_name: 'Client A', items: [] });
  harness.cancelQuote();
  assert.equal(harness.getQuote().id, 'quote-a', 'cancel leaves qId resident until the next explicit state transition');
  assert.equal(harness.getQuote().clientId, 'client-a');
  harness.createQuote();
  assert.equal(harness.getQuote().id, '');
  assert.equal(harness.getQuote().clientId, null);
});

await verifySpecializedCreate('Names and emails never establish canonical relation', async () => {
  const harness = createDashboardHarness();
  harness.editInvoice({ id: 'invoice-c', invoice_number: 'INV-C', client_id: null, client_name: 'Client C', client_email: 'c@example.com', items: [] });
  assert.equal(harness.getInvoice().clientId, null);
  harness.editQuote({ id: 'quote-c', quote_number: 'QT-C', client_id: null, client_name: 'Client C', client_email: 'c@example.com', items: [] });
  assert.equal(harness.getQuote().clientId, null);
});

await verifySpecializedCreate('Client Bill canonical context routing', async () => {
  const harness = createDashboardHarness({ delayAccess: true });
  const clientA = { id: 'client-a', name: 'Client A', email: 'a@example.com', address: 'A address' };
  const clientB = { id: 'client-b', name: 'Client B', email: 'b@example.com', address: 'B address' };

  harness.billClient(clientA);
  assert.equal(harness.getInvoice().activeTab, 'overview', 'Client Bill waits for access before changing tabs');
  assert.equal(harness.getInvoice().view, 'list', 'Client Bill does not expose the Invoice Documents list while access is pending');
  harness.allowPendingAccess();
  assert.equal(harness.getInvoice().clientId, clientA.id);
  assert.equal(harness.getInvoice().clientName, clientA.name);
  harness.saveInvoice();
  harness.allowPendingAccess();
  await flush();
  assert.equal(harness.savedInvoices.at(-1)?.client_id, clientA.id);
  assert.equal(harness.savedInvoices.at(-1)?.client_email, clientA.email);
  harness.exitInvoice();

  harness.billClient(clientB);
  harness.allowPendingAccess();
  assert.equal(harness.getInvoice().clientId, clientB.id);
  assert.equal(harness.getInvoice().clientName, clientB.name);
  harness.saveInvoice();
  harness.allowPendingAccess();
  await flush();
  assert.equal(harness.savedInvoices.at(-1)?.client_id, clientB.id);
  harness.exitInvoice();

  harness.billClient(clientA);
  harness.allowPendingAccess();
  assert.equal(harness.getInvoice().clientId, clientA.id, 'A is restored after B without stale context leakage');
  assert.equal(harness.getInvoice().clientName, clientA.name);
  harness.saveInvoice();
  harness.allowPendingAccess();
  await flush();
  assert.equal(harness.savedInvoices.at(-1)?.client_id, clientA.id);

  harness.exitInvoice();
  harness.createInvoice();
  harness.allowPendingAccess();
  assert.equal(harness.getInvoice().clientId, null, 'Generic Create Invoice does not inherit Client Bill context');
  assert.equal(harness.getInvoice().clientName, 'Acme Corporation');

  const denied = createDashboardHarness({ delayAccess: true, accessAllowed: false });
  denied.billClient(clientA);
  denied.allowPendingAccess();
  assert.equal(denied.getInvoice().view, 'list', 'Denied Client Bill does not open the composer');
  assert.equal(denied.getInvoice().activeTab, 'overview', 'Denied Client Bill does not navigate to Invoice Documents');
  assert.equal(denied.getInvoice().clientId, null, 'Denied Client Bill leaves no canonical context');
});

await verifySpecializedCreate('Pending Invoice Draft restore', async () => {
  const harness = createDashboardHarness();
  harness.seedInvoiceEditor({ id: 'old-invoice-id', quoteId: 'old-quote-id', billingType: 'recurring', paymentLink: 'https://old.example/pay' });
  harness.setPendingInvoiceDraft({
    invoice_number: 'INV-DRAFT',
    client_name: 'Draft client',
    client_email: 'draft@example.com',
    client_address: 'Draft address',
    currency: 'CAD',
    items: [{ description: 'Draft work', quantity: 1, unitPrice: 300 }],
    discount_rate: 5,
    tax_rate: 7,
    payment_terms: 'Net 14',
    invoice_date: '2026-07-01',
    due_date: '2026-07-15',
    notes: { notes: 'Draft notes' },
  });
  harness.restorePendingInvoiceDraft();
  assert.equal(harness.getInvoice().id, '');
  assert.equal(harness.getInvoice().number, 'INV-DRAFT');
  assert.equal(harness.getInvoice().quoteId, null, 'restored draft must not inherit the old Quote relation');
  assert.equal(harness.getInvoice().paymentLink, '');
  assert.equal(harness.getInvoice().billingType, 'standard');
  assert.equal(harness.getInvoice().status, 'pending');
  assert.equal(harness.getInvoice().stage, 'create');
  assert.equal(harness.getInvoice().locked, true);
  await saveCreatedInvoice(harness);
});

await verifySpecializedCreate('Pending Invoice Draft explicit billing type', async () => {
  const harness = createDashboardHarness();
  harness.seedInvoiceEditor({ id: 'old-invoice-id', quoteId: 'old-quote-id', billingType: 'standard' });
  harness.setPendingInvoiceDraft({
    invoice_number: 'INV-RECURRING-DRAFT',
    client_name: 'Recurring draft client',
    currency: 'USD',
    items: [{ description: 'Recurring draft work', quantity: 1, unitPrice: 200 }],
    notes: { notes: 'Recurring draft notes', billing_type: 'recurring' },
  });
  harness.restorePendingInvoiceDraft();
  assert.equal(harness.getInvoice().billingType, 'recurring');
});

await verifySpecializedCreate('AI Quote guest create', async () => {
  const harness = createDashboardHarness();
  harness.seedQuoteEditor({ id: 'old-quote-id', taxRate: 17, discountRate: 9, currency: 'EUR', presetId: 'old-preset', firstFlow: true, nameTouched: true, emailTouched: true, submitAttempted: true });
  harness.setSession(null);
  await harness.generateAiQuote({ id: 'lead-guest', name: 'Guest client', email: 'guest@example.com', client_address: 'Guest address', message: 'Guest project' });
  await flush();
  assert.equal(harness.getQuote().id, '');
  assert.equal(harness.getQuote().clientName, 'Guest client');
  assert.equal(harness.getQuote().items[0].description, 'Phase 1: Brand Strategy & Mockups');
  assert.equal(harness.getQuote().currency, 'USD');
  assert.equal(harness.getQuote().taxRate, 0);
  assert.equal(harness.getQuote().discountRate, 0);
  assert.equal(harness.getQuote().presetId, '');
  assert.equal(harness.getQuote().firstFlow, false);
  assert.equal(harness.getQuote().nameTouched, false);
  assert.equal(harness.getQuote().emailTouched, false);
  assert.equal(harness.getQuote().submitAttempted, false);
  harness.setSession({ access_token: 'access-token' });
  await saveCreatedQuote(harness);
});

await verifySpecializedCreate('AI Quote authenticated create', async () => {
  const harness = createDashboardHarness();
  harness.seedQuoteEditor({ id: 'old-quote-id', taxRate: 17, discountRate: 9, currency: 'EUR', presetId: 'old-preset', firstFlow: true, nameTouched: true, emailTouched: true, submitAttempted: true });
  harness.setAiParsedData({
    client_name: 'Parsed client',
    client_email: 'parsed@example.com',
    client_address: 'Parsed address',
    currency: 'AUD',
    notes: 'Parsed notes',
    items: [{ description: 'Parsed work', quantity: 2, unitPrice: 400 }],
  });
  await harness.generateAiQuote({ id: 'lead-auth', name: 'Fallback client', email: 'fallback@example.com', message: 'Authenticated project' });
  await flush();
  assert.equal(harness.getQuote().id, '');
  assert.equal(harness.getQuote().clientName, 'Parsed client');
  assert.deepEqual(harness.getQuote().items, [{ description: 'Parsed work', quantity: 2, unitPrice: 400 }]);
  assert.equal(harness.getQuote().currency, 'AUD');
  assert.equal(harness.getQuote().taxRate, 0);
  assert.equal(harness.getQuote().discountRate, 0);
  assert.equal(harness.getQuote().presetId, '');
  assert.equal(harness.getQuote().firstFlow, false);
  assert.equal(harness.getQuote().nameTouched, false);
  assert.equal(harness.getQuote().emailTouched, false);
  assert.equal(harness.getQuote().submitAttempted, false);
  await saveCreatedQuote(harness);
});

await verifySpecializedCreate('Quote to Invoice conversion', async () => {
  const harness = createDashboardHarness();
  harness.seedInvoiceEditor({ id: 'old-invoice-id', quoteId: 'unrelated-old-quote', billingType: 'recurring', paymentLink: 'https://old.example/pay' });
  harness.setConvertedInvoice({
    id: 'converted-invoice-id',
    invoice_number: 'INV-CONVERTED',
    client_name: 'Converted client',
    client_email: 'converted@example.com',
    client_address: 'Converted address',
    currency: 'GBP',
    notes: 'Converted notes',
    items: [{ description: 'Converted work', quantity: 1, unit_price: 50000 }],
    tax_rate: 12,
    discount_rate: 3,
    payment_link: '',
    client_id: 'converted-client-id',
  });
  harness.convertQuoteToInvoice({
    id: 'current-quote-id',
    status: 'approved',
    client_name: 'Converted client',
    client_email: 'converted@example.com',
    client_address: 'Converted address',
    currency: 'GBP',
    notes: 'Converted notes',
    items: [{ description: 'Converted work', quantity: 1, unit_price: 50000 }],
    tax_rate: 12,
    discount_rate: 3,
  });
  await flush();
  assert.equal(harness.getInvoice().id, 'converted-invoice-id');
  assert.equal(harness.getInvoice().quoteId, 'current-quote-id');
  assert.equal(harness.getInvoice().clientName, 'Converted client');
  assert.deepEqual(harness.getInvoice().items, [{ description: 'Converted work', quantity: 1, unitPrice: 500 }]);
  assert.equal(harness.getInvoice().currency, 'GBP');
  assert.equal(harness.getInvoice().taxRate, 12);
  assert.equal(harness.getInvoice().discountRate, 3);
  assert.equal(harness.getInvoice().paymentLink, '');
  assert.equal(harness.getInvoice().billingType, 'standard', 'server-backed quote conversion with no billing authority uses the canonical default');
  assert.equal(harness.getInvoice().clientId, 'converted-client-id');
  assert.equal(harness.getInvoice().status, 'draft', 'server-backed quote conversion opens the returned invoice as a draft');
  assert.equal(harness.getInvoice().stage, 'create');
  await harness.saveInvoice();
  await flush();
  assert.equal(harness.savedInvoices.at(-1)?.id, 'converted-invoice-id', 'saving the server-created draft remains an update');
  assert.equal(harness.claims.length, 0, 'updating the converted draft does not claim a new first Invoice');
});

await verifySpecializedCreate('Quote to Invoice conversion honors explicit billing metadata without leaking prior state', async () => {
  const harness = createDashboardHarness();
  harness.seedInvoiceEditor({ id: 'old-invoice-id', quoteId: 'unrelated-old-quote', billingType: 'standard' });
  harness.setConvertedInvoice({
    id: 'converted-invoice-id',
    invoice_number: 'INV-CONVERTED',
    client_id: 'converted-client-id',
    notes: 'Converted notes\n\n---METADATA---\n{"billing_type":"recurring"}',
    items: [{ description: 'Converted work', quantity: 1, unit_price: 50000 }],
  });
  harness.convertQuoteToInvoice({
    id: 'current-quote-id',
    status: 'approved',
    client_id: 'quote-client-id',
    client_name: 'Converted client',
    items: [{ description: 'Converted work', quantity: 1, unit_price: 50000 }],
  });
  await flush();
  assert.equal(harness.getInvoice().id, 'converted-invoice-id');
  assert.equal(harness.getInvoice().quoteId, 'current-quote-id');
  assert.equal(harness.getInvoice().clientId, 'converted-client-id');
  assert.equal(harness.getInvoice().billingType, 'recurring');
});

if (specializedFailures.length > 0) {
  throw new Error(`Specialized create-state failures:\n${specializedFailures.join('\n')}`);
}

console.log('Dashboard create/edit state runtime tests passed.');
