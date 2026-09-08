import useQuoteEditorPresentationMode from './useQuoteEditorPresentationMode';
import QuoteEditorGuided from './QuoteEditorGuided';
import QuoteEditorProfessional from './QuoteEditorProfessional';

export default function QuotePresentationBoundary({ children }) {
  const mode = useQuoteEditorPresentationMode();
  const observableMode = mode ? mode.toLowerCase() : 'unresolved';
  const activePresentation = mode === 'GUIDED'
    ? <QuoteEditorGuided />
    : mode === 'DESKTOP'
      ? <QuoteEditorProfessional key="professional-quote-editor" />
      : children;

  return (
    <div
      className="quote-presentation-boundary"
      data-quote-presentation-mode={observableMode}
      data-quote-presentation-compatibility="false"
      data-active-quote-presentation-trees="1"
    >
      {activePresentation}
    </div>
  );
}
