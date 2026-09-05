import { useCallback, useEffect, useRef, useState } from 'react';

const CANONICAL_DOCUMENT_WIDTH = 794;

export default function QuoteClientDocumentPreviewFrame({ children }) {
  const frameRef = useRef(null);
  const [renderState, setRenderState] = useState({ scale: 1, height: 0 });

  const measure = useCallback(() => {
    const frame = frameRef.current;
    const documentElement = frame?.querySelector('.quote-client-document');
    if (!frame || !documentElement) return;

    const availableWidth = frame.getBoundingClientRect().width;
    const scale = Math.min(1, Math.max(0.01, availableWidth / CANONICAL_DOCUMENT_WIDTH));
    const height = documentElement.offsetHeight;

    setRenderState((current) => (
      current.scale === scale && current.height === height
        ? current
        : { scale, height }
    ));
  }, []);

  useEffect(() => {
    measure();
    const frame = frameRef.current;
    const documentElement = frame?.querySelector('.quote-client-document');
    if (!frame || !documentElement) return undefined;

    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(documentElement);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  return (
    <div
      ref={frameRef}
      className="quote-client-document-scale-frame"
      data-testid="quote-client-document-preview-frame"
      data-canonical-width={CANONICAL_DOCUMENT_WIDTH}
      data-render-scale={renderState.scale}
      style={{ height: renderState.height ? `${Math.ceil(renderState.height * renderState.scale)}px` : undefined }}
    >
      <div
        className="quote-client-document-scale-stage"
        style={{
          width: `${CANONICAL_DOCUMENT_WIDTH}px`,
          height: renderState.height ? `${renderState.height}px` : undefined,
          transform: `scale(${renderState.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
