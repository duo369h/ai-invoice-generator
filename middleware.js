import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://cdn.paddle.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https: https://*.paddle.com https://*.paddle.co",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://api.deepseek.com https://*.upstash.io https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://*.clarity.ms https://*.paddle.com https://*.paddle.co https://app.posthog.com https://us.i.posthog.com https://eu.i.posthog.com",
  "frame-src 'self' https://sandbox-checkout.paddle.com https://checkout.paddle.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Enforce authentication on user-specific pages
  const isProtectedRoute =
    pathname === '/dashboard' || pathname.startsWith('/dashboard/') ||
    pathname === '/quotes' || pathname.startsWith('/quotes/') ||
    pathname === '/invoices' || pathname.startsWith('/invoices/') ||
    pathname === '/client' || pathname.startsWith('/client/');

  if (isProtectedRoute) {
    const authCookie = request.cookies.getAll().find((cookie) => {
      const name = String(cookie?.name || '');
      return name.startsWith('sb-') && name.includes('auth-token');
    });

    let token = authCookie?.value;
    if (token) {
      try {
        const parsed = JSON.parse(decodeURIComponent(token));
        if (parsed && typeof parsed === 'object') {
          token = parsed.access_token || token;
        }
      } catch (_) {}
    }

    let isUserAuthenticated = false;

    if (token === 'authenticated' && process.env.NODE_ENV !== 'production') {
      isUserAuthenticated = true;
    } else if (token) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          isUserAuthenticated = true;
        }
      } catch (err) {
        console.error('Error verifying Supabase session in middleware:', err);
      }
    }

    if (!isUserAuthenticated) {
      const redirectUrl = new URL('/auth', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Block internal dashboard routes in production while keeping public SaaS routes exposed.
  const isInternalDashboardRoute =
    pathname === '/dashboard/audit' ||
    pathname.startsWith('/dashboard/audit/') ||
    pathname === '/dashboard/control-plane' ||
    pathname.startsWith('/dashboard/control-plane/') ||
    pathname === '/dashboard/evolution' ||
    pathname.startsWith('/dashboard/evolution/') ||
    pathname === '/dashboard/optimization' ||
    pathname.startsWith('/dashboard/optimization/') ||
    pathname === '/dashboard/simulation' ||
    pathname.startsWith('/dashboard/simulation/') ||
    pathname === '/dashboard/validation' ||
    pathname.startsWith('/dashboard/validation/');

  if (process.env.NODE_ENV === 'production' && isInternalDashboardRoute) {
    return new NextResponse(null, { status: 404 });
  }

  const response = NextResponse.next();

  // CSP: Tighten in production (no 'unsafe-eval')
  const activeCsp = process.env.NODE_ENV === 'production'
    ? csp.replace(" 'unsafe-eval'", '')
    : csp;

  response.headers.set('Content-Security-Policy', activeCsp);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
