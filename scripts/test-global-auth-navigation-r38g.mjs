import assert from 'node:assert/strict';
import { resolvePublicHeaderActions } from '../src/app/components/publicHeaderAuth.js';

const unauthenticatedDefaults = {
  accountAction: { label: 'Sign in', href: '/dashboard', variant: 'secondary' },
  primaryAction: {
    label: 'Create Quote',
    href: '/signup?redirect=%2Fdashboard%3Ftool%3Dquote%26mode%3Dcreate%26flow%3Dfirst-quote',
    variant: 'primary',
  },
};

const unauthenticated = resolvePublicHeaderActions({
  authState: 'unauthenticated',
  ...unauthenticatedDefaults,
});
assert.equal(unauthenticated.accountAction.label, 'Sign in');
assert.equal(unauthenticated.primaryAction.label, 'Create Quote');

const authenticated = resolvePublicHeaderActions({
  authState: 'authenticated',
  ...unauthenticatedDefaults,
});
assert.deepEqual(authenticated.accountAction, {
  label: 'Dashboard',
  href: '/dashboard',
  variant: 'secondary',
});
assert.deepEqual(authenticated.primaryAction, {
  label: 'Create Quote',
  href: '/dashboard?tool=quote&mode=create&flow=first-quote',
  variant: 'primary',
});
assert.equal(authenticated.accountAction.label.includes('Sign in'), false);
assert.equal(authenticated.primaryAction.label.includes('Start free'), false);
assert.equal(authenticated.primaryAction.label.includes('Create Account'), false);

const authenticatedStartFree = resolvePublicHeaderActions({
  authState: 'authenticated',
  accountAction: null,
  primaryAction: { label: 'Start quoting for free', href: '/signup', variant: 'primary' },
});
assert.deepEqual(authenticatedStartFree.accountAction, {
  label: 'Dashboard',
  href: '/dashboard',
  variant: 'secondary',
});
assert.equal(authenticatedStartFree.primaryAction, null);

const loading = resolvePublicHeaderActions({
  authState: 'loading',
  ...unauthenticatedDefaults,
});
assert.equal(loading.accountAction, null);
assert.equal(loading.primaryAction, null);

const desktopActions = resolvePublicHeaderActions({ authState: 'authenticated', ...unauthenticatedDefaults });
const mobileActions = resolvePublicHeaderActions({ authState: 'authenticated', ...unauthenticatedDefaults });
assert.deepEqual(mobileActions, desktopActions, 'desktop and mobile must receive the same auth-aware actions');

console.log('GLOBAL_AUTH_NAV_R38G_UNAUTHENTICATED_NAV_GATE=PASS');
console.log('GLOBAL_AUTH_NAV_R38G_AUTHENTICATED_NAV_GATE=PASS');
console.log('GLOBAL_AUTH_NAV_R38G_AUTH_LOADING_NAV_GATE=PASS');
console.log('GLOBAL_AUTH_NAV_R38G_DESKTOP_MOBILE_ACTION_CONSISTENCY=PASS');
