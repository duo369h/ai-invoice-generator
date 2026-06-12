'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '../lib/supabase';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [client, setClient] = useState(null);
  const [hasCheckedConfig, setHasCheckedConfig] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const supabase = createBrowserSupabaseClient();
      setClient(supabase);
      setHasCheckedConfig(true);

      if (supabase) {
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) router.push('/dashboard');
        });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [router]);

  const handleMagicLink = async (event) => {
    event.preventDefault();
    if (!client || !email.trim()) return;

    setIsLoading(true);
    setStatus('');

    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setStatus(error.message);
    } else {
      setStatus('Check your email for the secure sign-in link.');
    }

    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (!client) return;

    setIsLoading(true);
    setStatus('');

    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setStatus(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="navbar">
        <div className="logo-container">
          <Link href="/">InvoiceAI</Link>
        </div>
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/dashboard" className="btn btn-secondary btn-sm">Dashboard</Link>
        </div>
      </header>

      <main className="container" style={{ flex: 1, padding: '70px 24px', maxWidth: '520px', margin: '0 auto', width: '100%' }}>
        <div className="card" style={{ padding: '32px' }}>
          <span className="badge" style={{ marginBottom: '16px' }}>Cloud Sync</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '10px' }}>
            Sign in to save invoices
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px' }}>
            Enter your email and we will send a secure magic link. No password required.
          </p>

          {!hasCheckedConfig ? (
            <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Checking login configuration...
            </div>
          ) : !client ? (
            <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Supabase is not configured yet. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable login.
            </div>
          ) : (
            <>
              <button type="button" className="btn btn-google" onClick={handleGoogleSignIn} disabled={isLoading}>
                <span className="google-mark" aria-hidden="true">G</span>
                Continue with Google
              </button>

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
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send magic link'}
                </button>
              </form>
            </>
          )}

          {status && (
            <p style={{ marginTop: '16px', color: status.includes('Check') ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem' }}>
              {status}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
