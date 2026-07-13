'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge, Button, Logo, PasswordInput } from '../components/UIComponents';
import { createBrowserSupabaseClient } from '../lib/supabase-client';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [client, setClient] = useState(null);
  const [hasSession, setHasSession] = useState(false);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    setClient(supabase);

    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setHasSession(true);
        } else {
          // If no active session, they shouldn't be here (recovery tokens establish a session first)
          setStatus('No active reset session found. Please request a new reset link.');
        }
        setHasCheckedSession(true);
      });
    } else {
      setHasCheckedSession(true);
    }
  }, []);

  const handleUpdate = async (event) => {
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

    try {
      const { error } = await client.auth.updateUser({
        password: password,
      });

      if (error) {
        setStatus(error.message);
      } else {
        setStatus('Password updated successfully! Redirecting to dashboard...');
        setTimeout(() => {
          router.replace('/dashboard');
        }, 1500);
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
          <h1 className="auth-title">Choose new password</h1>
          <p className="auth-description">
            Please enter your new password below.
          </p>

          {!hasCheckedSession ? (
            <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Verifying session...
            </div>
          ) : !client ? (
            <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.9rem', background: 'var(--bg-surface)' }}>
              <p style={{ margin: 0, lineHeight: 1.45, color: 'var(--text-muted)' }}>
                Authentication service is temporarily unavailable. Please configure Supabase environment variables.
              </p>
            </div>
          ) : !hasSession ? (
            <div style={{ padding: '20px', border: '1px solid var(--danger-border)', borderRadius: '8px', color: 'var(--danger-text)', fontSize: '0.9rem', background: 'var(--danger-glow)' }}>
              <p style={{ margin: 0, lineHeight: 1.45 }}>
                Invalid or expired password reset link. Please request a new one at <Link href="/reset-password">Reset Password</Link>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpdate}>
              <div className="input-group">
                <label className="input-label" htmlFor="update-password">New Password</label>
                <PasswordInput
                  id="update-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  showRequirements={true}
                  showStrength={true}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="update-confirm-password">Confirm Password</label>
                <PasswordInput
                  id="update-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '8px' }} disabled={isLoading}>
                {isLoading ? 'Updating password...' : 'Update Password'}
              </Button>
            </form>
          )}

          {status && (
            <div style={{
              padding: '12px 16px',
              background: status.includes('successfully') ? 'var(--success-glow)' : 'var(--danger-glow)',
              border: `1px solid ${status.includes('successfully') ? 'var(--success-border)' : 'var(--danger-border)'}`,
              borderRadius: '6px',
              color: status.includes('successfully') ? 'var(--success-text)' : 'var(--danger-text)',
              marginTop: '16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{status.includes('successfully') ? '✓' : '⚠️'}</span>
              <span>{status}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
