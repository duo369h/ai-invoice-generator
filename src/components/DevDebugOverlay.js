'use client';

import React, { useState, useEffect } from 'react';
import { CorviozKernel } from 'lib/kernel/corviozKernel';

function DevDebugOverlayActual() {
  const [isOpen, setIsOpen] = useState(false);
  const [appState, setAppState] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState('homepage');

  const getPageFromPath = (path) => {
    if (path.includes('/pricing')) return 'pricing';
    if (path.includes('/checkout')) return 'checkout';
    if (path.includes('/dashboard')) return 'dashboard';
    return 'homepage';
  };

  useEffect(() => {
    setMounted(true);
    setAppState(CorviozKernel.getState());
    if (typeof window !== 'undefined') {
      setCurrentPage(getPageFromPath(window.location.pathname));
    }

    const handleUpdate = () => {
      setAppState(CorviozKernel.getState());
      if (typeof window !== 'undefined') {
        setCurrentPage(getPageFromPath(window.location.pathname));
      }
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('corvioz_debug_update', handleUpdate);
    
    // Periodically sync path context in case Next.js client-side router changes page
    const interval = setInterval(handleUpdate, 1000);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('corvioz_debug_update', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  if (!mounted || !appState) return null;

  const updateOverride = (key, value) => {
    if (typeof window !== 'undefined') {
      if (value === 'null') {
        window.sessionStorage.removeItem(`corvioz_debug_${key}`);
      } else {
        window.sessionStorage.setItem(`corvioz_debug_${key}`, value);
      }
      // Dispatch custom update event
      window.dispatchEvent(new Event('corvioz_debug_update'));
      setAppState(CorviozKernel.getState());
    }
  };

  const clearAllOverrides = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('corvioz_debug_identity');
      window.sessionStorage.removeItem('corvioz_debug_business_stage');
      window.sessionStorage.removeItem('corvioz_debug_workspace_mode');
      window.sessionStorage.removeItem('corvioz_debug_conversion_context');
      window.dispatchEvent(new Event('corvioz_debug_update'));
      setAppState(CorviozKernel.getState());
    }
  };

  // Compute actual Kernel UI state for overlay preview
  const computedUi = CorviozKernel.compute(currentPage);

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 99999,
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Minimize/Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: isOpen ? 'var(--bg-surface)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          color: isOpen ? 'var(--text-main)' : '#ffffff',
          border: isOpen ? '1px solid var(--border)' : 'none',
          borderRadius: '99px',
          padding: '10px 18px',
          fontSize: '0.8rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <span>🛠️</span>
        {isOpen ? 'Close Debug Panel' : 'Kernel Dev Debug'}
        {!isOpen && (
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '2px 6px',
            borderRadius: '99px',
            fontSize: '0.65rem'
          }}>
            {appState.identity || 'no-identity'}
          </span>
        )}
      </button>

      {/* Main Drawer Overlay */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '50px',
          right: 0,
          width: '340px',
          background: 'rgba(15, 15, 20, 0.92)',
          backdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: 'var(--shadow-xl)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          textAlign: 'left',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(10px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
          
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 800, background: 'linear-gradient(135deg, #a5b4fc, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Corvioz Kernel Debug Panel
            </h4>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>
              Current context path page: <strong style={{ color: '#38bdf8' }}>{currentPage}</strong>
            </p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: 0 }} />

          {/* Variables and Selectors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Identity */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>1. identity:</span>
              <select
                value={window.sessionStorage.getItem('corvioz_debug_identity') || 'null'}
                onChange={(e) => updateOverride('identity', e.target.value)}
                style={{
                  background: '#1e293b',
                  color: '#f1f5f9',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="null">Reset (default)</option>
                <option value="starter">Starter (safety)</option>
                <option value="growth">Growth (retainer)</option>
                <option value="studio">Studio (agency)</option>
              </select>
            </div>

            {/* Business Stage */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>2. business_stage:</span>
              <select
                value={window.sessionStorage.getItem('corvioz_debug_business_stage') || 'null'}
                onChange={(e) => updateOverride('business_stage', e.target.value)}
                style={{
                  background: '#1e293b',
                  color: '#f1f5f9',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="null">Reset (default)</option>
                <option value="freelancer">Photographer</option>
                <option value="business">Business (Studio OS override)</option>
              </select>
            </div>

            {/* Workspace Mode */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>3. workspace_mode:</span>
              <select
                value={window.sessionStorage.getItem('corvioz_debug_workspace_mode') || 'null'}
                onChange={(e) => updateOverride('workspace_mode', e.target.value)}
                style={{
                  background: '#1e293b',
                  color: '#f1f5f9',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="null">Reset (default)</option>
                <option value="standard">Standard layout</option>
                <option value="studio">Studio layout</option>
              </select>
            </div>

            {/* Conversion Context */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>4. context:</span>
              <select
                value={window.sessionStorage.getItem('corvioz_debug_conversion_context') || 'null'}
                onChange={(e) => updateOverride('conversion_context', e.target.value)}
                style={{
                  background: '#1e293b',
                  color: '#f1f5f9',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="null">Reset (auto path)</option>
                <option value="onboarding">Onboarding</option>
                <option value="pricing">Pricing</option>
                <option value="checkout">Checkout</option>
                <option value="dashboard">Dashboard</option>
              </select>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: 0 }} />

          {/* Computed UI State Outputs */}
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
              Computed Kernel UI_STATE:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>pricing_variant:</span>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>{computedUi.pricing_variant}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>checkout_flow:</span>
                <span style={{ color: '#f472b6', fontWeight: 600 }}>{computedUi.checkout_flow}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>layout_mode:</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>{computedUi.layout_mode}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '6px', marginTop: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.68rem', textTransform: 'uppercase' }}>Trust Layer:</span>
                <div style={{ paddingLeft: '8px', fontSize: '0.7rem', color: '#cbd5e1' }}>
                  <div>Badge: "{computedUi.trust_layer.trustBadge || 'none'}"</div>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Microcopy: "{computedUi.trust_layer.trustMicrocopy || 'none'}"</div>
                </div>
              </div>
            </div>
          </div>

          {/* Active CTA Engine preview */}
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
              Computed CTAs:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Navbar:</span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>"{computedUi.cta('navbar')}"</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Onboarding:</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>"{computedUi.cta('onboarding_primary')}"</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Pricing select:</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>"{computedUi.cta('pricing_select')}"</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Dashboard:</span>
                <span style={{ color: '#c084fc', fontWeight: 600 }}>"{computedUi.cta('dashboard_primary')}"</span>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: 0 }} />

          {/* Clear / Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  window.dispatchEvent(new Event('corvioz_debug_update'));
                  setAppState(CorviozKernel.getState());
                }}
                style={{
                  flex: 1,
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '8px',
                  padding: '8px',
                  color: '#60a5fa',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'}
              >
                Recompute Kernel
              </button>
              
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#f8fafc',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
              >
                🔄 Reload
              </button>
            </div>

            <button
              onClick={clearAllOverrides}
              style={{
                width: '100%',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '8px',
                color: '#ef4444',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            >
              Clear All Overrides
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DevDebugOverlay() {
  if (process.env.NODE_ENV === 'development') {
    return <DevDebugOverlayActual />;
  }
  return null;
}
