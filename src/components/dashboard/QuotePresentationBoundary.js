import useQuoteEditorPresentationMode from './useQuoteEditorPresentationMode';

export default function QuotePresentationBoundary({ children }) {
  const mode = useQuoteEditorPresentationMode();
  const activePresentation = children;
  const observableMode = mode ? mode.toLowerCase() : 'unresolved';

  return (
    <div
      className="quote-presentation-boundary"
      data-quote-presentation-mode={observableMode}
      data-quote-presentation-compatibility={mode === 'GUIDED' ? 'true' : 'false'}
    >
      {activePresentation}
    </div>
  );
}
