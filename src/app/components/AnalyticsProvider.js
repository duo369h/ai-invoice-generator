'use client';

import React from 'react';
import Script from 'next/script';
import { ANALYTICS_BUILD_VERSION } from '../lib/analytics';

export default function AnalyticsProvider({ children }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  return (
    <>
      {/* GA4 Integration */}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              window.gtag = gtag;
              window.__CORVIOZ_ANALYTICS_BUILD__ = '${ANALYTICS_BUILD_VERSION}';
              window.corvioz_analytics_build = '${ANALYTICS_BUILD_VERSION}';
              gtag('js', new Date());
              gtag('config', '${gaId}', { send_page_view: false });
              try {
                var params = new URLSearchParams(window.location.search || '');
                var debug = params.get('debug_analytics') === '1' || params.get('analytics_debug') === '1' || params.get('ga_debug') === '1' || '${process.env.NEXT_PUBLIC_ANALYTICS_DEBUG || ''}' === 'true';
                if (debug) {
                  console.info('[GA4 DEBUG] gtag initialized', {
                    gaId: '${gaId}',
                    analyticsBuild: '${ANALYTICS_BUILD_VERSION}',
                    dataLayerReady: Array.isArray(window.dataLayer),
                    dataLayerLength: Array.isArray(window.dataLayer) ? window.dataLayer.length : 0,
                    gtagReady: typeof window.gtag === 'function'
                  });
                }
              } catch (e) {}
            `}
          </Script>
        </>
      )}

      {/* Plausible Integration */}
      {plausibleDomain && (
        <Script
          data-domain={plausibleDomain}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      )}

      {children}
    </>
  );
}
