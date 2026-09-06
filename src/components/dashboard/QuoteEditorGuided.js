import { useState } from 'react';
import {
  getPhotographyWorkflowFieldImportance,
  PHOTOGRAPHY_TEMPLATE_FIELD_IMPORTANCE,
} from '../../core/quotes/photographyWorkflowTemplates';
import { useQuoteEditorShared } from './QuoteEditorSharedContext';

const PRIMARY_WORKFLOWS = [
  ['commercial-shoot', 'Commercial'],
  ['wedding-shoot', 'Wedding'],
  ['portrait-session', 'Portrait'],
  ['event-photography', 'Event'],
];

const SCOPE_FIELDS = [
  { field: 'shoot_type', label: 'Shoot type', kind: 'text', group: 'shoot' },
  { field: 'shoot_date', label: 'Shoot date', kind: 'date', group: 'shoot' },
  { field: 'shoot_duration', label: 'Shoot duration (minutes)', kind: 'number', group: 'shoot' },
  { field: 'primary_location', label: 'Primary location', kind: 'text', group: 'shoot' },
  { field: 'coverage_expectation', label: 'Coverage expectation', kind: 'text', group: 'shoot' },
  { field: 'deliverables', label: 'Deliverables', kind: 'list', group: 'deliverables' },
  { field: 'final_image_count', label: 'Final image count', kind: 'number', group: 'deliverables' },
  { field: 'retouched_image_count', label: 'Retouched image count', kind: 'number', group: 'deliverables' },
  { field: 'delivery_format', label: 'Delivery format', kind: 'list', group: 'deliverables' },
  { field: 'delivery_deadline', label: 'Delivery deadline', kind: 'date', group: 'deliverables' },
  { field: 'exclusions', label: 'Exclusions', kind: 'list', group: 'boundaries' },
  { field: 'assumptions', label: 'Assumptions', kind: 'list', group: 'boundaries' },
];

