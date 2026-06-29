import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recordProductAnalyticsEvent } from '../../../lib/product-analytics-server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      try {
        await recordProductAnalyticsEvent({
          eventName: 'Signup Completed',
          userId: data?.user?.id || null,
          source: 'auth_callback',
          properties: {
            identity: data?.user?.id || data?.user?.email || 'anonymous',
            user_id: data?.user?.id || null,
            plan: 'free',
            country: '',
            source: 'auth_callback',
            timestamp: new Date().toISOString(),
          },
        });
      } catch (analyticsError) {
        console.error('Failed to record signup completion:', analyticsError);
      }
      const response = NextResponse.redirect(new URL(next, request.url));
      response.cookies.set('sb-auth-token', data.session.access_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      return response;
    }
  }

  // Redirect to signin if exchange failed or code not present
  return NextResponse.redirect(new URL('/auth', request.url));
}
