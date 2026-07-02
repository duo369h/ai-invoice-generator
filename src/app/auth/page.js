'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Logo } from '../components/UIComponents';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '../lib/supabase-client';
import { saveSelectedPlan, saveIntendedRoute } from '../lib/intent-store';
import { sendEvent } from '../../core/analytics/eventRouter';
import { trackEvent } from '../lib/analytics';
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
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('password'); // 'password' or 'magic'
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [client, setClient] = useState(null);
  const [hasCheckedConfig, setHasCheckedConfig] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(true);

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
                router.replace('/dashboard');
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

  const handlePasswordSignIn = async (event) => {
    event.preventDefault();
    if (!client || !email.trim() || !password) return;

    setIsLoading(true);
    setStatus('');
    sendEvent('SIGNUP_STARTED', { method: 'password', source: 'auth_form' });

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        trackEvent('signup_login_failed', { method: 'password', reason: error.message });
        setStatus(error.message);
      } else {
        trackEvent('signup_login_requested', { method: 'password' });
        setStatus('Logged in successfully! Redirecting...');
        router.replace('/dashboard');
      }
    } catch (err) {
      setStatus(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (event) => {
    event.preventDefault();
    if (!client || !email.trim()) return;

    setIsLoading(true);
    setStatus('');
    sendEvent('SIGNUP_STARTED', { method: 'magic_link', source: 'auth_form' });

    const redirectTarget = '/dashboard';
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
    sendEvent('SIGNUP_STARTED', { method: 'google', source: 'auth_form' });

    try {
      const redirectTarget = '/dashboard';
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTarget)}`,
        },
      });

      if (error) {
        trackEvent('signup_login_failed', { method: 'google', reason: error.message });
        setGoogleAvailable(false);
        setStatus('Google sign-in is temporarily unavailable. Continue with email instead.');
        setIsLoading(false);
      }
    } catch (error) {
      trackEvent('signup_login_failed', { method: 'google', reason: error?.message || 'oauth_exception' });
      setGoogleAvailable(false);
      setStatus('Google sign-in is temporarily unavailable. Continue with email instead.');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="navbar">
        <Logo size={22} />
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Button href="/signup" variant="secondary" size="sm">Create Account</Button>
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
                  Your draft document <strong>{pendingDraft.invoice_number || 'Unnamed Draft'}</strong> is saved locally. Create an account to continue where you left off and sync it to the cloud.
                </p>
              </div>
            </div>
          )}
          <Badge style={{ marginBottom: '16px' }}>
            {identity === 'starter' ? 'Starter Workspace' : identity === 'pro' ? 'Pro Workspace' : identity === 'studio' ? 'Studio Workspace' : 'Freelancer Workspace'}
          </Badge>
          <h1 className="auth-title">
            {identity === 'starter' && "Safe way to organize client work"}
            {identity === 'pro' && "Secure client pipeline management"}
            {identity === 'studio' && "Studio workspace for client operations"}
            {!identity && "Sign in to your account"}
          </h1>
          <p className="auth-description">
            Choose your preferred sign in method.
          </p>

          {!hasCheckedConfig ? (
            <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Checking login configuration...
            </div>
          ) : !client ? (
            <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.9rem', background: 'var(--bg-surface)' }}>
              <p style={{ margin: 0, lineHeight: 1.45, color: 'var(--text-muted)' }}>
                Authentication service is temporarily unavailable. Please configure Supabase environment variables.
              </p>
            </div>
          ) : (
            <>
              {googleAvailable && (
                <>
                  <Button type="button" variant="google" onClick={handleGoogleSignIn} disabled={isLoading}>
                    <span className="google-mark" aria-hidden="true">G</span>
                    Continue with Google
                  </Button>

                  <div className="auth-divider">
                    <span>or</span>
                  </div>
                </>
              )}

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-muted)', padding: '4px', borderRadius: '8px' }}>
                <button 
                  type="button"
                  onClick={() => setActiveTab('password')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeTab === 'password' ? 'var(--bg-surface)' : 'transparent',
                    color: activeTab === 'password' ? 'var(--text-main)' : 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: activeTab === 'password' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Password
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveTab('magic')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeTab === 'magic' ? 'var(--bg-surface)' : 'transparent',
                    color: activeTab === 'magic' ? 'var(--text-main)' : 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: activeTab === 'magic' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Magic Link
                </button>
              </div>

              {activeTab === 'password' ? (
                <form onSubmit={handlePasswordSignIn}>
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
                  <div className="input-group" style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="input-label" htmlFor="auth-password">Password</label>
                      <Link href="/reset-password" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, marginBottom: '6px' }}>
                        Forgot password?
                      </Link>
                    </div>
                    <input
                      id="auth-password"
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" variant="primary" style={{ width: '100%' }} disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleMagicLink}>
                  <div className="input-group">
                    <label className="input-label" htmlFor="auth-email-magic">Email address</label>
                    <input
                      id="auth-email-magic"
                      type="email"
                      className="form-input"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" variant="primary" style={{ width: '100%' }} disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send magic link'}
                  </Button>
                </form>
              )}
            </>
          )}

          {status && (
            <div style={{
              padding: '12px 16px',
              background: status.includes('Check') || status.includes('successfully') ? 'var(--success-glow)' : 'var(--danger-glow)',
              border: `1px solid ${status.includes('Check') || status.includes('successfully') ? 'var(--success-border)' : 'var(--danger-border)'}`,
              borderRadius: '6px',
              color: status.includes('Check') || status.includes('successfully') ? 'var(--success-text)' : 'var(--danger-text)',
              marginTop: '16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{status.includes('Check') || status.includes('successfully') ? '✓' : '⚠️'}</span>
              <span>{status}</span>
            </div>
          )}

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Create Account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
