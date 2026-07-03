'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { ANALYTICS_BUILD_VERSION } from '../lib/analytics';
import AnalyticsConsentBanner from './AnalyticsConsentBanner';

export default function AnalyticsProvider({ children }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

  const [consent, setConsent] = useState('undecided');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('corvioz_analytics_consent');
    if (stored === 'accepted' || stored === 'declined') {
      setConsent(stored);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('corvioz_analytics_consent', 'accepted');
    document.cookie = 'corvioz_analytics_consent=accepted; path=/; max-age=31536000; SameSite=Lax';
    setConsent('accepted');
  };

  const handleDecline = () => {
    localStorage.setItem('corvioz_analytics_consent', 'declined');
    document.cookie = 'corvioz_analytics_consent=declined; path=/; max-age=31536000; SameSite=Lax';
    setConsent('declined');
  };

  const showBanner = mounted && consent === 'undecided';
  const analyticsEnabled = mounted && consent === 'accepted';

  return (
    <>
      {/* GA4 Integration */}
      {analyticsEnabled && gaId && (
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
      {analyticsEnabled && plausibleDomain && (
        <Script
          data-domain={plausibleDomain}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      )}

      {/* Microsoft Clarity Integration */}
      {analyticsEnabled && clarityId && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window,document,"clarity","script","${clarityId}");
          `}
        </Script>
      )}

      {children}

      {showBanner && (
        <AnalyticsConsentBanner
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}
    </>
  );
}

