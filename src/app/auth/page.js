'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Logo } from '../components/UIComponents';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '../lib/supabase-client';
import { sendEvent as trackEvent } from '../lib/analytics';
import { trackSignupStarted } from '../lib/product-analytics';
import { saveSelectedPlan, saveIntendedRoute } from '../lib/intent-store';
import {
  isEntryIntendedAction,
  isEntrySelectedPlan,
  updateEntryRevenueContext,
} from '../../core/entry/ENTRY_REVENUE_CONTEXT';

function inferRevenueActionFromRoute(route) {
  if (!route || typeof route !== 'string') return null;
  try {
    const url = new URL(route, 'https://corvioz.local');
    const tool = url.searchParams.get('tool');
    if (tool === 'invoice') return 'invoice';
    if (tool === 'quote' || tool === 'proposal') return 'quote';
    if (tool === 'client' || tool === 'profile') return 'profile';
  } catch (_) {
    // Fall back to legacy substring matching below.
  }
  if (route.includes('/invoices') || route.includes('create-invoice')) return 'invoice';
  if (route.includes('/quotes') || route.includes('create-quote')) return 'quote';
  if (route.includes('create-profile') || route.includes('/profile')) return 'profile';
  return null;
}

function readStoredRevenueAction() {
  if (typeof window === 'undefined') return null;

  const localAction = window.localStorage.getItem('corvioz_intended_action');
  if (isEntryIntendedAction(localAction)) return localAction;
  if (window.localStorage.getItem('corvioz_pending_invoice')) return 'invoice';
  if (window.localStorage.getItem('corvioz_pending_quote')) return 'quote';
  if (window.localStorage.getItem('corvioz_identity')) return 'profile';

  try {
    const storedIntent = JSON.parse(window.sessionStorage.getItem('corvioz_conversion_intent') || '{}');
    const storedAction = storedIntent.clicked_feature || storedIntent.user_goal;
    if (isEntryIntendedAction(storedAction)) return storedAction;
    return inferRevenueActionFromRoute(storedIntent.intended_route);
  } catch (_) {
    return inferRevenueActionFromRoute(window.sessionStorage.getItem('corvioz_redirect_after_auth'));
  }
}

