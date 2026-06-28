# Corvioz Public Profile Routing Fix Report

Date: 2026-06-20

## Scope

Production bug fix sprint for public profile URLs:

- `/card/duo13h`
- `/card/[any-valid-user]`

Constraints followed:

- No UI redesign
- No database schema changes
- Only routing and slug-loading behavior changed

## Findings

### 1. App Router route exists

The dynamic route exists at:

- `src/app/card/[username]/page.js`

`npm run build` confirms the route is registered as:

```text
├ ƒ /card/[username]
```

### 2. Production route matches but returns page-level 404

Live production check before the local fix:

```text
curl -I -L https://www.corvioz.com/card/duo13h
HTTP/2 404
x-matched-path: /card/[username]
```

This means Vercel and Next.js matched the dynamic route. The bug was not a missing App Router file.

The production HTML also contained:

```text
NEXT_HTTP_ERROR_FALLBACK;404
```

So the 404 was triggered inside the page render path.

### 3. Slug exists in public profile API

Live production API check:

```text
curl "https://www.corvioz.com/api/card-profile?username=duo13h"
HTTP 200
```

The API returned a public `card_profiles` record with:

```json
{
  "username": "duo13h",
  "is_public": true
}
```

This proves the slug mapping exists and the database row is public. The mismatch was between the page server render path and the public profile API path.

## Root Cause

`/card/[username]` depended on server-side Supabase profile lookup during page render. Production showed that the API route could resolve `duo13h`, while the page render path still fell into Next's 404 fallback.

That created a split-brain behavior:

- `/api/card-profile?username=duo13h` resolved the slug.
- `/card/duo13h` matched the route but returned 404 during page render.

## Fix

Updated `src/app/card/[username]/page.js` so non-demo public profile pages no longer depend on the server component's direct Supabase lookup to decide whether the route can render.

The page now:

- Keeps `/card/demo` using the built-in demo profile.
- Normalizes the incoming username.
- Renders the existing `ProfileCardClient` shell for real public profile slugs.
- Lets the existing client-side public profile fetch use `/api/card-profile?username=...`, which is the production path already verified to resolve `duo13h`.

This aligns `/card/[username]` with the working public profile API without changing UI or schema.

## Files Changed

- `src/app/card/[username]/page.js`
- `corvioz-public-profile-routing-fix-report.md`

## Verification

### Local build and route registration

```text
npm run lint
Exit: 0

npm run build
Exit: 0
Route table includes: ƒ /card/[username]
```

### Local HTTP route checks

Started production server locally:

```text
npm run start -- -H 127.0.0.1 -p 3001
```

Checked dynamic profile routes:

```text
curl -I -L http://127.0.0.1:3001/card/duo13h
HTTP/1.1 200 OK

curl -I -L http://127.0.0.1:3001/card/demo
HTTP/1.1 200 OK
```

### Production evidence before deploy

Current production still returns 404 until this local fix is deployed:

```text
https://www.corvioz.com/card/duo13h
HTTP/2 404
x-matched-path: /card/[username]
```

But production API already resolves the same slug:

```text
https://www.corvioz.com/api/card-profile?username=duo13h
HTTP 200
```

## Deployment Note

Deploy this code change to production, then re-check:

```text
curl -I -L https://www.corvioz.com/card/duo13h
curl -I -L https://www.corvioz.com/card/demo
curl "https://www.corvioz.com/api/card-profile?username=duo13h"
```

Expected result after deploy:

- `/card/duo13h` returns HTTP 200.
- `/card/demo` remains HTTP 200.
- `/api/card-profile?username=duo13h` remains HTTP 200.
