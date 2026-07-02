# Paddle Checkout URL Mapping

Date: 2026-07-01
Canonical production domain: `https://www.corvioz.com`
Scope: Task 1 only. Mapping audit only.

## Canonical URL Map

| Surface | Required URL | Status |
| --- | --- | --- |
| Production site | `https://www.corvioz.com` | PASS |
| Pricing checkout entry | `https://www.corvioz.com/pricing` | PASS |
| Checkout intent: Starter | `https://www.corvioz.com/pricing?checkout=starter` | LOCAL ROUTE SUPPORTED |
| Checkout intent: Pro | `https://www.corvioz.com/pricing?checkout=pro` | LOCAL ROUTE SUPPORTED |
| Terms | `https://www.corvioz.com/terms` | REQUIRED FOR PADDLE CONFIG |
| Privacy | `https://www.corvioz.com/privacy` | REQUIRED FOR PADDLE CONFIG |
| Refund policy | `https://www.corvioz.com/refund-policy` | REQUIRED FOR PADDLE CONFIG |
| Paddle webhook | `https://www.corvioz.com/api/webhooks/paddle` | REQUIRED FOR PADDLE CONFIG |

## Redirect Map

| Input URL | Expected Behavior | Verified Result |
| --- | --- | --- |
| `https://corvioz.com` | Redirect to `https://www.corvioz.com/` | PASS: `HTTP/2 308` |
| `https://corvioz.com/pricing` | Redirect to `https://www.corvioz.com/pricing` | PASS: `HTTP/2 308` |
| `https://www.corvioz.com` | Serve production app | PASS: `HTTP/2 200` |
| `https://www.corvioz.com/pricing` | Serve pricing page | PASS: `HTTP/2 200` |

## Local Checkout Mapping

The pricing page uses `/api/pricing` and then opens Paddle checkout from the browser-side pricing route. Therefore Paddle sees the browser origin as:

```text
https://www.corvioz.com
```

The active plan checkout routes are:

| Plan | Local route support | Paddle price source |
| --- | --- | --- |
| Free | No Paddle checkout | No price ID required |
| Starter monthly | Supported by code | `NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID` |
| Starter yearly | Supported by code | `NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID` |
| Pro monthly | Supported by code | `NEXT_PUBLIC_PADDLE_PRO_PRICE_ID` |
| Pro yearly | Supported by code | `NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID` |
| Studio | Waitlist / non-checkout in current pricing UI | Webhook resolver supports `NEXT_PUBLIC_PADDLE_STUDIO_PRICE_ID` and `NEXT_PUBLIC_PADDLE_STUDIO_YEARLY_PRICE_ID` if configured |

## Current Domain Risk

If Paddle is configured with this:

```text
https://corvioz.com
```

but checkout is opened from this:

```text
https://www.corvioz.com
```

then the likely failure class is:

```text
PADDLE_DOMAIN_MISMATCH_APEX_VS_WWW
```

## Required Paddle Mapping

Use `www` consistently in Paddle:

```text
Primary domain: https://www.corvioz.com
Checkout origin: https://www.corvioz.com
Pricing page: https://www.corvioz.com/pricing
Webhook endpoint: https://www.corvioz.com/api/webhooks/paddle
```

Do not use `https://corvioz.com` as the primary Paddle checkout domain.
