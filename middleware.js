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

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Auth state is owned by the Supabase browser client. User-facing routes
  // hydrate and redirect from supabase.auth.getSession() on the client.
  const dashboardToolRedirects = [
    { matches: pathname === '/quotes' || pathname.startsWith('/quotes/'), tool: 'quote' },
    { matches: pathname === '/invoices' || pathname.startsWith('/invoices/'), tool: 'invoice' },
    { matches: pathname === '/invoice', tool: 'invoice' },
    { matches: pathname === '/proposal' || pathname === '/proposal/create', tool: 'proposal' },
    { matches: pathname === '/client', tool: 'client' },
  ];

  const dashboardToolRedirect = dashboardToolRedirects.find((route) => route.matches);
  if (dashboardToolRedirect) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.searchParams.set('tool', dashboardToolRedirect.tool);
    if (pathname.endsWith('/create')) {
      url.searchParams.set('mode', 'create');
    }
    return NextResponse.redirect(url);
  }

  // Block internal dashboard routes in production while keeping public SaaS routes exposed.

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
