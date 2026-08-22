'use client';

import { useEffect, useRef } from 'react';
import { HOME_V1C_MARKUP } from './home/HomeV1CMarkup';
import { HOME_V1C_MOTION } from './home/HomeV1CMotion';

const HOME_V1C_STYLESHEET_ID = 'corvioz-home-v1c-styles';

export default function HomePage() {
  const motionStarted = useRef(false);

  useEffect(() => {
    const existingStylesheet = document.getElementById(HOME_V1C_STYLESHEET_ID);
    const stylesheet = existingStylesheet || document.createElement('link');
    stylesheet.id = HOME_V1C_STYLESHEET_ID;
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/home-v1c.css';
    if (!existingStylesheet) document.head.appendChild(stylesheet);

    if (!motionStarted.current) {
      motionStarted.current = true;
      // The canonical V1C motion source is adapted as a client-side effect so
      // its DOM state, timers, keyboard behavior, and reduced-motion branch
      // remain unchanged while the page is rendered by Next.js. Inline script
      // injection preserves the source behavior without requiring unsafe-eval.
      const motionScript = document.createElement('script');
      motionScript.id = 'corvioz-home-v1c-motion';
      motionScript.textContent = HOME_V1C_MOTION;
      document.body.appendChild(motionScript);
    }

    return () => {
      stylesheet.remove();
      document.getElementById('corvioz-home-v1c-motion')?.remove();
      motionStarted.current = false;
    };
  }, []);

  return (
    <div
      className="corvioz-home-v1c"
      dangerouslySetInnerHTML={{ __html: HOME_V1C_MARKUP }}
    />
  );
}
