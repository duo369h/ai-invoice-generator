# Corvioz Environment Requirements

## Required For Production

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical site URL used by metadata, sitemap, robots, RSS, and email links. Production canonical host: `https://www.corvioz.com`. |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Yes | Public support email displayed in legal/support surfaces. |
| `NEXT_PUBLIC_HELLO_EMAIL` | Yes | Reserved public general contact address: `hello@corvioz.com`. |
| `NEXT_PUBLIC_BILLING_EMAIL` | Yes | Reserved billing contact address: `billing@corvioz.com`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL for auth and data persistence. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key for browser auth and public reads/writes allowed by RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only key for portal token lookup, audit logs, and service operations. |
| `UPSTASH_REDIS_REST_URL` | Yes | Production rate limit store. |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Production rate limit auth token. |

## Optional For Sprint 1

| Variable | Required | Purpose |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | Optional | Enables AI parsing/generation. Without it, authenticated users receive local heuristic parser output. |
| `NEXT_PUBLIC_GA_ID` | Optional | Google Analytics 4 measurement ID. This is the only supported GA4 variable name. |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional | Google site verification metadata. |
| `NEXT_PUBLIC_CLARITY_ID` | Optional | Microsoft Clarity analytics. |

## Paddle Billing Variables

Paddle billing is a production requirement before paid subscription checkout can be launched. Sprint 1 contains placeholders only; no Paddle checkout route is implemented in this package.

| Variable | Required Before Paid Launch | Purpose |
| --- | --- | --- |
| `PADDLE_API_KEY` | Yes | Server API key for Paddle operations. |
| `PADDLE_WEBHOOK_SECRET` | Yes | Webhook verification secret. |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Yes | Browser checkout client token. |
| `NEXT_PUBLIC_PADDLE_ENV` | Yes | `production` or `sandbox`, depending on Paddle environment. |
| `NEXT_PUBLIC_PADDLE_PRO_PRICE_ID` | Yes | Pro plan price identifier. |
| `NEXT_PUBLIC_PADDLE_AGENCY_PRICE_ID` | Optional/Future | Agency plan price identifier if agency billing is enabled later. |

## Production Email Variables

Resend email sending is integrated. In production, missing Resend configuration must be treated as a failed send, not as a successful mock delivery.

| Variable | Required Before Email Launch | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | Yes | Server-side Resend API key. Do not expose to the browser. |
| `RESEND_FROM_SUPPORT` | Yes | Support sender identity, planned as `support@corvioz.com`. |
| `RESEND_FROM_BILLING` | Yes | Billing sender identity, planned as `billing@corvioz.com`. |

Resend integration locations:

- Auth and transactional notifications: server-only mail helpers live under `src/app/lib/email.js`.
- Lead notifications call the mail helper from `src/app/api/leads/route.js`.
- Quote and invoice status notifications call the mail helper from quote, invoice, and portal routes.

## Supabase Production Requirements

1. Run `supabase/schema.sql` against the production Supabase project.
2. Confirm RLS is enabled on `profiles`, `clients`, `invoices`, `quotes`, `leads`, `card_profiles`, `portal_tokens`, `audit_logs`, `subscriptions`, and `usage`.
3. Confirm `payment_link` exists on `public.invoices`.
4. Confirm `paddle_customer_id` exists on `public.profiles` and `paddle_subscription_id` exists on `public.subscriptions`.
5. Confirm public profile read policy is present for `card_profiles`.
6. Confirm public lead insert policy is present for `leads`.
7. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and never expose it to browser/client bundles.

## Production Loop Verification

After deploying with production Supabase env vars, run:

```bash
CORVIOZ_BASE_URL=https://www.corvioz.com \
CORVIOZ_TEST_EMAIL=confirmed-test-user@example.com \
CORVIOZ_TEST_PASSWORD='replace-with-test-password' \
npm run verify:production-loop
```

The verifier checks:

- Supabase auth login.
- `/api/user` authenticated profile/quota.
- Public profile create/read.
- Public lead submission and dashboard lead read.
- Quote create with portal token.
- Invoice create with portal token and `payment_link`.
- `/api/portal/token/[token]` read and comment write.
- `/api/portal/doc/[id]` returns 404 in production.

## Local Development Notes

Local development can run without Supabase for static/marketing pages, but authenticated Dashboard workflows will return authentication or persistence configuration errors until Supabase env vars are present.
