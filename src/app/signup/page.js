'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Logo } from '../components/UIComponents';
import { createBrowserSupabaseClient } from '../lib/supabase-client';
import { sendEvent } from '../../core/analytics/eventRouter';
import { trackEvent } from '../lib/analytics';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [client, setClient] = useState(null);
  const [hasCheckedConfig, setHasCheckedConfig] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    setClient(supabase);
    setHasCheckedConfig(true);
  }, []);

  const handleSignup = async (event) => {
    event.preventDefault();
    if (!client) return;

    if (password !== confirmPassword) {
      setStatus('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setStatus('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setStatus('');
    sendEvent('SIGNUP_STARTED', { method: 'password', source: 'signup_form' });

    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (error) {
        trackEvent('signup_login_failed', { method: 'password', reason: error.message });
        setStatus(error.message);
      } else {
        trackEvent('signup_login_requested', { method: 'password' });
        
        // If Supabase is configured to auto-confirm (or doesn't require it in local dev/prod),
        // we might have an active session right away.
        if (data?.session) {
          setStatus('Account created! Redirecting...');
          router.replace('/dashboard');
        } else {
          setStatus('Confirmation email sent. Please check your inbox to verify your account.');
        }
      }
    } catch (err) {
      setStatus(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="navbar">
        <Logo size={22} />
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Button href="/auth" variant="secondary" size="sm">Sign In</Button>
        </div>
      </header>

      <main className="container" style={{ flex: 1, padding: '70px 24px', maxWidth: '520px', margin: '0 auto', width: '100%' }}>
        <div className="card auth-card">
          <Badge style={{ marginBottom: '16px' }}>
            Freelancer Workspace
          </Badge>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-description">
            Sign up with email and password to start managing your projects.
          </p>

          {!hasCheckedConfig ? (
            <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Checking configuration...
            </div>
          ) : !client ? (
            <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.9rem', background: 'var(--bg-surface)' }}>
              <p style={{ margin: 0, lineHeight: 1.45, color: 'var(--text-muted)' }}>
                Authentication service is temporarily unavailable. Please configure Supabase environment variables.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignup}>
              <div className="input-group">
                <label className="input-label" htmlFor="signup-email">Email address</label>
                <input
                  id="signup-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="signup-confirm-password">Confirm Password</label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '8px' }} disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          )}

          {status && (
            <div style={{
              padding: '12px 16px',
              background: status.includes('sent') || status.includes('Redirecting') ? 'var(--success-glow)' : 'var(--danger-glow)',
              border: `1px solid ${status.includes('sent') || status.includes('Redirecting') ? 'var(--success-border)' : 'var(--danger-border)'}`,
              borderRadius: '6px',
              color: status.includes('sent') || status.includes('Redirecting') ? 'var(--success-text)' : 'var(--danger-text)',
              marginTop: '16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{status.includes('sent') || status.includes('Redirecting') ? '✓' : '⚠️'}</span>
              <span>{status}</span>
            </div>
          )}

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/auth" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
