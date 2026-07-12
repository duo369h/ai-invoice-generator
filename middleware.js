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

function withSecurityHeaders(response) {
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

function shouldRedirectToCanonicalHost(request) {
  return process.env.NODE_ENV === 'production' && request.nextUrl.hostname === 'corvioz.com';
}

function buildCanonicalHostRedirect(request) {
  const url = request.nextUrl.clone();
  url.hostname = 'www.corvioz.com';
  return withSecurityHeaders(NextResponse.redirect(url, 308));
}

function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function getSupabaseAuthStorageKey() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const hostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  const projectRef = hostname.split('.')[0];
  return `sb-${projectRef}-auth-token`;
}

function parseCookieHeader(headerValue = '') {
  return headerValue
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separator = part.indexOf('=');
      if (separator === -1) return cookies;
      cookies.set(part.slice(0, separator), part.slice(separator + 1));
      return cookies;
    }, new Map());
}

function getRequestCookie(request, name) {
  const nextCookie = request.cookies.get(name)?.value;
  if (nextCookie) return nextCookie;
  return parseCookieHeader(request.headers.get('cookie') || '').get(name) || null;
}

function getStoredAuthSession(request, storageKey) {
  const directCookie = getRequestCookie(request, storageKey);
  if (directCookie) return decodeURIComponent(directCookie);

  const chunks = [];
  for (let index = 0; ; index += 1) {
    const chunk = getRequestCookie(request, `${storageKey}.${index}`);
    if (!chunk) break;
    chunks.push(chunk);
  }

  return chunks.length > 0 ? decodeURIComponent(chunks.join('')) : null;
}

function createMiddlewareSupabaseClient(request) {
  const storageKey = getSupabaseAuthStorageKey();
  if (!isSupabaseConfigured() || !storageKey) return null;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey,
        storage: {
          getItem: (key) => key === storageKey ? getStoredAuthSession(request, storageKey) : null,
          setItem: () => {},
          removeItem: () => {},
        },
      },
    }
  );
}

async function getVerifiedUser(request) {
  const supabase = createMiddlewareSupabaseClient(request);
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

function isProtectedEntry(pathname) {
  return (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/quotes' ||
    pathname.startsWith('/quotes/') ||
    pathname === '/invoices' ||
    pathname.startsWith('/invoices/') ||
    pathname === '/invoice' ||
    pathname === '/proposal' ||
    pathname.startsWith('/proposal/') ||
    pathname === '/client'
  );
}

function buildAuthRedirect(request, nextPath) {
  const url = request.nextUrl.clone();
  url.pathname = '/auth';
  url.search = '';
  url.searchParams.set('next', nextPath);
  return withSecurityHeaders(NextResponse.redirect(url));
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (shouldRedirectToCanonicalHost(request)) {
    return buildCanonicalHostRedirect(request);
  }

  const dashboardToolRedirects = [
    { matches: pathname === '/quotes' || pathname.startsWith('/quotes/'), tool: 'quote' },
    { matches: pathname === '/invoices' || pathname.startsWith('/invoices/'), tool: 'invoice' },
    { matches: pathname === '/invoice', tool: 'invoice' },
    { matches: pathname === '/proposal' || pathname.startsWith('/proposal/'), tool: 'proposal' },
    { matches: pathname === '/client', tool: 'client' },
  ];

  const dashboardToolRedirect = dashboardToolRedirects.find((route) => route.matches);

  if (pathname === '/auth/callback' && request.nextUrl.searchParams.has('code')) {
    const url = request.nextUrl.clone();
    url.pathname = '/api/auth/callback';
    const response = NextResponse.redirect(url);
    return withSecurityHeaders(response);
  }

  if (isProtectedEntry(pathname)) {
    let nextPath = `${pathname}${request.nextUrl.search}`;
    if (dashboardToolRedirect) {
      const toolUrl = request.nextUrl.clone();
      toolUrl.pathname = '/dashboard';
      toolUrl.search = '';
      toolUrl.searchParams.set('tool', dashboardToolRedirect.tool);
      nextPath = `${toolUrl.pathname}${toolUrl.search}`;
    }

    const user = await getVerifiedUser(request);
    if (!user) {
      return buildAuthRedirect(request, nextPath);
    }
  }

  if (dashboardToolRedirect) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.searchParams.set('tool', dashboardToolRedirect.tool);
    const response = NextResponse.redirect(url);
    return withSecurityHeaders(response);
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
    return withSecurityHeaders(new NextResponse(null, { status: 404 }));
  }

  const response = NextResponse.next();
  return withSecurityHeaders(response);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
