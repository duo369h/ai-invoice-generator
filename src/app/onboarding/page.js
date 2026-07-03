'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Logo } from '../components/UIComponents';
import { createBrowserSupabaseClient } from '../lib/supabase-client';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState('welcome'); // welcome, form, success
  const [selectedAction, setSelectedAction] = useState(''); // quote, invoice, client
  const [isLoading, setIsLoading] = useState(false);
  const [client, setClient] = useState(null);
  const [session, setSession] = useState(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [status, setStatus] = useState('');
  
  // Guided Action Inputs
  const [clientName, setClientName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [value, setValue] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const startTimeRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const supabase = createBrowserSupabaseClient();
    setClient(supabase);

    if (supabase) {
      supabase.auth.getSession().then(async ({ data }) => {
        if (data.session) {
          setSession(data.session);
          
          // Verify if they are already activated
          try {
            const res = await fetch('/api/user', {
              headers: { Authorization: `Bearer ${data.session.access_token}` }
            });
            if (res.ok) {
              const isActivated = userData['has' + 'Activated'];
              if (isActivated) {
                // If they are already activated, bypass onboarding
                router.replace('/dashboard');
                return;
              }
            }
          } catch (e) {
            console.error('Error fetching activation check:', e);
          }
        } else {
          router.replace('/auth');
        }
        setHasCheckedSession(true);
      });
    }

    // Set 60-second drop-off timer
    const dropoffTimer = setTimeout(() => {
      if (typeof window !== 'undefined' && !window.localStorage.getItem('corvioz_activation')) {
        window.localStorage.setItem('corvioz_dropoff_reason', 'onboarding_friction');
        // Telemetry trigger
        if (window.localStorage.getItem('corvioz_analytics_consent') === 'accepted') {
          fetch('/api/product/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'ONBOARDING_DROPOFF',
              path: '/onboarding',
              userAgent: 'Browser Onboarding',
              properties: { reason: 'onboarding_friction', time_spent: 60 }
            })
          }).catch(() => {});
        }
      }
    }, 60000);

    return () => clearTimeout(dropoffTimer);
  }, [router]);

  const handleSelectPath = (action) => {
    setSelectedAction(action);
    setStep('form');
    
    // Save intent to localStorage
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('corvioz_activation_intent', JSON.stringify({
        action: action,
        timestamp: new Date().toISOString(),
        source: 'onboarding'
      }));
    }
  };

  const handleGuidedActionSubmit = async (event) => {
    event.preventDefault();
    if (!client || !session) return;
    setIsLoading(true);
    setStatus('');

    const token = session.access_token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    try {
      let res = null;
      if (selectedAction === 'quote') {
        res = await fetch('/api/quotes', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            client_name: clientName,
            items: [{ description: itemDescription || 'Consulting Services', quantity: 1, unitPrice: Number(value || 100) }],
            discount_rate: 0,
            tax_rate: 0,
            currency: 'USD',
            notes: 'Generated during onboarding',
            status: 'draft'
          })
        });
      } else if (selectedAction === 'invoice') {
        res = await fetch('/api/invoices', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            client_name: clientName,
            items: [{ description: itemDescription || 'Services Rendered', quantity: 1, unitPrice: Number(value || 100) }],
            discount_rate: 0,
            tax_rate: 0,
            currency: 'USD',
            notes: 'Generated during onboarding',
            invoice_number: `INV-${Date.now().toString().slice(-6)}`
          })
        });
      } else if (selectedAction === 'client') {
        res = await fetch('/api/clients', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            name: clientName,
            email: clientEmail,
            address: ''
          })
        });
      }

      if (res && res.ok) {
        // Send FIRST_VALUE_CREATED activation event
        const timeToActivation = Math.round((Date.now() - startTimeRef.current) / 1000);
        
        if (typeof window !== 'undefined' && window.localStorage.getItem('corvioz_analytics_consent') === 'accepted') {
          await fetch('/api/product/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'FIRST_VALUE_CREATED',
              path: '/onboarding',
              userAgent: 'Browser Onboarding',
              properties: {
                type: selectedAction,
                time_to_activation: timeToActivation,
                timestamp: new Date().toISOString()
              }
            })
          }).catch(() => {});
        }

        // Set local state
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('corvioz_activation', 'true');
          window.localStorage.setItem('corvioz_onboarding_complete', 'true');
        }

        setStep('success');
      } else {
        const errData = res ? await res.json() : {};
        setStatus(errData.error || 'Failed to submit. Please try again.');
      }
    } catch (err) {
      setStatus(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasCheckedSession) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-page)', color: 'var(--text-main)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading onboarding experience...</p>
      </main>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="navbar">
        <Logo size={22} />
      </header>

      <main className="container" style={{ flex: 1, padding: '70px 24px', maxWidth: '560px', margin: '0 auto', width: '100%' }}>
        <div className="card auth-card">
          <Badge style={{ marginBottom: '16px' }}>
            Activation Wizard
          </Badge>

          {step === 'welcome' && (
            <div className="animate-fade-in">
              <h1 className="auth-title">Let's set up your workspace</h1>
              <p className="auth-description">
                Choose your first milestone path to unlock your freelance dashboard.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => handleSelectPath('quote')}
                  className="card"
                  style={{
                    padding: '20px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    transition: 'transform 0.2s, border-color 0.2s',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Create your first Quote</h3>
                    <Badge style={{ background: 'var(--primary)', color: 'var(--white)', border: 'none', fontSize: '0.65rem' }}>RECOMMENDED FOR FREELANCERS</Badge>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Draft a professional project estimate with itemized pricing.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPath('invoice')}
                  className="card"
                  style={{
                    padding: '20px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    transition: 'transform 0.2s, border-color 0.2s',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Create your first Invoice</h3>
                    <Badge style={{ background: 'var(--secondary)', color: 'var(--white)', border: 'none', fontSize: '0.65rem' }}>RECOMMENDED FOR STUDIOS</Badge>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Generate a billing document to send directly to your clients.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPath('client')}
                  className="card"
                  style={{
                    padding: '20px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    transition: 'transform 0.2s, border-color 0.2s',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800 }}>Set up Client Profile</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Add a client profile to manage payments and communication.
                  </p>
                </button>
              </div>
            </div>
          )}

          {step === 'form' && (
            <div className="animate-fade-in">
              <h1 className="auth-title">
                {selectedAction === 'quote' && 'Guided Quote Builder'}
                {selectedAction === 'invoice' && 'Guided Invoice Builder'}
                {selectedAction === 'client' && 'Client Profile Creator'}
              </h1>
              <p className="auth-description">
                Provide these minimal details to activate your workspace.
              </p>

              <form onSubmit={handleGuidedActionSubmit} style={{ marginTop: '24px' }}>
                <div className="input-group">
                  <label className="input-label">Client Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Acme Corp"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                  />
                </div>

                {selectedAction === 'client' ? (
                  <div className="input-group">
                    <label className="input-label">Client Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="billing@acme.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div className="input-group">
                      <label className="input-label">Item / Service Description</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Website Design & Dev"
                        value={itemDescription}
                        onChange={(e) => setItemDescription(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Estimate Value (USD)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g. 1500"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <Button
                    type="button"
                    variant="secondary"
                    style={{ flex: 1, textAlign: 'center' }}
                    onClick={() => setStep('welcome')}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    style={{ flex: 2, textAlign: 'center' }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Activate Workspace'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {step === 'success' && (
            <div className="animate-fade-in" style={{ textAlign: 'center', padding: '20px 0' }}>
              <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '16px' }}>🎉</span>
              <h1 className="auth-title">Milestone Unlocked!</h1>
              <p className="auth-description" style={{ marginBottom: '32px' }}>
                Your first {selectedAction} has been successfully created. You are now ready to scale your freelance business.
              </p>

              <Button
                onClick={() => {
                  // Direct bypass redirect
                  window.location.href = '/dashboard';
                }}
                variant="primary"
                style={{ width: '100%', textAlign: 'center' }}
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          {status && (
            <div style={{
              padding: '12px 16px',
              background: 'var(--danger-glow)',
              border: '1px solid var(--danger-border)',
              borderRadius: '6px',
              color: 'var(--danger-text)',
              marginTop: '16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>{status}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
