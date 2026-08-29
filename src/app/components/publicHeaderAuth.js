const AUTHENTICATED_QUOTE_ROUTE = '/dashboard?tool=quote&mode=create&flow=first-quote';

function resolveAuthenticatedPrimaryAction(primaryAction) {
  if (!primaryAction) return null;
  if (primaryAction.label.trim().toLowerCase() !== 'create quote') return null;

  return {
    ...primaryAction,
    href: primaryAction.href.startsWith('/dashboard')
      ? primaryAction.href
      : AUTHENTICATED_QUOTE_ROUTE,
  };
}

export function resolvePublicHeaderActions({ authState, accountAction, primaryAction }) {
  if (authState === 'loading') {
    return { accountAction: null, primaryAction: null };
  }

  if (authState === 'authenticated') {
    return {
      accountAction: {
        label: 'Dashboard',
        href: '/dashboard',
        variant: accountAction?.variant ?? 'secondary',
      },
      primaryAction: resolveAuthenticatedPrimaryAction(primaryAction),
    };
  }

  return { accountAction, primaryAction };
}
