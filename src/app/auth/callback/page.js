'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { trackSignupCompleted } from '../../lib/product-analytics';

function safeNextPath(value) {
  if (!value || typeof value !== 'string') return '/dashboard';
  if (!value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  return value;
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Completing sign in...');

  useEffect(() => {
    let cancelled = false;

    async function completeAuth() {
      const code = searchParams.get('code');
      const next = safeNextPath(searchParams.get('next'));

      if (!code) {
        router.replace('/auth');
        return;
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        }
      );

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (cancelled) return;

      if (error || !data?.session) {
        setMessage('Sign in failed. Please try again.');
        router.replace('/auth');
        return;
      }

      try {
        trackSignupCompleted({
          user_id: data.user?.id || null,
          source: 'auth_callback',
          identity: data.user?.id || data.user?.email || 'anonymous',
          plan: 'free',
          country: '',
          timestamp: new Date().toISOString(),
        });
      } catch (analyticsError) {
        console.error('Failed to record signup completion:', analyticsError);
      }

      router.replace(next);
    }

    completeAuth();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-page)', color: 'var(--text-main)' }}>
      <p style={{ color: 'var(--text-muted)' }}>{message}</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-page)', color: 'var(--text-main)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Completing sign in...</p>
      </main>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
