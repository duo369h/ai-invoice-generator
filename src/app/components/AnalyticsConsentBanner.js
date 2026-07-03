'use client';

import React from 'react';

export default function AnalyticsConsentBanner({ onAccept, onDecline }) {
  return (
    <div className="consent-banner-layout">
      <div className="consent-banner">
        <p className="consent-banner-text">
          This site uses analytics cookies to understand usage and improve Corvioz. You can accept or decline.
        </p>
        <div className="consent-banner-actions">
          <button 
            type="button"
            className="btn btn-secondary btn-sm" 
            onClick={onDecline}
          >
            Decline
          </button>
          <button 
            type="button"
            className="btn btn-primary btn-sm" 
            onClick={onAccept}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
