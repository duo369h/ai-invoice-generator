# Paddle Fix Plan

Date: 2026-07-01
Scope: Paddle/Vercel/domain configuration only. Do not modify frontend code, pricing logic, UI, or deploy during this recovery step.

## Target Production Host

Use exactly:

`https://www.corvioz.com`

Do not use the apex domain as the Paddle primary checkout/domain approval URL while the live app redirects apex to `www`.

## Required Paddle Dashboard Changes

1. Open Paddle live dashboard, not sandbox:
   - `https://vendors.paddle.com`

2. Open domain / website / approved domains settings.

3. Replace the submitted domain:
   - From: `corvioz.com`
   - To: `www.corvioz.com`

4. Replace submitted website URLs:
   - Pricing page: `https://www.corvioz.com/pricing`
   - Terms of service: `https://www.corvioz.com/terms`
   - Privacy policy: `https://www.corvioz.com/privacy`
   - Refund policy: `https://www.corvioz.com/refund-policy`

5. Open Checkout settings.

6. Set the default payment link / checkout page URL to:
   - `https://www.corvioz.com/pricing`

7. Open Developer Tools / Authentication / client-side token settings.

8. Ensure allowed domains include:
   - `www.corvioz.com`

9. Optional secondary domain:
   - Add `corvioz.com` only as a secondary redirecting domain if Paddle allows it.
   - Do not make it the primary checkout host.

10. If Paddle asks for a verification file:
   - Use the exact filename and contents provided by Paddle.
   - Deploy it so Paddle can fetch it from the exact required URL.
   - Do not guess the filename.

## Required Vercel / Domain Checks

| Check | Required State |
| --- | --- |
| Vercel primary production domain | `www.corvioz.com` |
| Apex domain behavior | Redirects to `https://www.corvioz.com/...` |
| `NEXT_PUBLIC_SITE_URL` in Vercel Production | `https://www.corvioz.com` |
| Pricing page | `https://www.corvioz.com/pricing` returns `200` |
| Terms page | `https://www.corvioz.com/terms` returns `200` |
| Privacy page | `https://www.corvioz.com/privacy` returns `200` |
| Refund page | `https://www.corvioz.com/refund-policy` returns `200` |

## Exact Fix Order

1. Keep production checkout disabled until Paddle domain approval is recovered.
2. In Paddle live dashboard, update all domain and policy URLs from apex to `www`.
3. Set Paddle checkout/default payment URL to `https://www.corvioz.com/pricing`.
4. Ensure Paddle client-side token allowed domains include `www.corvioz.com`.
5. If Paddle provides a verification file, deploy the exact file at the exact path Paddle requests.
6. Re-submit domain verification in Paddle.
7. Wait for Paddle status to move from rejected/in review to approved.
8. Only after approval, continue with live product catalog, live price IDs, live token, live API key, and webhook secret.
9. Only after all production Paddle env vars are present in Vercel, redeploy.
10. Validate `/api/pricing`, pricing page, and checkout initialization against production.

## Current Decision

`DO_NOT_REDEPLOY`

Reason: Paddle live domain verification is not approved yet.
