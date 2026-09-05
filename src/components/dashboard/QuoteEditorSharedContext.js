import { createContext, useContext } from 'react';

export const QuoteEditorSharedContext = createContext(null);
QuoteEditorSharedContext.displayName = 'QuoteEditorSharedContext';

export function createQuoteEditorSharedContract({ quote, setters, validation, workflow, derived, actions }) {
  return {
    quote,
    setters,
    validation,
    workflow,
    derived,
    actions,
  };
}

export function QuoteEditorSharedProvider({ value, children }) {
  return (
    <QuoteEditorSharedContext.Provider value={value}>
      {children}
    </QuoteEditorSharedContext.Provider>
  );
}

export function useQuoteEditorShared() {
  const value = useContext(QuoteEditorSharedContext);
  if (!value) throw new Error('useQuoteEditorShared must be used within QuoteEditorSharedProvider');
  return value;
}
