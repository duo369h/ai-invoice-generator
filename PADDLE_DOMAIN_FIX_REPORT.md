# Paddle Domain Fix Report

Date: 2026-07-01
Project: Corvioz SaaS
Canonical production domain: `https://www.corvioz.com`
Scope: Task 1 only. No frontend code changes. No UI redesign. No architecture changes.

## Verdict

TASK_1_STATUS: BLOCKED

Reason: the live Corvioz domain behavior is verified, but the Paddle dashboard-side allowed-domain configuration cannot be directly verified or changed from this local checkout. Task 2 and Task 3 must not run until Paddle production allowed domains are updated and confirmed.

## Verified Live Domain Behavior

| Check | Result | Evidence |
| --- | --- | --- |
| Apex root | PASS | `curl -I https://corvioz.com` returns `HTTP/2 308` with `location: https://www.corvioz.com/`. |
| Canonical root | PASS | `curl -I https://www.corvioz.com` returns `HTTP/2 200`. |
| Apex pricing | PASS | `curl -I https://corvioz.com/pricing` returns `HTTP/2 308` with `location: https://www.corvioz.com/pricing`. |
| Canonical pricing | PASS | `curl -I https://www.corvioz.com/pricing` returns `HTTP/2 200`. |
| Checkout frame CSP | PASS | Live CSP allows `https://checkout.paddle.com` and `https://sandbox-checkout.paddle.com` in `frame-src`; Paddle domains are also allowed in `connect-src` and image sources. |

## Domain Mismatch Diagnosis

The active checkout origin is:

```text
https://www.corvioz.com
```

The apex host is not the live checkout origin:

```text
https://corvioz.com
```

It redirects to `https://www.corvioz.com`. Paddle production allowed domains are exact-origin sensitive. If Paddle is configured with only `corvioz.com` or apex policy URLs, production checkout can fail or be rejected because the browser origin opening Paddle checkout is `www.corvioz.com`.

## Required Paddle Dashboard Fix

Set Paddle production configuration to the canonical host:

```text
Allowed domain / checkout origin:
https://www.corvioz.com

Website URL:
https://www.corvioz.com

Pricing URL:
https://www.corvioz.com/pricing

Terms URL:
https://www.corvioz.com/terms

Privacy URL:
https://www.corvioz.com/privacy

Refund URL:
https://www.corvioz.com/refund-policy

Webhook URL:
https://www.corvioz.com/api/webhooks/paddle
```

If Paddle permits additional domains, keep `https://corvioz.com` only as a redirecting secondary domain. It must not be treated as the primary checkout origin.

## Local Configuration Evidence

| File | Finding |
| --- | --- |
| `.env.local` | `NEXT_PUBLIC_SITE_URL` is set to `https://www.corvioz.com`. |
| `.env.vercel` | `NEXT_PUBLIC_SITE_URL` is present but empty in the local file. This is not proof of current Vercel production env state. |
| `.env.example` | Documents `NEXT_PUBLIC_SITE_URL=https://www.corvioz.com` and Paddle production placeholders. |
| `docs/launch/DOMAIN_SETUP.md` | Documents `www.corvioz.com` as canonical and apex redirect to `www`. |
| `src/app/lib/config.js` | Falls back to `https://www.corvioz.com`. |

## Task 1 Pass Criteria

Task 1 can pass only after all items are true:

| Criterion | Status |
| --- | --- |
| Live apex redirects to `https://www.corvioz.com` | PASS |
| Live `https://www.corvioz.com/pricing` returns `200` | PASS |
| Paddle production allowed domain includes `https://www.corvioz.com` | NOT VERIFIED |
| Paddle production allowed domain does not rely on apex-only `https://corvioz.com` | NOT VERIFIED |
| Paddle public/legal URLs use `https://www.corvioz.com/...` | NOT VERIFIED IN PADDLE |
| Paddle webhook endpoint uses `https://www.corvioz.com/api/webhooks/paddle` | NOT VERIFIED IN PADDLE |

## Final Task 1 Result

TASK_1_PASS: NO

Blocking item: Paddle dashboard production domain configuration still needs external confirmation or direct dashboard/API update. Do not proceed to Task 2 until this report is updated with Paddle-side evidence.
