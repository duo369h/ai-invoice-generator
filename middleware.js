import { NextResponse } from 'next/server';

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

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Enforce authentication on user-specific pages
  const isProtectedRoute =
    pathname === '/dashboard' || pathname.startsWith('/dashboard/') ||
    pathname === '/quotes' || pathname.startsWith('/quotes/') ||
    pathname === '/invoices' || pathname.startsWith('/invoices/') ||
    pathname === '/invoice' || pathname.startsWith('/invoice/') ||
    pathname === '/checkout' || pathname.startsWith('/checkout/');

  if (isProtectedRoute) {
    const entryCookie = request.cookies.get('corvioz_entry_auth')?.value || '';
    const hasSbAuth = request.cookies.getAll().some((cookie) => {
      const name = String(cookie?.name || '');
      const value = String(cookie?.value || '');
      return name.startsWith('sb-') && name.includes('auth-token') && value.length > 0;
    });

    const isUserAuthenticated =
      entryCookie === 'authenticated' ||
      entryCookie === 'activation_required' ||
      hasSbAuth;

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
