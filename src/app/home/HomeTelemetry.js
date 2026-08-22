'use client';

import { useEffect, useRef } from 'react';
import { sendEvent } from '../../core/analytics/eventRouter';

const CREATE_QUOTE_POSITIONS = new Set(['navbar', 'hero', 'final_cta']);

export default function HomeTelemetry() {
  const landingViewSentRef = useRef(false);
  const fired50Ref = useRef(false);
  const fired90Ref = useRef(false);

  useEffect(() => {
    if (landingViewSentRef.current) return;

    landingViewSentRef.current = true;
    sendEvent('LANDING_VIEW', { source: 'homepage' });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;

      if (!fired50Ref.current && scrolled >= total * 0.5) {
        fired50Ref.current = true;
        sendEvent('SCROLL_DEPTH_50', { path: '/' });
      }

      if (!fired90Ref.current && scrolled >= total * 0.9) {
        fired90Ref.current = true;
        sendEvent('SCROLL_DEPTH_90', { path: '/' });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest('a[data-home-telemetry]');
      if (!anchor) return;

      const marker = anchor.dataset.homeTelemetry;

      if (marker === 'signin-navbar') {
        sendEvent('CTA_CLICK', {
          cta_name: 'Sign in',
          label: 'Sign in',
          position: 'navbar',
        });
        return;
      }

      if (marker !== 'create-quote') return;

      const position = anchor.dataset.homeTelemetryPosition;
      if (!CREATE_QUOTE_POSITIONS.has(position)) return;

      sendEvent('CTA_CLICK', {
        cta_name: 'Create Quote',
        label: 'Create Quote',
        position,
      });
    };

    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, []);

  return null;
}
