import { NextResponse } from 'next/server';

const INTERNAL_DASHBOARD_PATHS = Object.freeze([
  '/dashboard/control-plane',
  '/dashboard/evolution',
  '/dashboard/optimization',
  '/dashboard/revenue-validation',
  '/dashboard/simulation',
  '/dashboard/audit',
  '/dashboard/validation',
  '/dashboard/product-funnel',
  '/dashboard/early-access',
]);

export function isInternalDashboardPath(pathname = '') {
  return INTERNAL_DASHBOARD_PATHS.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function middleware(request) {
  if (process.env.NODE_ENV === 'production' && isInternalDashboardPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/control-plane/:path*',
    '/dashboard/evolution/:path*',
    '/dashboard/optimization/:path*',
    '/dashboard/revenue-validation/:path*',
    '/dashboard/simulation/:path*',
    '/dashboard/audit/:path*',
    '/dashboard/validation/:path*',
    '/dashboard/product-funnel/:path*',
    '/dashboard/early-access/:path*',
  ],
};
