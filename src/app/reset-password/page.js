'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge, Button, Logo } from '../components/UIComponents';
import { createBrowserSupabaseClient } from '../lib/supabase-client';
import { getAuthCallbackUrl } from '../lib/config';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [client, setClient] = useState(null);
  const [hasCheckedConfig, setHasCheckedConfig] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    setClient(supabase);
    setHasCheckedConfig(true);
  }, []);

  const handleReset = async (event) => {
    event.preventDefault();
    if (!client || !email.trim()) return;

    setIsLoading(true);
    setStatus('');

    try {
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: getAuthCallbackUrl('/update-password'),
      });

      if (error) {
        setStatus(error.message);
      } else {
        setStatus('Password reset email sent. Please check your inbox.');
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
            Account Security
          </Badge>
          <h1 className="auth-title">Reset password</h1>
          <p className="auth-description">
            Enter your email address and we'll send you a link to reset your password.
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
            <form onSubmit={handleReset}>
              <div className="input-group">
                <label className="input-label" htmlFor="reset-email">Email address</label>
                <input
                  id="reset-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '8px' }} disabled={isLoading}>
                {isLoading ? 'Sending reset link...' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          {status && (
            <div style={{
              padding: '12px 16px',
              background: status.includes('sent') ? 'var(--success-glow)' : 'var(--danger-glow)',
              border: `1px solid ${status.includes('sent') ? 'var(--success-border)' : 'var(--danger-border)'}`,
              borderRadius: '6px',
              color: status.includes('sent') ? 'var(--success-text)' : 'var(--danger-text)',
              marginTop: '16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{status.includes('sent') ? '✓' : '⚠️'}</span>
              <span>{status}</span>
            </div>
          )}

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Nevermind,{' '}
            <Link href="/auth" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              go back to sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
