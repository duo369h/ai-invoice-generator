import { NextResponse } from 'next/server';
import { getNextRoute } from './src/core/orchestrator/CORVIOZ_ORCHESTRATOR.ts';

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

  // TASK 2: Block internal dashboard routes in production
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

  const cookies = request.cookies;
  const userState = {
    entry_state: cookies.get('corvioz_entry_state')?.value || 'GUEST',
    killSwitchActive: cookies.get('corvioz_kill_switch')?.value === 'true',
  };

  // Middleware is executor only — no logic, no decisions
  const isGuardedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/invoices') ||
    pathname.startsWith('/quotes') ||
    pathname === '/';

  if (isGuardedRoute) {
    const { route } = getNextRoute(userState);
    if (pathname !== route) {
      return NextResponse.redirect(new URL(route, request.url));
    }
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
