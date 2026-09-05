import { useEffect, useState } from 'react';

export const QUOTE_EDITOR_GUIDED_QUERY = '(max-width: 1023px)';

function readPresentationMode(mediaQuery) {
  return mediaQuery.matches ? 'GUIDED' : 'DESKTOP';
}

export default function useQuoteEditorPresentationMode() {
  const [mode, setMode] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia(QUOTE_EDITOR_GUIDED_QUERY);
    const updateMode = () => setMode(readPresentationMode(mediaQuery));
    updateMode();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateMode);
      return () => mediaQuery.removeEventListener('change', updateMode);
    }

    mediaQuery.addListener(updateMode);
    return () => mediaQuery.removeListener(updateMode);
  }, []);

  return mode;
}
