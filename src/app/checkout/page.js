// Corvioz Revenue Principle v9.1
// The system must optimize for first payment conversion.
// Every feature must contribute to revenue perception or payment activation.
// No feature is allowed to be neutral.

/*
This system does NOT make decisions.
It only adjusts UI intensity based on intent signals.
No pricing logic is allowed here.
No AI inference is allowed here.
*/

'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '../lib/supabase-client';
import { handleUpgradeCheckout } from '../../core/pricing/pricingController';
import { saveSelectedPlan } from '../lib/intent-store';
import { sendEvent } from '../../core/analytics/eventRouter';
import { CorviozKernel } from 'lib/kernel/corviozKernel';

const themeStyles = {
  starter: {
    badge: 'Starter Identity Active',
    accentColor: 'var(--primary)',
    glowColor: 'var(--primary-glow)',
    icon: '⚡',
  },
  pro: {
    badge: 'Pro Workspace Active',
    accentColor: 'var(--success)',
    glowColor: 'rgba(34,197,94,0.08)',
    icon: '📈',
  },
  studio: {
    badge: 'Studio Workspace Active',
    accentColor: 'var(--accent)',
    glowColor: 'rgba(99,102,241,0.08)',
    icon: '🚀',
  }
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('plan') || 'pro';
  const intent = searchParams.get('intent') || 'medium';

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(true);
  const [identity, setIdentity] = useState('starter');
  const [mounted, setMounted] = useState(false);
  const [ui, setUi] = useState(() => CorviozKernel.compute('checkout', { activePlan: planId }));

  // Fetch session on mount
  useEffect(() => {
    const isSandbox = typeof window !== 'undefined' && (
      window.sessionStorage.getItem('corvioz_sandbox_mode') === 'true' ||
      window.localStorage.getItem('corvioz_sandbox_mode') === 'true'
    );
    
    if (isSandbox) {
      setSession({
        user: {
          id: 'sandbox-user-id',
          email: 'sandbox@corvioz.com'
        }
      });
      setLoading(false);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session || null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Set identity based on local storage or plan ID fallback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('corvioz_identity');
      if (stored && ['starter', 'pro', 'studio'].includes(stored)) {
        setIdentity(stored);
      } else {
        if (planId === 'starter') setIdentity('starter');
        else if (planId === 'pro') setIdentity('pro');
        else if (planId === 'studio') setIdentity('studio');
        else setIdentity('starter');
      }
    }
  }, [planId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setUi(CorviozKernel.compute('checkout', { activePlan: planId }));
    }
    const handleUpdate = () => {
      setUi(CorviozKernel.compute('checkout', { activePlan: planId }));
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('corvioz_debug_update', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('corvioz_debug_update', handleUpdate);
    };
  }, [mounted, planId, identity]);

  // Trigger Checkout immediately
  useEffect(() => {
    if (loading) return;

    // Track checkout funnel start
    sendEvent('CHECKOUT_STARTED', { plan: planId, intent, planId: planId });

    if (!session) {
      console.log('[CHECKOUT] Redirecting unauthenticated user to signup for plan:', planId);
      sendEvent('SIGNUP_STARTED', { plan: planId, planId: planId });
      saveSelectedPlan(planId, `/checkout?plan=${planId}&intent=${intent}`);
      router.push(`/signup?redirect=/checkout&plan=${planId}&intent=${intent}`);
      return;
    }

    if (showModal) return; // Wait for modal confirmation before starting checkout

    const triggerCheckout = async () => {
      try {
        const res = await fetch('/api/pricing');
        if (!res.ok) {
          setError('Failed to fetch pricing config.');
          return;
        }

        const data = await res.json();
        const plans = data.plans || [];

        recordFunnelStep('conversion', { plan: planId, source: 'checkout_trigger' });
        await handleUpgradeCheckout({
          planId,
          billingPeriod: 'monthly',
          session,
          plans,
          searchParams,
          setCheckoutLoading: () => {}
        });
      } catch (err) {
        console.error('[CHECKOUT ERROR] Failed to load upgrade:', err);
        setError('Checkout failed to initialize.');
      }
    };

    triggerCheckout();
  }, [session, loading, planId, intent, router, searchParams, showModal]);

  const activeTheme = ui.pricing_variant;
  const activeStyle = themeStyles[activeTheme] || themeStyles.starter;
  const activeCopy = ui.copy;

  if (!mounted || !activeCopy) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading workspace details...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', padding: '20px' }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '40px', border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: '24px', boxShadow: 'var(--shadow-lg)' }}>
        
        {showModal && session ? (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.5rem' }}>{activeStyle.icon}</span>
              <span style={{ 
                fontSize: '0.68rem', 
                fontWeight: 800, 
                color: activeStyle.accentColor, 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em', 
                background: activeStyle.glowColor, 
                border: `1px solid ${activeStyle.accentColor}`, 
                borderRadius: '99px', 
                padding: '3px 10px' 
              }}>
                {activeStyle.badge}
              </span>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              {activeCopy.heading}
            </h2>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeCopy.bullets.map((bullet, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'var(--text-soft)', fontWeight: 600 }}>
                  <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <div style={{
              background: 'var(--btn-secondary-bg)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '28px',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              lineHeight: 1.45,
              fontWeight: 550,
              borderLeft: `4px solid ${activeStyle.accentColor}`
            }}>
              {activeCopy.quote}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  background: activeStyle.accentColor,
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                {ui.cta('checkout_continue')}
              </button>
              <button
                onClick={() => router.push('/pricing')}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'transparent',
                  color: 'var(--text-soft)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--btn-secondary-bg)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {ui.cta('checkout_back')}
              </button>
            </div>

            {/* Trust Copy Badges (TASK 2) */}
            <div style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border)',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              fontSize: '0.75rem',
              color: 'var(--text-soft)',
              fontWeight: 600,
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔒</span> Secure checkout via Paddle
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🛡️</span> Your data is encrypted
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📅</span> Cancel anytime
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💸</span> No setup fees
              </div>
            </div>

            {/* Why Corvioz is Safe Module (TASK 2) */}
            <div style={{
              marginTop: '20px',
              padding: '16px',
              background: 'var(--btn-secondary-bg)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              textAlign: 'left'
            }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-main)' }}>
                Why Corvioz is safe:
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', color: 'var(--text-soft)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span> Built for freelancers in US & Canada
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span> No hidden billing logic
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span> You own your invoices, clients, and exported documents
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span> Subscription checkout handled securely via Paddle
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: activeStyle.glowColor, border: `2px solid ${activeStyle.accentColor}`, display: 'flex', alignItems: 'center', margin: '0 auto 20px', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.5rem' }}>{activeStyle.icon}</span>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              {activeCopy.loadingHeader}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px', lineHeight: '1.5' }}>
              {activeCopy.loadingDesc}
            </p>

            {error ? (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                ⚠️ {error}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div className="spinner" style={{ width: '28px', height: '28px', border: '3px solid var(--border)', borderTopColor: activeStyle.accentColor, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  {activeCopy.spinnerSub}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading checkout...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
