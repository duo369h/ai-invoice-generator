# Corvioz Auth Production Checklist

This checklist verifies Supabase Auth behavior for the production deployment.

## Current Implementation

- Browser auth client: `src/app/lib/supabase-client.js`.
- Auth page: `src/app/auth/page.js`.
- Dashboard session restoration: `src/app/dashboard/DashboardClient.js`.
- API auth enforcement: `src/app/lib/supabase.js` and `src/app/lib/security.js`.

Supported login paths:

- Email magic link.
- Google OAuth when configured in Supabase.

Dashboard now includes an explicit `Sign out` action that calls `supabase.auth.signOut()` and redirects to `/auth`. When Supabase is configured and no session is present, `/dashboard` redirects to `/auth` instead of leaving a private shell available.

## Success Path

1. Open `https://corvioz.com/auth`.
2. Enter a production test email.
3. Complete the magic link flow.
4. Confirm redirect to `/dashboard`.
5. Refresh `/dashboard`.
6. Confirm the session is restored and Dashboard data APIs run with `Authorization: Bearer <token>`.
7. Click `Sign out`.
8. Confirm redirect to `/auth`.
9. Open `/dashboard` again.
10. Confirm `/dashboard` redirects back to `/auth` without a valid session.

## Failure Path

1. Submit an invalid email.
2. Confirm Supabase returns an error or no magic link is issued.
3. Use an expired magic link.
4. Confirm login fails and no Dashboard session is created.
5. Remove Supabase env vars in a non-production preview.
6. Confirm the auth page shows a configuration warning.

## Unauthenticated Page Tests

Expected public pages:

- `/`
- `/pricing`
- `/invoice-generator`
- `/quote-generator`
- `/blog/[slug]`
- `/freelancers`
- `/freelancers/[category]`
- `/card/[username]` only for published public profiles
- `/portal/[token]` only with a valid signed token

Expected protected data behavior:

- `/dashboard` redirects to `/auth` when Supabase is configured and no valid session is present.
- Authenticated data APIs must return `401` when no token is supplied.
- Private profile data must not be returned through public profile endpoints.

## API Access Tests

Run these against production after deployment:

```bash
BASE=https://corvioz.com
curl -i "$BASE/api/user"
curl -i "$BASE/api/invoices"
curl -i "$BASE/api/quotes"
curl -i "$BASE/api/clients"
curl -i "$BASE/api/leads"
curl -i "$BASE/api/card-profile"
```

Expected without token:

- Authenticated APIs return `401`.
- Public username lookup requires `?username=` and only returns a published public profile.
- Production persistence misconfiguration returns `503`, not mock data.

With a Supabase access token:

```bash
curl -i "$BASE/api/user" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

Expected:

- Returns the authenticated user's profile and quota.
- Other owner-scoped APIs only return that user's records.

## Session Recovery

The browser Supabase client is configured with:

```js
persistSession: true
autoRefreshToken: true
```

Expected behavior:

- Refreshing `/dashboard` preserves login while the Supabase session is valid.
- Expired sessions are cleared by Supabase and private APIs return `401`.
