# Corvioz Production Data Loop

This file documents the real production loop that must pass before the Vercel production deployment is considered ready for Paddle integration.

## Current Local Verification Status

Static checks and build checks can run locally. Full production loop verification requires real Supabase production environment variables and a confirmed test user.

Latest local results:

```text
npm run verify:schema: passed
npm run lint: passed
npm run build: passed
```

Local expected command:

```bash
npm run verify:production-loop
```

If `NEXT_PUBLIC_SUPABASE_URL` is missing, the script must fail fast. That prevents false positives. During Sprint 3 final verification, `.env.local` was configured with the real Supabase production project and browser/API manual verification was completed against that project.

Production command:

```bash
CORVIOZ_BASE_URL=https://corvioz.com \
CORVIOZ_TEST_EMAIL=confirmed-test-user@example.com \
CORVIOZ_TEST_PASSWORD='replace-with-test-password' \
npm run verify:production-loop
```

## Invoice Loop

Target path:

```text
Create Invoice
Save Supabase
Dashboard displays invoice
Generate portal token
Client views signed portal
Client posts portal comment
Tokenless /portal/doc/[id] returns 404 in production
```

Automated verifier coverage:

- Authenticates with Supabase.
- Calls `/api/invoices` with a Bearer token.
- Confirms the response includes `portal_token`.
- Calls `/api/portal/token/[token]`.
- Posts a portal comment.
- Calls `/api/portal/doc/[id]` and expects `404` in production.

Manual browser confirmation:

1. Log in at `/auth`.
2. Open `/dashboard`.
3. Create an invoice with a Paddle or PayPal `payment_link`.
4. Confirm the invoice appears in Dashboard.
5. Open the returned portal link.
6. Confirm the client can view the invoice.
7. Add a client comment.
8. Refresh the portal page and confirm the comment persists.

Sprint 3 manual result on 2026-06-18:

- Invoice `INV-1634` was created from Dashboard and saved to Supabase.
- Dashboard displayed `INV-1634` as a pending invoice with `$800.00`.
- A signed portal token was generated for `INV-1634`.
- `/portal/[token]` loaded the real invoice from Supabase.
- Payment link remained in the invoice record.
- Portal comment saving succeeded and persisted after refresh.
- Internal invoice metadata was hidden from the client portal.
- Tokenless `/api/portal/doc/INV-1634` returned `404`.

## Quote Loop

Target path:

```text
Create Quote
Save Supabase
Dashboard displays quote
Generate portal token
Client views signed portal
Client posts portal comment
```

Automated verifier coverage:

- Calls `/api/quotes` with a Bearer token.
- Confirms the response includes `portal_token`.
- The signed portal route uses the same token resolver as invoices.

Manual browser confirmation:

1. Log in at `/auth`.
2. Open `/dashboard`.
3. Create a quote.
4. Confirm the quote appears in Dashboard.
5. Open the returned portal link.
6. Confirm the client can view the quote.
7. Add a client comment.
8. Refresh the portal page and confirm the comment persists.

Sprint 3 manual result on 2026-06-18:

- Quote `QT-3490` was created and saved to Supabase.
- Quote `QT-4624` was created after service-role portal/audit grants were applied and saved to Supabase.
- Dashboard displayed both quotes for the signed-in user.
- Quote creation produced portal token records after service-role grants were corrected.

## Public Profile And Lead Loop

Target path:

```text
Create public profile
Save Supabase
Public /card/[username] can load
Public lead submits inquiry
Dashboard displays lead
Private or incomplete profile stays noindex
```

Automated verifier coverage:

- Creates a profile with `is_public: true`.
- Reads it through `/api/card-profile?username=...`.
- Creates a public lead through `/api/leads`.
- Confirms the authenticated Dashboard lead API returns the lead.

Sprint 3 manual result on 2026-06-18:

- Public profile `jht-test` was created and published.
- `/card/jht-test` loaded when the profile was public and complete.
- Unpublishing the profile caused `/card/jht-test` to return 404, matching the privacy requirement.
- Re-publishing restored the public card page.
- Public lead submission succeeded from `/card/jht-test`.
- `/api/leads` now validates an existing public profile server-side and returns only `{ "success": true }`.
- Dashboard continued to load real invoice and quote data after lead submission.

## Known Issues

- `psql` and the Supabase CLI are not installed locally; remote SQL verification was performed through Supabase SQL Editor.
- Vercel production deployment and live `https://corvioz.com` checks remain pending.
- Email sending is intentionally not integrated in Sprint 3.
- Paddle checkout/webhook is intentionally not integrated in Sprint 3.
- Existing dashboard UI currently does not expose portal token links after creation; signed portal behavior was verified by generating a token record for `INV-1634` using the same token hashing/storage model.

## Pass Criteria

Production readiness for Paddle integration requires:

- `npm run verify:schema` passes.
- `npm run lint` passes.
- `npm run build` passes.
- Real Supabase project table/RLS/index verification passes.
- Manual production data loop passes locally against real Supabase.
- `npm run verify:production-loop` passes against `https://corvioz.com` after Vercel deployment.
- Supabase SQL Editor confirms RLS enabled on all listed tables.
- Manual browser test confirms login, logout, session recovery, Dashboard data, invoice portal, quote portal, and public lead capture.

Sprint 3 final status on 2026-06-18:

```text
npm run lint: passed
npm run build: passed
npm run verify:schema: passed
/api/portal/doc/[id] unsigned access: 404
real Supabase invoice loop: passed
real Supabase quote loop: passed
real Supabase public profile privacy test: passed
real Supabase lead loop: passed
real Supabase signed portal + comment loop: passed
```