const labelForWorkflow = (template) => (template.id === 'food-photography' ? 'Food & Beverage' : template.label);
const fieldDefinition = (field) => SCOPE_FIELDS.find((definition) => definition.field === field);
const scopeValueLabel = (value, kind) => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Not set';
  if (value === null || value === undefined || value === '') return 'Not set';
  return kind === 'number' ? String(value) : value;
};
const COMPLETE_DATE_DRAFT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const formatDateDraftInput = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};
const PRICING_CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP', 'CNY'];
const USAGE_RIGHTS_STATUSES = [
  ['unspecified', 'Not specified'],
  ['specified', 'Specified'],
  ['not_applicable', 'Not applicable'],
];
const numericDraftPattern = /^-?(?:\d+\.?\d*|\.\d+)$/;
const displayNumericDraft = (value) => String(value ?? 0);
const parseNumericDraft = (value) => {
  if (value === '' || value === '-' || value === '.' || value === '-.') return null;
  if (!numericDraftPattern.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function QuoteEditorGuided({ compatibilityPresentation }) {
  const [mobileQuoteStep, setMobileQuoteStep] = useState('WORKFLOW');
  const [scopeOpenBlock, setScopeOpenBlock] = useState(null);
  const [dateDrafts, setDateDrafts] = useState({});
  const [pricingOpenItem, setPricingOpenItem] = useState(null);
  const [pricingOpenAdjustments, setPricingOpenAdjustments] = useState(false);
  const [pricingDrafts, setPricingDrafts] = useState({});
  const [termsUsageOpenSurface, setTermsUsageOpenSurface] = useState(null);
  const [usageDrafts, setUsageDrafts] = useState({});
  const { quote, setters, validation, workflow, derived, scope } = useQuoteEditorShared();
  const templates = workflow.templates || [];
  const additionalTemplates = templates.filter(({ id }) => !PRIMARY_WORKFLOWS.some(([primaryId]) => primaryId === id));
  const availableClients = quote.availableClients || [];
  const clientName = quote.qClientName || '';
  const clientEmail = quote.qClientEmail || '';
  const clientAddress = quote.qClientAddress || '';
  const clientValidation = validation.validateClient({ name: clientName, email: clientEmail });
  const showClientNameError = (validation.submitAttempted || validation.clientNameTouched) && clientValidation.nameInvalid;
  const showClientEmailError = (validation.submitAttempted || validation.clientEmailTouched) && clientValidation.emailInvalid;
  const selectedTemplate = templates.find(({ id }) => id === workflow.selectedQuotePresetId);
  const scopeCommon = quote.qPhotographyScope?.common || {};
  const scopePriority = (field) => getPhotographyWorkflowFieldImportance(workflow.selectedQuotePresetId, field);
  const orderedScopeFields = [
    ...(selectedTemplate?.scopeEmphasis || []),
    ...SCOPE_FIELDS.map(({ field }) => field),
  ].filter((field, index, fields) => fields.indexOf(field) === index).map(fieldDefinition).filter(Boolean);
  const primaryScopeFields = selectedTemplate
    ? orderedScopeFields.filter(({ field }) => scopePriority(field) === PHOTOGRAPHY_TEMPLATE_FIELD_IMPORTANCE.CORE)
    : [];
  const blankPrimaryFields = orderedScopeFields.filter(({ field }) => ['shoot_type', 'coverage_expectation', 'deliverables'].includes(field));
  const blankSecondaryFields = orderedScopeFields.filter(({ field }) => (
    !blankPrimaryFields.some(({ field: primaryField }) => primaryField === field) && !field.startsWith('usage_rights.')
  ));
  const recommendedScopeFields = orderedScopeFields.filter(({ field }) => scopePriority(field) === PHOTOGRAPHY_TEMPLATE_FIELD_IMPORTANCE.RECOMMENDED);
  const optionalScopeFields = orderedScopeFields.filter(({ field }) => scopePriority(field) === PHOTOGRAPHY_TEMPLATE_FIELD_IMPORTANCE.OPTIONAL);
  const scopePrimaryFields = selectedTemplate ? primaryScopeFields : blankPrimaryFields;
  const visibleShootFields = scopePrimaryFields.filter(({ group }) => group === 'shoot');
  const visibleDeliverableFields = scopePrimaryFields.filter(({ group }) => group === 'deliverables');
  const qItems = quote.qItems || [];
  const qCurrency = quote.qCurrency || 'USD';
  const qDiscountRate = quote.qDiscountRate ?? 0;
  const qTaxRate = quote.qTaxRate ?? 0;
  const totals = derived.totals;
  const formatMoney = derived.formatMoney;
  const qNotes = quote.qNotes || '';
  const usageRights = scopeCommon.usage_rights || {};
  const usageStatus = usageRights.status || 'unspecified';
  const usagePriority = selectedTemplate ? scopePriority('usage_rights.purpose') : 'NEUTRAL';
  const usageStatusLabel = USAGE_RIGHTS_STATUSES.find(([status]) => status === usageStatus)?.[1] || 'Not specified';
  const usageSummary = [usageRights.purpose, usageRights.territory, usageRights.license_duration].filter(Boolean).join(' · ') || (usageStatus === 'not_applicable' ? 'Licensing does not apply' : 'Add the usage context for this Quote');
  const termsSummary = qNotes.trim() || 'Add short terms or client-facing notes';

  const handleClientSelection = (event) => {
    const nextId = event.target.value || null;
    setters.setQuoteClientId(nextId);
    const selectedClient = availableClients.find(({ id }) => id === nextId);
    if (selectedClient) {
      setters.setQuoteClientName(selectedClient.name || '');
      setters.setQuoteClientEmail(selectedClient.email || '');
      setters.setQuoteClientAddress(selectedClient.address || '');
    }
  };
  const handleClientContinue = () => {
    validation.setQuoteClientNameTouched(true);
    validation.setQuoteClientEmailTouched(true);
    if (!clientValidation.isValid) return;
    setMobileQuoteStep('SCOPE');
  };
  const toggleScopeBlock = (block) => {
    setDateDrafts({});
    setScopeOpenBlock((current) => (current === block ? null : block));
  };
  const leaveScopeStep = (nextStep) => {
    setDateDrafts({});
    setMobileQuoteStep(nextStep);
  };
  const commitDateDraft = (field, draft) => {
    setDateDrafts((current) => {
      if (!Object.prototype.hasOwnProperty.call(current, field)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (draft === '') {
      scope.updateField(field, '');
    } else if (COMPLETE_DATE_DRAFT_PATTERN.test(draft)) {
      scope.updateField(field, draft);
    }
  };

  const setPricingDraft = (key, value) => setPricingDrafts((current) => ({ ...current, [key]: value }));
  const updatePricingNumber = (index, field, value) => {
    setPricingDraft(`${index}.${field}`, value);
    const parsed = parseNumericDraft(value);
    if (parsed === null && value !== '') return;
    const nextItems = qItems.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value === '' ? 0 : parsed } : item);
    setters.setQuoteItems(nextItems);
  };
  const updatePricingDescription = (index, value) => {
    setters.setQuoteItems(qItems.map((item, itemIndex) => itemIndex === index ? { ...item, description: value } : item));
  };
  const openPricingItem = (index) => {
    const item = qItems[index];
    if (!item) return;
    setPricingOpenAdjustments(false);
    setPricingOpenItem(index);
    setPricingDraft(`${index}.description`, item.description || '');
    setPricingDraft(`${index}.quantity`, displayNumericDraft(item.quantity));
    setPricingDraft(`${index}.unitPrice`, displayNumericDraft(item.unitPrice));
  };
  const addPricingItem = () => {
    const nextIndex = qItems.length;
    setters.setQuoteItems([...qItems, { description: '', quantity: 1, unitPrice: 0 }]);
    setPricingOpenAdjustments(false);
    setPricingOpenItem(nextIndex);
    setPricingDraft(`${nextIndex}.quantity`, '1');
    setPricingDraft(`${nextIndex}.unitPrice`, '0');
  };
  const removePricingItem = (index) => {
    if (qItems.length <= 1) return;
    setters.setQuoteItems(qItems.filter((_, itemIndex) => itemIndex !== index));
    setPricingOpenItem(null);
    setPricingOpenAdjustments(false);
    setPricingDrafts({});
  };
  const updateAdjustment = (field, value) => {
    setPricingDraft(`adjustment.${field}`, value);
    const parsed = parseNumericDraft(value);
    if (parsed === null && value !== '') return;
    const setter = field === 'discount' ? setters.setQuoteDiscountRate : setters.setQuoteTaxRate;
    setter(value === '' ? 0 : parsed);
  };
  const togglePricingAdjustments = () => {
    const nextOpen = !pricingOpenAdjustments;
    setPricingOpenAdjustments(nextOpen);
    if (nextOpen) setPricingOpenItem(null);
    setPricingDraft('adjustment.discount', displayNumericDraft(qDiscountRate));
    setPricingDraft('adjustment.tax', displayNumericDraft(qTaxRate));
  };
  const pricingDraftValue = (key, value) => Object.prototype.hasOwnProperty.call(pricingDrafts, key) ? pricingDrafts[key] : displayNumericDraft(value);
  const openTermsUsageSurface = (surface) => {
    setTermsUsageOpenSurface((current) => current === surface ? null : surface);
    setUsageDrafts(surface === 'USAGE' ? {
      purpose: usageRights.purpose || '',
      media_channels: (usageRights.media_channels || []).join('\n'),
      territory: usageRights.territory || '',
      license_duration: usageRights.license_duration || '',
      exclusivity: usageRights.exclusivity || '',
    } : {});
  };
  const usageDraftValue = (field, value) => Object.prototype.hasOwnProperty.call(usageDrafts, field) ? usageDrafts[field] : (value || '');
  const updateUsageText = (field, value) => {
    setUsageDrafts((current) => ({ ...current, [field]: value }));
    scope.updateField(`usage_rights.${field}`, field === 'media_channels' ? value.split(/\r?\n/) : value);
  };
  const updateUsageStatus = (status) => {
    scope.setUsageRightsStatus(status);
    if (status === 'specified' && usageStatus === 'not_applicable') setUsageDrafts({});
  };

  const renderScopeField = (definition) => {
    const { field, label, kind } = definition;
    const value = scopeCommon[field];
    const prompt = selectedTemplate?.fieldPromptOverrides?.[field] || label;
    const example = selectedTemplate?.fieldExamples?.[field];
    const inputId = `quote-guided-scope-${field}`;
    const hasDateDraft = kind === 'date' && Object.prototype.hasOwnProperty.call(dateDrafts, field);
    const commonProps = {
      id: inputId,
      'data-testid': inputId,
      'data-scope-field-priority': selectedTemplate ? scopePriority(field) : 'NEUTRAL',
      className: kind === 'list' ? 'form-textarea' : 'form-input',
      value: kind === 'list' ? (value || []).join('\n') : (hasDateDraft ? dateDrafts[field] : (value ?? '')),
      onChange: (event) => {
        if (kind === 'date') {
          const nextDraft = formatDateDraftInput(event.target.value);
          setDateDrafts((current) => ({ ...current, [field]: nextDraft }));
          if (nextDraft === '') scope.updateField(field, '');
          return;
        }
        scope.updateField(field, kind === 'list' ? event.target.value.split(/\r?\n/).filter((entry) => entry.trim()) : event.target.value);
      },
      onBlur: kind === 'date' ? (event) => commitDateDraft(field, event.currentTarget.value) : undefined,
      placeholder: kind === 'date' ? 'YYYY-MM-DD' : (example || `Add ${prompt.toLowerCase()}`),
      inputMode: kind === 'date' ? 'numeric' : undefined,
      pattern: kind === 'date' ? '\\d{4}-\\d{2}-\\d{2}' : undefined,
      maxLength: kind === 'date' ? 10 : undefined,
      'data-guided-date-entry': kind === 'date' ? 'english' : undefined,
    };
    return (
      <div className="quote-guided-scope-field" key={field}>
        <label htmlFor={inputId}>{prompt}</label>
        {kind === 'list' ? <textarea {...commonProps} rows={3} /> : <input {...commonProps} type={kind === 'date' ? 'text' : kind} min={kind === 'number' ? 0 : undefined} />}
        {example && <span className="quote-guided-scope-hint">Example: {example.replace(/\n/g, ' · ')}</span>}
      </div>
    );
  };
  const renderScopeFields = (fields) => <div className="quote-guided-scope-edit-grid">{fields.map(renderScopeField)}</div>;

  if (mobileQuoteStep === 'PRICING') {
    return (
      <section className="quote-guided-shell quote-guided-pricing-step" data-testid="quote-guided-pricing-step" data-guided-step="PRICING" aria-labelledby="quote-guided-pricing-heading">
        <header className="quote-guided-header">
          <div><span className="quote-guided-kicker">Pricing</span><h2 id="quote-guided-pricing-heading">Set your price</h2><p>Describe the charge, choose the currency, and let Corvioz calculate the total.</p></div>
          <span className="quote-guided-progress" aria-label="Current step: Pricing">Pricing</span>
        </header>

        <div className="quote-guided-pricing-currency-row">
          <div><span className="quote-guided-pricing-label">Quote currency</span><strong data-testid="quote-guided-pricing-currency-code">{qCurrency}</strong></div>
          <select data-testid="quote-guided-pricing-currency" className="form-select" value={qCurrency} onChange={(event) => setters.setQuoteCurrency(event.target.value)} aria-label="Quote currency">
            {PRICING_CURRENCIES.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
            {!PRICING_CURRENCIES.includes(qCurrency) && <option value={qCurrency}>{qCurrency}</option>}
          </select>
        </div>

        <div className="quote-guided-pricing-items" data-testid="quote-guided-pricing-items">
          {qItems.map((item, index) => {
            const isOpen = pricingOpenItem === index;
            const lineTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);
            return (
              <div className={`quote-guided-pricing-item${isOpen ? ' is-open' : ''}`} key={index} data-testid={`quote-guided-pricing-item-${index}`}>
                <div className="quote-guided-pricing-item-summary-row">
                  <button type="button" className="quote-guided-pricing-item-summary" aria-expanded={isOpen} onClick={() => openPricingItem(index)}>
                    <span><strong>{item.description?.trim() || 'Untitled item'}</strong><small>{displayNumericDraft(item.quantity)} × {formatMoney(item.unitPrice, qCurrency)}</small></span>
                    <strong>{formatMoney(lineTotal, qCurrency)}</strong>
                  </button>
                  <button type="button" className="quote-guided-pricing-remove-item" data-testid={`quote-guided-pricing-remove-item-${index}`} onClick={() => removePricingItem(index)} disabled={qItems.length <= 1} aria-label={`Remove ${item.description?.trim() || 'line item'}`}>×</button>
                </div>
                {isOpen && <div className="quote-guided-pricing-edit-block" data-pricing-edit-block="true" data-testid={`quote-guided-pricing-edit-${index}`}>
                  <div className="quote-guided-pricing-field"><label htmlFor={`quote-guided-pricing-description-${index}`}>Description</label><input id={`quote-guided-pricing-description-${index}`} data-testid={`quote-guided-pricing-description-${index}`} className="form-input" type="text" value={pricingDraftValue(`${index}.description`, item.description || '')} onChange={(event) => { setPricingDraft(`${index}.description`, event.target.value); updatePricingDescription(index, event.target.value); }} placeholder="e.g. Portrait session" /></div>
                  <div className="quote-guided-pricing-field"><label htmlFor={`quote-guided-pricing-quantity-${index}`}>Quantity</label><input id={`quote-guided-pricing-quantity-${index}`} data-testid={`quote-guided-pricing-quantity-${index}`} className="form-input" type="text" inputMode="decimal" value={pricingDraftValue(`${index}.quantity`, item.quantity)} onChange={(event) => updatePricingNumber(index, 'quantity', event.target.value)} /></div>
                  <div className="quote-guided-pricing-field"><label htmlFor={`quote-guided-pricing-rate-${index}`}>Rate</label><input id={`quote-guided-pricing-rate-${index}`} data-testid={`quote-guided-pricing-rate-${index}`} className="form-input" type="text" inputMode="decimal" value={pricingDraftValue(`${index}.unitPrice`, item.unitPrice)} onChange={(event) => updatePricingNumber(index, 'unitPrice', event.target.value)} /></div>
                </div>}
              </div>
            );
          })}
        </div>

        <button type="button" className="quote-guided-pricing-add-item" data-testid="quote-guided-pricing-add-item" onClick={addPricingItem}>+ Add item</button>

        <div className="quote-guided-pricing-adjustments" data-testid="quote-guided-pricing-adjustments">
          <button type="button" className="quote-guided-pricing-adjustments-toggle" data-testid="quote-guided-pricing-adjustments-toggle" aria-expanded={pricingOpenAdjustments} onClick={togglePricingAdjustments}>Adjustments <span>{pricingOpenAdjustments ? '−' : '+'}</span></button>
          {pricingOpenAdjustments && <div className="quote-guided-pricing-adjustments-panel" data-pricing-edit-block="true" data-testid="quote-guided-pricing-adjustments-panel">
            <div className="quote-guided-pricing-field"><label htmlFor="quote-guided-pricing-discount">Discount (%)</label><input id="quote-guided-pricing-discount" data-testid="quote-guided-pricing-discount" className="form-input" type="text" inputMode="decimal" value={pricingDraftValue('adjustment.discount', qDiscountRate)} onChange={(event) => updateAdjustment('discount', event.target.value)} /></div>
            <div className="quote-guided-pricing-field"><label htmlFor="quote-guided-pricing-tax">Tax (%)</label><input id="quote-guided-pricing-tax" data-testid="quote-guided-pricing-tax" className="form-input" type="text" inputMode="decimal" value={pricingDraftValue('adjustment.tax', qTaxRate)} onChange={(event) => updateAdjustment('tax', event.target.value)} /></div>
          </div>}
        </div>

        <div className="quote-guided-pricing-totals" data-testid="quote-guided-pricing-totals">
          <div><span>Subtotal</span><strong>{formatMoney(totals.subtotal, qCurrency)}</strong></div>
          {qDiscountRate > 0 && <div><span>Discount ({qDiscountRate}%)</span><strong>−{formatMoney(totals.discount, qCurrency)}</strong></div>}
          {qTaxRate > 0 && <div><span>Tax ({qTaxRate}%)</span><strong>{formatMoney(totals.tax, qCurrency)}</strong></div>}
          <div className="quote-guided-pricing-total"><span>Total</span><strong data-testid="quote-guided-pricing-total-value">{formatMoney(totals.total, qCurrency)}</strong></div>
        </div>

        <div className="quote-guided-client-actions quote-guided-pricing-actions"><button type="button" className="btn btn-secondary quote-guided-step-back" onClick={() => setMobileQuoteStep('SCOPE')}>Back</button><button type="button" className="btn btn-primary quote-guided-continue" onClick={() => setMobileQuoteStep('TERMS_USAGE')}>Continue</button></div>
      </section>
    );
  }

  if (mobileQuoteStep === 'TERMS_USAGE') {
    const usageOpen = termsUsageOpenSurface === 'USAGE';
    const termsOpen = termsUsageOpenSurface === 'TERMS';
    return (
      <section className="quote-guided-shell quote-guided-terms-usage-step" data-testid="quote-guided-terms-usage-step" data-guided-step="TERMS_USAGE" aria-labelledby="quote-guided-terms-usage-heading">
        <header className="quote-guided-header">
          <div><span className="quote-guided-kicker">Terms / Usage</span><h2 id="quote-guided-terms-usage-heading">Clarify the handoff</h2><p>Keep Usage Rights and short Quote language clear without turning this into a contract.</p></div>
          <span className="quote-guided-progress" aria-label="Current step: Terms / Usage">Terms / Usage</span>
        </header>

        <div className="quote-guided-terms-usage-priority"><span>Usage licensing</span><strong data-testid="quote-guided-terms-usage-priority">{usagePriority}</strong></div>
        <div className={`quote-guided-terms-usage-card${usageOpen ? ' is-open' : ''}`} data-testid="quote-guided-terms-usage-usage-card">
          <button type="button" className="quote-guided-terms-usage-summary" data-testid="quote-guided-terms-usage-usage-summary" aria-expanded={usageOpen} onClick={() => openTermsUsageSurface('USAGE')}>
            <span><strong>Usage licensing</strong><small><span data-testid="quote-guided-terms-usage-usage-status">{usageStatusLabel}</span> · {usageSummary}</small></span><span aria-hidden="true">{usageOpen ? '−' : '+'}</span>
          </button>
          {usageOpen && <div className="quote-guided-terms-usage-edit" data-terms-usage-edit-block="true" data-testid="quote-guided-terms-usage-edit">
            <div className="quote-guided-terms-usage-edit-heading"><strong>Usage details</strong><span>Photographer-authored</span></div>
            <div className="quote-guided-terms-usage-field"><label htmlFor="quote-guided-usage-status">Usage status</label><select id="quote-guided-usage-status" data-testid="quote-guided-usage-status" className="form-select" value={usageStatus} onChange={(event) => updateUsageStatus(event.target.value)}>{USAGE_RIGHTS_STATUSES.map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></div>
            {usageStatus !== 'not_applicable' && <div className="quote-guided-terms-usage-grid">
              <div className="quote-guided-terms-usage-field"><label htmlFor="quote-guided-usage-purpose">Purpose</label><input id="quote-guided-usage-purpose" data-testid="quote-guided-usage-purpose" className="form-input" value={usageDraftValue('purpose', usageRights.purpose)} onChange={(event) => updateUsageText('purpose', event.target.value)} placeholder="e.g. Brand campaign" /></div>
              <div className="quote-guided-terms-usage-field"><label htmlFor="quote-guided-usage-media-channels">Media / channels</label><textarea id="quote-guided-usage-media-channels" data-testid="quote-guided-usage-media-channels" className="form-textarea" value={usageDraftValue('media_channels', (usageRights.media_channels || []).join('\n'))} onChange={(event) => updateUsageText('media_channels', event.target.value)} placeholder="Website\nPaid social\nPrint" rows={3} /></div>
              <div className="quote-guided-terms-usage-field"><label htmlFor="quote-guided-usage-territory">Territory</label><input id="quote-guided-usage-territory" data-testid="quote-guided-usage-territory" className="form-input" value={usageDraftValue('territory', usageRights.territory)} onChange={(event) => updateUsageText('territory', event.target.value)} placeholder="e.g. North America" /></div>
              <div className="quote-guided-terms-usage-field"><label htmlFor="quote-guided-usage-license-duration">License duration</label><input id="quote-guided-usage-license-duration" data-testid="quote-guided-usage-license-duration" className="form-input" value={usageDraftValue('license_duration', usageRights.license_duration)} onChange={(event) => updateUsageText('license_duration', event.target.value)} placeholder="e.g. 12 months" /></div>
              <div className="quote-guided-terms-usage-field"><label htmlFor="quote-guided-usage-exclusivity">Exclusivity</label><input id="quote-guided-usage-exclusivity" data-testid="quote-guided-usage-exclusivity" className="form-input" value={usageDraftValue('exclusivity', usageRights.exclusivity)} onChange={(event) => updateUsageText('exclusivity', event.target.value)} placeholder="e.g. Non-exclusive" /></div>
            </div>}
          </div>}
        </div>

        <div className={`quote-guided-terms-usage-card${termsOpen ? ' is-open' : ''}`} data-testid="quote-guided-terms-usage-terms-card">
          <button type="button" className="quote-guided-terms-usage-summary" data-testid="quote-guided-terms-usage-terms-summary" aria-expanded={termsOpen} onClick={() => openTermsUsageSurface('TERMS')}>
            <span><strong>Terms &amp; notes</strong><small>{termsSummary}</small></span><span aria-hidden="true">{termsOpen ? '−' : '+'}</span>
          </button>
          {termsOpen && <div className="quote-guided-terms-usage-edit" data-terms-usage-edit-block="true" data-testid="quote-guided-terms-edit">
            <div className="quote-guided-terms-usage-edit-heading"><strong>Short Quote language</strong><span>Public notes</span></div>
            <div className="quote-guided-terms-usage-field"><label htmlFor="quote-guided-terms-notes">Terms &amp; notes</label><textarea id="quote-guided-terms-notes" data-testid="quote-guided-terms-notes" className="form-textarea" value={qNotes} onChange={(event) => setters.setQuoteNotes(event.target.value)} placeholder="Add short terms or client-facing notes" rows={5} /></div>
          </div>}
        </div>

        <div className="quote-guided-client-actions quote-guided-terms-usage-actions"><button type="button" className="btn btn-secondary quote-guided-step-back" onClick={() => setMobileQuoteStep('PRICING')}>Back</button><button type="button" className="btn btn-primary quote-guided-continue" onClick={() => setMobileQuoteStep('COMPATIBILITY_DETAILS')}>Continue</button></div>
      </section>
    );
  }

  if (mobileQuoteStep === 'COMPATIBILITY_DETAILS') {
    return (
      <div className="quote-guided-compatibility" data-guided-compatibility="true" data-guided-state="TRANSITIONAL_NOT_FINAL_AUTHORITY">
        <div className="quote-guided-compatibility-bar"><div><span className="quote-guided-kicker">Quote details</span><h2>Continue your quote</h2></div><button type="button" className="btn btn-secondary btn-sm" onClick={() => setMobileQuoteStep('TERMS_USAGE')}>Back</button></div>
        {compatibilityPresentation}
      </div>
    );
  }

  if (mobileQuoteStep === 'SCOPE') {
    const shootSummary = scopeCommon.shoot_type || scopeCommon.primary_location || 'Add shoot details';
    const deliverableSummary = scopeValueLabel(scopeCommon.deliverables, 'list');
    const priorityLabels = primaryScopeFields.slice(0, 4).map(({ label }) => label).join(' · ');
    const blankMode = !selectedTemplate;
    return (
      <section className="quote-guided-shell quote-guided-scope-step" data-testid="quote-guided-scope-step" data-guided-step="SCOPE">
        <header className="quote-guided-header"><div><span className="quote-guided-kicker">Scope</span><h2>Define the shoot</h2><p>Confirm what you are quoting and what you will deliver.</p></div><span className="quote-guided-progress" aria-label="Current step: Scope">Scope</span></header>
        <div className="quote-guided-scope-summary" data-testid="quote-guided-scope-summary" data-scope-workflow={workflow.selectedQuotePresetId || 'blank'} data-scope-core-fields={primaryScopeFields.map(({ field }) => field).join(',')}><div><span>Workflow</span><strong>{selectedTemplate?.label || 'Blank Quote'}</strong></div><div><span>{blankMode ? 'Focus' : 'Priority'}</span><strong>{priorityLabels || 'Start with the details that matter'}</strong></div></div>
        <div className="quote-guided-scope-rows">
          <button type="button" className={`quote-guided-scope-row${scopeOpenBlock === 'SHOOT' ? ' is-open' : ''}`} aria-expanded={scopeOpenBlock === 'SHOOT'} onClick={() => toggleScopeBlock('SHOOT')}><span><strong>Shoot details</strong><small>{shootSummary}</small></span><span aria-hidden="true">{scopeOpenBlock === 'SHOOT' ? '−' : '+'}</span></button>
          <button type="button" className={`quote-guided-scope-row${scopeOpenBlock === 'DELIVERABLES' ? ' is-open' : ''}`} aria-expanded={scopeOpenBlock === 'DELIVERABLES'} onClick={() => toggleScopeBlock('DELIVERABLES')}><span><strong>Deliverables</strong><small>{deliverableSummary}</small></span><span aria-hidden="true">{scopeOpenBlock === 'DELIVERABLES' ? '−' : '+'}</span></button>
        </div>
        {scopeOpenBlock === 'SHOOT' && <div className="quote-guided-scope-edit-block" data-scope-edit-block="SHOOT" data-testid="quote-guided-scope-edit-shoot"><div className="quote-guided-scope-edit-heading"><strong>{blankMode ? 'Start here' : 'Core'}</strong><span>{blankMode ? 'Neutral' : 'Core'}</span></div>{renderScopeFields(visibleShootFields)}</div>}
        {scopeOpenBlock === 'DELIVERABLES' && <div className="quote-guided-scope-edit-block" data-scope-edit-block="DELIVERABLES" data-testid="quote-guided-scope-edit-deliverables"><div className="quote-guided-scope-edit-heading"><strong>{blankMode ? 'Start here' : 'Core'}</strong><span>{blankMode ? 'Neutral' : 'Core'}</span></div>{renderScopeFields(visibleDeliverableFields)}</div>}
        {blankMode ? <>
          <button type="button" className="quote-guided-scope-disclosure" data-testid="quote-guided-scope-details" aria-expanded={scopeOpenBlock === 'BLANK_SECONDARY'} onClick={() => toggleScopeBlock('BLANK_SECONDARY')}>{scopeOpenBlock === 'BLANK_SECONDARY' ? 'Hide more details' : 'More details'}</button>
          {scopeOpenBlock === 'BLANK_SECONDARY' && <div className="quote-guided-scope-edit-block" data-scope-edit-block="BLANK_SECONDARY"><div className="quote-guided-scope-edit-heading"><strong>More details</strong><span>Neutral</span></div>{renderScopeFields(blankSecondaryFields.slice(0, 6))}</div>}
        </> : <>
          <button type="button" className="quote-guided-scope-disclosure" data-testid="quote-guided-scope-details" aria-expanded={scopeOpenBlock === 'RECOMMENDED'} onClick={() => toggleScopeBlock('RECOMMENDED')}>{scopeOpenBlock === 'RECOMMENDED' ? 'Hide added details' : '+ Add details'}</button>
          <button type="button" className="quote-guided-scope-disclosure" data-testid="quote-guided-scope-optional" aria-expanded={scopeOpenBlock === 'OPTIONAL'} onClick={() => toggleScopeBlock('OPTIONAL')}>{scopeOpenBlock === 'OPTIONAL' ? 'Hide more scope details' : 'More scope details'}</button>
          {scopeOpenBlock === 'RECOMMENDED' && <div className="quote-guided-scope-edit-block" data-scope-edit-block="RECOMMENDED"><div className="quote-guided-scope-edit-heading"><strong>Added details</strong><span>Recommended</span></div>{renderScopeFields(recommendedScopeFields.slice(0, 6))}</div>}
          {scopeOpenBlock === 'OPTIONAL' && <div className="quote-guided-scope-edit-block" data-scope-edit-block="OPTIONAL"><div className="quote-guided-scope-edit-heading"><strong>More scope details</strong><span>Optional</span></div>{renderScopeFields(optionalScopeFields.filter(({ field }) => !field.startsWith('usage_rights.')).slice(0, 6))}</div>}
        </>}
        <div className="quote-guided-client-actions quote-guided-scope-actions"><button type="button" className="btn btn-secondary quote-guided-step-back" onClick={() => leaveScopeStep('CLIENT')}>Back</button><button type="button" className="btn btn-primary quote-guided-continue" onClick={() => leaveScopeStep('PRICING')}>Continue</button></div>
      </section>
    );
  }

  if (mobileQuoteStep === 'CLIENT') {
    return (
      <section className="quote-guided-shell quote-guided-client-step" data-testid="quote-guided-client-step" data-guided-step="CLIENT" aria-labelledby="quote-guided-client-heading">
        <header className="quote-guided-header"><div><span className="quote-guided-kicker">Client details</span><h2 id="quote-guided-client-heading">Tell us about your client</h2><p>Keep the selected Client connected to this Quote before adding the shoot details.</p></div><span className="quote-guided-progress" aria-label="Current step: Client">Client</span></header>
        <div className="quote-guided-client-form">
          <div className="quote-guided-client-field"><label htmlFor="quote-guided-client-select">Existing Client <span>(optional)</span></label><select id="quote-guided-client-select" data-testid="quote-guided-client-select" className="form-input" value={quote.qClientId ?? ''} onChange={handleClientSelection}><option value="">Enter client details manually</option>{availableClients.map((client) => <option key={client.id} value={client.id}>{client.name || client.email || 'Unnamed Client'}</option>)}</select></div>
          <div className="quote-guided-client-field"><label htmlFor="quote-guided-client-name">Client name</label><input id="quote-guided-client-name" data-testid="quote-guided-client-name" type="text" className="form-input" value={clientName} onChange={(event) => setters.setQuoteClientName(event.target.value)} onBlur={() => validation.setQuoteClientNameTouched(true)} aria-invalid={showClientNameError} required placeholder="e.g. Wayne Enterprises" />{showClientNameError && <span className="quote-guided-field-error">Recipient client name is required.</span>}</div>
          <div className="quote-guided-client-field"><label htmlFor="quote-guided-client-email">Client email <span>(optional)</span></label><input id="quote-guided-client-email" data-testid="quote-guided-client-email" type="email" className="form-input" value={clientEmail} onChange={(event) => setters.setQuoteClientEmail(event.target.value)} onBlur={() => validation.setQuoteClientEmailTouched(true)} aria-invalid={showClientEmailError} placeholder="e.g. client@wayne.com" />{showClientEmailError && <span className="quote-guided-field-error">Please enter a valid email address.</span>}</div>
          <div className="quote-guided-client-field"><label htmlFor="quote-guided-client-address">Client address <span>(optional)</span></label><input id="quote-guided-client-address" data-testid="quote-guided-client-address" type="text" className="form-input" value={clientAddress} onChange={(event) => setters.setQuoteClientAddress(event.target.value)} placeholder="e.g. 1007 Mountain Dr, Gotham" /></div>
        </div>
        <div className="quote-guided-client-actions"><button type="button" className="btn btn-secondary quote-guided-step-back" onClick={() => setMobileQuoteStep('WORKFLOW')}>Back</button><button type="button" className="btn btn-primary quote-guided-continue" onClick={handleClientContinue}>Continue</button></div>
      </section>
    );
  }

  return (
    <section className="quote-guided-shell" data-testid="quote-guided-shell" data-guided-step="WORKFLOW" aria-labelledby="quote-guided-heading">
      <header className="quote-guided-header"><div><span className="quote-guided-kicker">Start quote</span><h2 id="quote-guided-heading">Choose a workflow</h2><p>Select the closest starting point for this Quote.</p></div><span className="quote-guided-progress" aria-label="Current step: Workflow">Workflow</span></header>
      <nav className="quote-guided-workflow-selector" data-testid="quote-guided-workflow-selector" aria-label="Photography workflow">
        <div className="quote-guided-workflow-tabs">{PRIMARY_WORKFLOWS.map(([templateId, label]) => <button key={templateId} type="button" className={`quote-guided-workflow-tab${workflow.selectedQuotePresetId === templateId ? ' is-selected' : ''}`} data-workflow-id={templateId} aria-pressed={workflow.selectedQuotePresetId === templateId} onClick={() => workflow.applyPreset(templateId, { suppressSuccessFeedback: true })}>{label}</button>)}</div>
        <details className="quote-guided-more-workflows"><summary>More workflows</summary><div className="quote-guided-more-menu">{additionalTemplates.map((template) => <button key={template.id} type="button" className={`quote-guided-more-item${workflow.selectedQuotePresetId === template.id ? ' is-selected' : ''}`} data-workflow-id={template.id} aria-pressed={workflow.selectedQuotePresetId === template.id} onClick={() => workflow.applyPreset(template.id, { suppressSuccessFeedback: true })}>{labelForWorkflow(template)}</button>)}<button type="button" className={`quote-guided-more-item${!workflow.selectedQuotePresetId ? ' is-selected' : ''}`} aria-pressed={!workflow.selectedQuotePresetId} onClick={() => workflow.skipPreset({ suppressFeedback: true })}>Blank Quote</button></div></details>
      </nav>
      <div className="quote-guided-selection" aria-live="polite"><span className="quote-guided-selection-label">Selected workflow</span><strong>{selectedTemplate?.label || 'Blank Quote'}</strong></div>
      <div className="quote-guided-primary-action"><button type="button" className="btn btn-primary quote-guided-continue" onClick={() => setMobileQuoteStep('CLIENT')}>Continue</button></div>
    </section>
  );
}
