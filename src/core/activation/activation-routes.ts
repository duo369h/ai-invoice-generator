/**
 * Corvioz v1 — Activation Route Map
 *
 * Defines which routes are essential for the first-success path
 * and which are non-essential for new/unactivated users.
 *
 * RULE: This is a configuration file only.
 *       Nothing is deleted. Routes are classified, not removed.
 *       Middleware or UI guards consume this map to redirect
 *       unactivated users toward the activation surface.
 */

/** Routes that are part of the core activation path */
export const ACTIVATION_ROUTES = {
  /** Primary activation surface — shown to new users instead of full dashboard */
  ACTIVATION_DASHBOARD: '/dashboard/activation',
  /** Core first-action routes */
  CREATE_INVOICE:        '/dashboard?tool=invoice&mode=create',
  CREATE_QUOTE:          '/dashboard?tool=quote&mode=create',
  /** Signup */
  SIGNUP:                '/signup',
} as const;

/** Routes that are essential — always accessible regardless of activation state */
export const ESSENTIAL_ROUTES: string[] = [
  '/dashboard/activation',
  '/dashboard',
  '/signup',
  '/login',
  '/dashboard',          // full dashboard still accessible via skip
];

/**
 * Routes that contain non-essential complexity for unactivated users.
 * Unactivated users who land here should be softly redirected to the
 * activation surface. Activated users are never affected.
 */
export const NON_ESSENTIAL_FOR_NEW_USERS: string[] = [
  '/dashboard/optimization',
  '/dashboard/evolution',
  '/dashboard/beta-growth',
  '/dashboard/control-plane',
  '/dashboard/studio',
  '/dashboard/audit',
  '/dashboard/growth',
  '/dashboard/simulation',
];

/**
 * Returns true if the given pathname is non-essential for a new (unactivated) user.
 */
export function isNonEssentialForNewUser(pathname: string): boolean {
  return NON_ESSENTIAL_FOR_NEW_USERS.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );
}

/**
 * Returns the redirect target for an unactivated user who attempts to access
 * a non-essential route. Always redirects to the activation surface.
 */
export function getActivationRedirect(): string {
  return ACTIVATION_ROUTES.ACTIVATION_DASHBOARD;
}
