'use client';

import React from 'react';
import { DecisionExplanationPanel } from './DecisionExplanationPanel';

export function PricingRedirectOverlay({
  isOpen,
  message = 'Navigating to premium plans...',
  explanation = null,
  intentBreakdown = null,
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(11, 15, 23, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20000,
      color: 'var(--text-main)',
      fontFamily: 'var(--font-sans)',
      textAlign: 'center',
      animation: 'fadeIn 0.3s ease-out forwards'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        maxWidth: '400px',
        padding: '32px'
      }}>
        {/* Animated padlock / key symbol */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'var(--primary-glow)',
          border: '2px solid var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 1.8s infinite'
        }}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Accessing Premium Workspaces</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.45 }}>{message}</p>
        </div>

        <DecisionExplanationPanel
          explanation={explanation}
          intentBreakdown={intentBreakdown}
          title="Why am I being redirected to pricing?"
        />

        {/* Linear loading track */}
        <div style={{
          width: '180px',
          height: '3px',
          background: 'var(--border)',
          borderRadius: '99px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            background: 'linear-gradient(90deg, var(--primary), var(--accent))',
            width: '40%',
            borderRadius: '99px',
            animation: 'loadingSweep 1.2s infinite ease-in-out'
          }} />
        </div>
      </div>

      <style>{`
        @keyframes loadingSweep {
          0% { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
