import useQuoteEditorPresentationMode from './useQuoteEditorPresentationMode';
import QuoteEditorGuided from './QuoteEditorGuided';

export default function QuotePresentationBoundary({ children }) {
  const mode = useQuoteEditorPresentationMode();
  const observableMode = mode ? mode.toLowerCase() : 'unresolved';

  return (
    <div
      className="quote-presentation-boundary"
      data-quote-presentation-mode={observableMode}
      data-quote-presentation-compatibility="false"
      data-active-quote-presentation-trees="1"
    >
      {mode === 'GUIDED' ? (
        <QuoteEditorGuided />
      ) : children}
    </div>
  );
}
