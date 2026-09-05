import { useState } from 'react';
import { useQuoteEditorShared } from './QuoteEditorSharedContext';

const PRIMARY_WORKFLOWS = [
  ['commercial-shoot', 'Commercial'],
  ['wedding-shoot', 'Wedding'],
  ['portrait-session', 'Portrait'],
  ['event-photography', 'Event'],
];

const labelForWorkflow = (template) => (
  template.id === 'food-photography' ? 'Food & Beverage' : template.label
);

export default function QuoteEditorGuided({ compatibilityPresentation }) {
  const [mobileQuoteStep, setMobileQuoteStep] = useState('WORKFLOW');
  const { quote, setters, validation, workflow } = useQuoteEditorShared();
  const templates = workflow.templates || [];
  const additionalTemplates = templates.filter(({ id }) => (
    !PRIMARY_WORKFLOWS.some(([primaryId]) => primaryId === id)
  ));
  const availableClients = quote.availableClients || [];
  const clientName = quote.qClientName || '';
  const clientEmail = quote.qClientEmail || '';
  const clientAddress = quote.qClientAddress || '';
  const clientValidation = validation.validateClient({ name: clientName, email: clientEmail });
  const showClientNameError = (validation.submitAttempted || validation.clientNameTouched) && clientValidation.nameInvalid;
  const showClientEmailError = (validation.submitAttempted || validation.clientEmailTouched) && clientValidation.emailInvalid;

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
    setMobileQuoteStep('COMPATIBILITY_DETAILS');
  };

  if (mobileQuoteStep === 'COMPATIBILITY_DETAILS') {
    return (
      <div
        className="quote-guided-compatibility"
        data-guided-compatibility="true"
        data-guided-state="TRANSITIONAL_NOT_FINAL_AUTHORITY"
      >
        <div className="quote-guided-compatibility-bar">
          <div>
            <span className="quote-guided-kicker">Quote details</span>
            <h2>Continue your quote</h2>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setMobileQuoteStep('CLIENT')}
          >
            Back
          </button>
        </div>
        {compatibilityPresentation}
      </div>
    );
  }

  if (mobileQuoteStep === 'CLIENT') {
    return (
      <section className="quote-guided-shell quote-guided-client-step" data-testid="quote-guided-client-step" data-guided-step="CLIENT" aria-labelledby="quote-guided-client-heading">
        <header className="quote-guided-header">
          <div>
            <span className="quote-guided-kicker">Client details</span>
            <h2 id="quote-guided-client-heading">Tell us about your client</h2>
            <p>Keep the selected Client connected to this Quote before adding the shoot details.</p>
          </div>
          <span className="quote-guided-progress" aria-label="Current step: Client">Client</span>
        </header>

        <div className="quote-guided-client-form">
          <div className="quote-guided-client-field">
            <label htmlFor="quote-guided-client-select">Existing Client <span>(optional)</span></label>
            <select
              id="quote-guided-client-select"
              data-testid="quote-guided-client-select"
              className="form-input"
              value={quote.qClientId ?? ''}
              onChange={handleClientSelection}
            >
              <option value="">Enter client details manually</option>
              {availableClients.map((client) => (
                <option key={client.id} value={client.id}>{client.name || client.email || 'Unnamed Client'}</option>
              ))}
            </select>
          </div>

          <div className="quote-guided-client-field">
            <label htmlFor="quote-guided-client-name">Client name</label>
            <input
              id="quote-guided-client-name"
              data-testid="quote-guided-client-name"
              type="text"
              className="form-input"
              value={clientName}
              onChange={(event) => setters.setQuoteClientName(event.target.value)}
              onBlur={() => validation.setQuoteClientNameTouched(true)}
              aria-invalid={showClientNameError}
              required
              placeholder="e.g. Wayne Enterprises"
            />
            {showClientNameError && <span className="quote-guided-field-error">Recipient client name is required.</span>}
          </div>

          <div className="quote-guided-client-field">
            <label htmlFor="quote-guided-client-email">Client email <span>(optional)</span></label>
            <input
              id="quote-guided-client-email"
              data-testid="quote-guided-client-email"
              type="email"
              className="form-input"
              value={clientEmail}
              onChange={(event) => setters.setQuoteClientEmail(event.target.value)}
              onBlur={() => validation.setQuoteClientEmailTouched(true)}
              aria-invalid={showClientEmailError}
              placeholder="e.g. client@wayne.com"
            />
            {showClientEmailError && <span className="quote-guided-field-error">Please enter a valid email address.</span>}
          </div>

          <div className="quote-guided-client-field">
            <label htmlFor="quote-guided-client-address">Client address <span>(optional)</span></label>
            <input
              id="quote-guided-client-address"
              data-testid="quote-guided-client-address"
              type="text"
              className="form-input"
              value={clientAddress}
              onChange={(event) => setters.setQuoteClientAddress(event.target.value)}
              placeholder="e.g. 1007 Mountain Dr, Gotham"
            />
          </div>
        </div>

        <div className="quote-guided-client-actions">
          <button type="button" className="btn btn-secondary quote-guided-step-back" onClick={() => setMobileQuoteStep('WORKFLOW')}>
            Back
          </button>
          <button type="button" className="btn btn-primary quote-guided-continue" onClick={handleClientContinue}>
            Continue
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="quote-guided-shell" data-testid="quote-guided-shell" data-guided-step="WORKFLOW" aria-labelledby="quote-guided-heading">
      <header className="quote-guided-header">
        <div>
          <span className="quote-guided-kicker">Start quote</span>
          <h2 id="quote-guided-heading">Choose a workflow</h2>
          <p>Select the closest starting point for this Quote.</p>
        </div>
        <span className="quote-guided-progress" aria-label="Current step: Workflow">Workflow</span>
      </header>

      <nav className="quote-guided-workflow-selector" data-testid="quote-guided-workflow-selector" aria-label="Photography workflow">
        <div className="quote-guided-workflow-tabs">
          {PRIMARY_WORKFLOWS.map(([templateId, label]) => (
            <button
              key={templateId}
              type="button"
              className={`quote-guided-workflow-tab${workflow.selectedQuotePresetId === templateId ? ' is-selected' : ''}`}
              data-workflow-id={templateId}
              aria-pressed={workflow.selectedQuotePresetId === templateId}
              onClick={() => workflow.applyPreset(templateId, { suppressSuccessFeedback: true })}
            >
              {label}
            </button>
          ))}
        </div>
        <details className="quote-guided-more-workflows">
          <summary>More workflows</summary>
          <div className="quote-guided-more-menu">
            {additionalTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                className={`quote-guided-more-item${workflow.selectedQuotePresetId === template.id ? ' is-selected' : ''}`}
                data-workflow-id={template.id}
                aria-pressed={workflow.selectedQuotePresetId === template.id}
                onClick={() => workflow.applyPreset(template.id, { suppressSuccessFeedback: true })}
              >
                {labelForWorkflow(template)}
              </button>
            ))}
            <button
              type="button"
              className={`quote-guided-more-item${!workflow.selectedQuotePresetId ? ' is-selected' : ''}`}
              aria-pressed={!workflow.selectedQuotePresetId}
              onClick={() => workflow.skipPreset({ suppressFeedback: true })}
            >
              Blank Quote
            </button>
          </div>
        </details>
      </nav>

      <div className="quote-guided-selection" aria-live="polite">
        <span className="quote-guided-selection-label">Selected workflow</span>
        <strong>{templates.find(({ id }) => id === workflow.selectedQuotePresetId)?.label || 'Blank Quote'}</strong>
      </div>

      <div className="quote-guided-primary-action">
        <button
          type="button"
          className="btn btn-primary quote-guided-continue"
          onClick={() => setMobileQuoteStep('CLIENT')}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
