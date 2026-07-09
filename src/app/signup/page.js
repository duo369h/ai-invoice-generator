'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Logo } from '../components/UIComponents';
import { createBrowserSupabaseClient } from '../lib/supabase-client';
import { sendEvent } from '../../core/analytics/eventRouter';
import { trackEvent } from '../lib/analytics';
import { getAuthCallbackUrl } from '../lib/config';
import { saveIntendedRoute } from '../lib/intent-store';

function safeSignupRedirect(value) {
  if (!value || typeof value !== 'string') return '/dashboard?tool=quote&mode=create&flow=first-quote';
  if (!value.startsWith('/') || value.startsWith('//')) return '/dashboard?tool=quote&mode=create&flow=first-quote';
  return value;
}

function readSignupRedirectTarget() {
  if (typeof window === 'undefined') return '/dashboard?tool=quote&mode=create&flow=first-quote';
  const params = new URLSearchParams(window.location.search);
  return safeSignupRedirect(params.get('redirect') || params.get('next'));
}

export default function SignupPage() {
  const router = useRouter();
  const isGoogleAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === 'true';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [client, setClient] = useState(null);
  const [hasCheckedConfig, setHasCheckedConfig] = useState(false);
  const [isSignupSuccess, setIsSignupSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [signupRedirectTarget, setSignupRedirectTarget] = useState('/dashboard?tool=quote&mode=create&flow=first-quote');

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    setClient(supabase);
    setHasCheckedConfig(true);
    const redirectTarget = readSignupRedirectTarget();
    setSignupRedirectTarget(redirectTarget);
    saveIntendedRoute(redirectTarget, 'signup_page');
    window.sessionStorage.setItem('corvioz_signup_started_at', new Date().toISOString());
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSignup = async (event) => {
    event.preventDefault();
    if (!client) return;

    if (password !== confirmPassword) {
      setStatus('Passwords do not match / 密码不匹配');
      return;
    }

    if (password.length < 6) {
      setStatus('Password must be at least 6 characters long / 密码长度必须至少为 6 位');
      return;
    }

    setIsLoading(true);
    setStatus('');
    sendEvent('SIGNUP_STARTED', { method: 'password', source: 'signup_form' });

    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(readSignupRedirectTarget()),
        },
      });

      if (error) {
        trackEvent('signup_login_failed', { method: 'password', reason: error.message });
        setStatus(error.message);
      } else {
        trackEvent('signup_login_requested', { method: 'password' });
        
        // If Supabase is configured to auto-confirm, we might have an active session right away.
        if (data?.session) {
          setStatus('Account created! Redirecting... / 账户已创建！正在跳转...');
          router.replace(readSignupRedirectTarget());
        } else {
          setIsSignupSuccess(true);
        }
      }
    } catch (err) {
      setStatus(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!client || !email.trim() || cooldown > 0) return;

    setIsLoading(true);
    setStatus('');
    try {
      const { error } = await client.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: getAuthCallbackUrl(readSignupRedirectTarget()),
        },
      });

      if (error) {
        setStatus(`Error resending confirmation: ${error.message} / 发送失败: ${error.message}`);
      } else {
        setStatus('Confirmation email resent successfully! Please check your inbox and spam folder. / 确认邮件已重新发送！请检查收件箱与垃圾邮件文件夹。');
        setCooldown(60);
      }
    } catch (err) {
      setStatus(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!client) return;

    setIsLoading(true);
    setStatus('');
    sendEvent('SIGNUP_STARTED', { method: 'google', source: 'signup_success' });

    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthCallbackUrl(readSignupRedirectTarget()),
        },
      });

      if (error) {
        trackEvent('signup_login_failed', { method: 'google', reason: error.message });
        setStatus(error.message);
        setIsLoading(false);
      }
    } catch (error) {
      trackEvent('signup_login_failed', { method: 'google', reason: error?.message || 'oauth_exception' });
      setStatus(error?.message || 'OAuth error');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="navbar">
        <Logo size={22} />
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Button href={`/auth?redirect=${encodeURIComponent(signupRedirectTarget)}`} variant="secondary" size="sm">Sign In</Button>
        </div>
      </header>

      <main className="container" style={{ flex: 1, padding: '70px 24px', maxWidth: '520px', margin: '0 auto', width: '100%' }}>
        <div className="card auth-card">
          <Badge style={{ marginBottom: '16px' }}>
            Freelancer Workspace
          </Badge>

          {isSignupSuccess ? (
            <div className="signup-success-view">
              <h1 className="auth-title">Confirmation email sent</h1>
              <p className="auth-description" style={{ marginBottom: '24px' }}>
                确认邮件已发送。Please check your inbox and spam folder.
              </p>

              <div style={{
                background: 'var(--bg-muted)',
                border: '1.5px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                fontSize: '0.85rem',
                color: 'var(--text-soft)',
                lineHeight: 1.5,
                textAlign: 'left'
              }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>
                  ✉️ Verification details:
                </p>
                <p style={{ margin: '0 0 8px 0' }}>
                  Email can take a few minutes. If you do not see it, check Spam, Promotions, or All Mail.
                </p>
                <p style={{ margin: 0 }}>
                  邮件可能需要几分钟送达。如果没有看到，请检查垃圾箱、推广邮件或全部邮件。
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Button 
                  type="button" 
                  variant="primary" 
                  onClick={handleResendConfirmation} 
                  disabled={isLoading || cooldown > 0}
                  style={{ width: '100%' }}
                >
                  {isLoading 
                    ? 'Resending...' 
                    : cooldown > 0 
                      ? `Resend in ${cooldown}s / ${cooldown}秒后可重试` 
                      : 'Resend confirmation email / 重新发送确认邮件'}
                </Button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button href={`/auth?redirect=${encodeURIComponent(signupRedirectTarget)}`} variant="secondary" style={{ flex: 1, fontSize: '0.8rem' }}>
                    Sign in instead / 直接登录
                  </Button>
                  {isGoogleAuthEnabled && (
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={handleGoogleSignIn} 
                      disabled={isLoading}
                      style={{ flex: 1, fontSize: '0.8rem' }}
                    >
                      Use Google instead / 使用 Google
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}

          {status && (
            <div style={{
              padding: '12px 16px',
              background: status.includes('sent') || status.includes('Redirecting') || status.includes('successfully') ? 'var(--success-glow)' : 'var(--danger-glow)',
              border: `1px solid ${status.includes('sent') || status.includes('Redirecting') || status.includes('successfully') ? 'var(--success-border)' : 'var(--danger-border)'}`,
              borderRadius: '6px',
              color: status.includes('sent') || status.includes('Redirecting') || status.includes('successfully') ? 'var(--success-text)' : 'var(--danger-text)',
              marginTop: '16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{status.includes('sent') || status.includes('Redirecting') || status.includes('successfully') ? '✓' : '⚠️'}</span>
              <span>{status}</span>
            </div>
          )}

          {!isSignupSuccess && (
            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link href={`/auth?redirect=${encodeURIComponent(signupRedirectTarget)}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                Sign In
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
