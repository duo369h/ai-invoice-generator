import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dashboard = await readFile(resolve(root, 'src/components/dashboard/Dashboard.js'), 'utf8');

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

const dashboardFunctions = {
  resetQuoteCreateState: extractConstArrow('resetQuoteCreateState'),
  resetInvoiceCreateState: extractConstArrow('resetInvoiceCreateState'),
  initCreateQuote: extractConstArrow('initCreateQuote'),
  openInvoiceBuilder: extractConstArrow('openInvoiceBuilder'),
  initCreateInvoice: extractConstArrow('initCreateInvoice'),
  handleRestorePendingInvoiceDraft: extractConstArrow('handleRestorePendingInvoiceDraft'),
  handleAiQuoteGeneration: extractConstArrow('handleAiQuoteGeneration'),
  handleConvertQuoteToInvoice: extractConstArrow('handleConvertQuoteToInvoice'),
  handleCancelQuote: extractConstArrow('handleCancelQuote'),
  handleCancelInvoice: extractConstArrow('handleCancelInvoice'),
  handleExitInvoiceFlow: extractConstArrow('handleExitInvoiceFlow'),
  handleSaveQuote: extractConstArrow('handleSaveQuote'),
  handleSaveInvoice: extractConstArrow('handleSaveInvoice'),
  editQuote: extractClickBody('setQId(q.id);'),
  editInvoice: extractClickBody('setInvId(inv.id);'),
  suggestedFollowUp: extractClickBody('Option 3: Create quote/invoice follow-up', { afterMarker: true }),
};

function createDashboardHarness() {
  const factory = new Function('functions', `
    let invId = '';
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
    let suggestedActionDoc = null;
    let pendingSuggestedActionDoc = null;
    let formError = '';
    let formSuccess = '';
    let isSaving = false;
    let activeTab = 'overview';
    let pendingInvoiceDraft = null;
    let showDraftRestorePrompt = false;
    let aiParsedData = null;
    let isParsingLead = null;
    let session = { access_token: 'access-token' };
    const invoices = [];
    const quotes = [];
    let leads = [];
    const user = { id: 'user-1' };
    const isDemo = false;
    const isPreview = false;
    const previewMode = false;
    const isSandboxMode = false;
    const savedInvoices = [];
    const savedQuotes = [];
    const claims = [];
    const events = [];

    const setInvId = (value) => { invId = value; };
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
    const evaluateAction = (_name, callback) => callback?.();
    const handleDashboardTabChange = (tab) => { activeTab = tab; };
    const triggerToast = () => {};
    const setTimeout = (callback) => { callback(); return 0; };
    const getAuthHeaders = (token) => token ? { Authorization: 'Bearer ' + token } : {};
    const fetchData = async () => {};
    const saveLead = async () => ({ success: true });
    const fetch = async () => ({ ok: true, json: async () => ({ parsed_data: aiParsedData }) });
    const generateRandomNumberString = (prefix) => prefix + '-NEW';
    const getTodayString = () => '2026-07-16';
    const getFutureDateString = () => '2026-08-15';
    const deserializeInvoiceNotes = (notes = '') => ({
      notes: typeof notes === 'string' ? notes : notes?.notes || '',
      billing_type: typeof notes === 'object' && notes?.billing_type ? notes.billing_type : 'standard',
      edit_count: 0,
      comments: [],
      files: [],
    });
    const serializeInvoiceNotes = (notes) => notes;
    const getPhotographyQuotePresetById = () => null;
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
    ${dashboardFunctions.initCreateInvoice}
    ${dashboardFunctions.handleRestorePendingInvoiceDraft}
    ${dashboardFunctions.handleAiQuoteGeneration}
    ${dashboardFunctions.handleConvertQuoteToInvoice}
    ${dashboardFunctions.handleCancelQuote}
    ${dashboardFunctions.handleCancelInvoice}
    ${dashboardFunctions.handleExitInvoiceFlow}
    ${dashboardFunctions.handleSaveQuote}
    ${dashboardFunctions.handleSaveInvoice}
    const editQuote = (q) => {${dashboardFunctions.editQuote}};
    const editInvoice = (inv) => {${dashboardFunctions.editInvoice}};
    const clickSuggestedFollowUp = () => {${dashboardFunctions.suggestedFollowUp}};

    return {
      createInvoice: initCreateInvoice,
      createQuote: initCreateQuote,
      cancelInvoice: handleCancelInvoice,
      exitInvoice: handleExitInvoiceFlow,
      cancelQuote: handleCancelQuote,
      editInvoice,
      editQuote,
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
      seedInvoiceEditor: (state) => {
        invId = state.id;
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
        setQClientName('New client');
        setQItems([{ description: 'New scope', quantity: 1, unitPrice: 100 }]);
      },
      getInvoice: () => ({ id: invId, quoteId: invQuoteId, number: invNumber, clientName: invClientName, currency: invCurrency, items: invItems, taxRate: invTaxRate, discountRate: invDiscountRate, billingType: invBillingType, paymentLink: invPaymentLink, status: invStatus, view: invoiceView, stage: invoiceFlowStage, locked: invoiceFlowLocked, activeTab }),
      getQuote: () => ({ id: qId, number: qNumber, clientName: qClientName, clientEmail: qClientEmail, currency: qCurrency, items: qItems, taxRate: qTaxRate, discountRate: qDiscountRate, presetId: selectedQuotePresetId, firstFlow: isFirstQuoteFlow, nameTouched: qClientNameTouched, emailTouched: qClientEmailTouched, submitAttempted: qSubmitAttempted, view: quoteView, activeTab }),
      savedInvoices,
      savedQuotes,
      claims,
      events,
    };
  `);
  return factory(dashboardFunctions);
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
  harness.convertQuoteToInvoice({
    id: 'current-quote-id',
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
  assert.equal(harness.getInvoice().id, '');
  assert.equal(harness.getInvoice().quoteId, 'current-quote-id');
  assert.equal(harness.getInvoice().clientName, 'Converted client');
  assert.deepEqual(harness.getInvoice().items, [{ description: 'Converted work', quantity: 1, unitPrice: 500 }]);
  assert.equal(harness.getInvoice().currency, 'GBP');
  assert.equal(harness.getInvoice().taxRate, 12);
  assert.equal(harness.getInvoice().discountRate, 3);
  assert.equal(harness.getInvoice().paymentLink, '');
  assert.equal(harness.getInvoice().billingType, 'standard');
  assert.equal(harness.getInvoice().status, 'pending');
  assert.equal(harness.getInvoice().stage, 'create');
  await saveCreatedInvoice(harness);
});

if (specializedFailures.length > 0) {
  throw new Error(`Specialized create-state failures:\n${specializedFailures.join('\n')}`);
}

console.log('Dashboard create/edit state runtime tests passed.');