function bindAuthRevenueContext(plan) {
  const context = {};
  if (isEntrySelectedPlan(plan)) {
    context.selected_plan = plan;
  }

  const intendedAction = readStoredRevenueAction();
  if (intendedAction) {
    context.intended_action = intendedAction;
  }

  if (context.selected_plan || context.intended_action) {
    updateEntryRevenueContext(context);
  }
}

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [client, setClient] = useState(null);
  const [hasCheckedConfig, setHasCheckedConfig] = useState(false);
  const [sandboxRedirectTarget] = useState(() => {
    if (typeof window === 'undefined') return '/dashboard';
    return window.sessionStorage.getItem('corvioz_redirect_after_auth') || '/dashboard';
  });

  const [pendingDraft, setPendingDraft] = useState(null);
  const [identity, setIdentity] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('corvioz_identity');
      if (stored && ['starter', 'pro', 'studio'].includes(stored)) {
        setIdentity(stored);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const draftRaw = window.localStorage.getItem('corvioz_pending_invoice');
        if (draftRaw) {
          const parsed = JSON.parse(draftRaw);
          setTimeout(() => {
            setPendingDraft(parsed);
          }, 0);
        }
      } catch (e) {
        console.error('Failed to parse pending draft:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan');
    const redirect = params.get('redirect');
    bindAuthRevenueContext(plan);
    if (plan) {
      saveSelectedPlan(plan, 'auth_url_query');
    }
    if (redirect) {
      saveIntendedRoute(redirect, 'auth_url_query');
    }
  }, []);

  useEffect(() => {

    const timer = setTimeout(() => {
      const supabase = createBrowserSupabaseClient();
      setClient(supabase);
      setHasCheckedConfig(true);

      if (supabase) {
        supabase.auth.getSession().then(async ({ data }) => {
          if (data.session) {
            bindAuthRevenueContext(new URLSearchParams(window.location.search).get('plan'));
            try {
              const res = await fetch('/api/user', {
                headers: { Authorization: `Bearer ${data.session.access_token}` }
              });
              if (res.ok) {
                await res.json();
                return;
              }
            } catch (e) {
              console.error('Error resolving entry post-session:', e);
            }
          }
        });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [router]);

  const getRedirectTarget = () => {
    return '/dashboard';
  };

  const handleMagicLink = async (event) => {
    event.preventDefault();
    if (!client || !email.trim()) return;

    setIsLoading(true);
    setStatus('');
    trackSignupStarted({ method: 'magic_link', source: 'auth_form' });
    trackEvent('signup_start', { method: 'magic_link', source: 'auth_form' });
    trackEvent('signup_login_intent', { method: 'magic_link' });

    const redirectTarget = getRedirectTarget();
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTarget)}`,
      },
    });

    if (error) {
      trackEvent('signup_login_failed', { method: 'magic_link', reason: error.message });
      setStatus(error.message);
    } else {
      trackEvent('signup_login_requested', { method: 'magic_link' });
      setStatus('Check your email for the secure sign-in link.');
    }

    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (!client) return;

    setIsLoading(true);
    setStatus('');
    trackSignupStarted({ method: 'google', source: 'auth_form' });
    trackEvent('signup_start', { method: 'google', source: 'auth_form' });
    trackEvent('signup_login_intent', { method: 'google' });

    const redirectTarget = getRedirectTarget();
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTarget)}`,
      },
    });

    if (error) {
      trackEvent('signup_login_failed', { method: 'google', reason: error.message });
      setStatus(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="navbar">
        <Logo size={22} />
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Button href="/dashboard" variant="secondary" size="sm">Dashboard</Button>
        </div>
      </header>

      <main className="container" style={{ flex: 1, padding: '70px 24px', maxWidth: '520px', margin: '0 auto', width: '100%' }}>
        <div className="card auth-card">
          {pendingDraft && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
              border: '1.5px solid var(--success)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '24px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }} className="animate-fade-in">
              <span style={{ fontSize: '1.4rem', marginTop: '-2px' }}>✨</span>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 800, color: 'var(--success-text)' }}>
                  Your draft has been saved!
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-soft)', lineHeight: 1.45 }}>
                  Draft Invoice <strong>{pendingDraft.invoice_number || 'Unnamed Draft'}</strong> is secured locally. Create an account to continue where you left off and sync it to the cloud.
                </p>
              </div>
            </div>
          )}
          <Badge style={{ marginBottom: '16px' }}>
            {identity === 'starter' ? 'Starter OS' : identity === 'pro' ? 'Pro OS' : identity === 'studio' ? 'Studio OS' : 'Freelancer OS'}
          </Badge>
          <h1 className="auth-title">
            {identity === 'starter' && "Safe way to send invoices"}
            {identity === 'pro' && "Secure client pipeline management"}
            {identity === 'studio' && "Enterprise-grade studio operations system"}
            {!identity && "Create your account or Sign in"}
          </h1>
          <p className="auth-description">
            {identity 
              ? "Create your account or sign in to save your identity workspace and sync data."
              : "Enter your email to receive a secure sign-in magic link. No password required."}
          </p>

          {!hasCheckedConfig ? (
            <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Checking login configuration...
            </div>
          ) : !client ? (
            <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--bg-surface)' }}>
              <p style={{ margin: 0, lineHeight: 1.45, color: 'var(--text-muted)' }}>
                Authentication service is temporarily unavailable. Please configure Supabase environment variables.
              </p>
            </div>
          ) : (
            <>
              <Button type="button" variant="google" onClick={handleGoogleSignIn} disabled={isLoading}>
                <span className="google-mark" aria-hidden="true">G</span>
                Continue with Google
              </Button>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <form onSubmit={handleMagicLink}>
                <div className="input-group">
                  <label className="input-label" htmlFor="auth-email">Email address</label>
                  <input
                    id="auth-email"
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                <Button type="submit" variant="primary" style={{ width: '100%' }} disabled={isLoading}>
                  {isLoading ? 'Sending...' : (
                    identity === 'starter' 
                      ? 'Get paid faster' 
                      : identity === 'pro'
                      ? 'Never miss a payment' 
                      : identity === 'studio' 
                      ? 'Scale client operations' 
                      : 'Send magic link'
                  )}
                </Button>
              </form>
            </>
          )}

          {status && (
            <div style={{
              padding: '12px 16px',
              background: status.includes('Check') ? 'var(--success-glow)' : 'var(--danger-glow)',
              border: `1px solid ${status.includes('Check') ? 'var(--success-border)' : 'var(--danger-border)'}`,
              borderRadius: '6px',
              color: status.includes('Check') ? 'var(--success-text)' : 'var(--danger-text)',
              marginTop: '16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{status.includes('Check') ? '✓' : '⚠️'}</span>
              <span>{status}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
