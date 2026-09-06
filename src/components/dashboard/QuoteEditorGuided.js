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

export default function QuoteEditorGuided({ compatibilityPresentation }) {
  const [mobileQuoteStep, setMobileQuoteStep] = useState('WORKFLOW');
  const [scopeOpenBlock, setScopeOpenBlock] = useState(null);
  const [dateDrafts, setDateDrafts] = useState({});
  const { quote, setters, validation, workflow, scope } = useQuoteEditorShared();
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

  if (mobileQuoteStep === 'COMPATIBILITY_DETAILS') {
    return (
      <div className="quote-guided-compatibility" data-guided-compatibility="true" data-guided-state="TRANSITIONAL_NOT_FINAL_AUTHORITY">
        <div className="quote-guided-compatibility-bar"><div><span className="quote-guided-kicker">Quote details</span><h2>Continue your quote</h2></div><button type="button" className="btn btn-secondary btn-sm" onClick={() => setMobileQuoteStep('SCOPE')}>Back</button></div>
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
        <div className="quote-guided-client-actions quote-guided-scope-actions"><button type="button" className="btn btn-secondary quote-guided-step-back" onClick={() => leaveScopeStep('CLIENT')}>Back</button><button type="button" className="btn btn-primary quote-guided-continue" onClick={() => leaveScopeStep('COMPATIBILITY_DETAILS')}>Continue</button></div>
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
