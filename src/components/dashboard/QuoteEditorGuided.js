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
  const { quote, workflow } = useQuoteEditorShared();
  const templates = workflow.templates || [];
  const additionalTemplates = templates.filter(({ id }) => (
    !PRIMARY_WORKFLOWS.some(([primaryId]) => primaryId === id)
  ));

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
            onClick={() => setMobileQuoteStep('WORKFLOW')}
          >
            Back
          </button>
        </div>
        {compatibilityPresentation}
      </div>
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
              onClick={() => workflow.applyPreset(templateId)}
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
                onClick={() => workflow.applyPreset(template.id)}
              >
                {labelForWorkflow(template)}
              </button>
            ))}
            <button
              type="button"
              className={`quote-guided-more-item${!workflow.selectedQuotePresetId ? ' is-selected' : ''}`}
              aria-pressed={!workflow.selectedQuotePresetId}
              onClick={() => workflow.skipPreset()}
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
          onClick={() => setMobileQuoteStep('COMPATIBILITY_DETAILS')}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
