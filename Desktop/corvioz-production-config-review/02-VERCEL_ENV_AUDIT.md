# Vercel Environment Variable Audit

Date: 2026-07-01
Scope: Paddle-related production variables only.

## Required Final Variable Set

| Variable | Classification | Reason |
| --- | --- | --- |
| `NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID` | CREATE | Required for Starter monthly checkout. Missing from current production screenshot. |
| `NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID` | CREATE | Required for Starter yearly checkout. Missing from current production screenshot. |
| `NEXT_PUBLIC_PADDLE_PRO_PRICE_ID` | KEEP / UPDATE VALUE | Required for Pro monthly checkout. Must point to live production `$19` price ID. |
| `NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID` | KEEP / UPDATE VALUE | Required for Pro yearly checkout. Must point to live production `$182` price ID. |
| `NEXT_PUBLIC_PADDLE_STUDIO_PRICE_ID` | KEEP / RESERVED | Useful for future Studio launch and webhook mapping, but Studio remains waitlist in current product model. |
| `NEXT_PUBLIC_PADDLE_STUDIO_YEARLY_PRICE_ID` | KEEP / RESERVED | Useful for future Studio launch and webhook mapping, but Studio remains waitlist in current product model. |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | KEEP / UPDATE VALUE | Required by Paddle.js frontend initialization. Must be live production token for production. |
| `NEXT_PUBLIC_PADDLE_ENV` | KEEP / VERIFY VALUE | Must be `production` for live deployment, `sandbox` only for test environments. |
| `PADDLE_API_KEY` | KEEP / UPDATE VALUE | Required for server-side Paddle API usage. Must be live production API key for production. |
| `PADDLE_WEBHOOK_SECRET` | KEEP / UPDATE VALUE | Required for webhook signature verification. Must match the live production webhook endpoint. |

## Variables To Remove Or Avoid

| Variable | Classification | Reason |
| --- | --- | --- |
| `NEXT_PUBLIC_PADDLE_GROWTH_PRICE_ID` | REMOVE / DO NOT USE | Not part of current canonical pricing model. |
| `NEXT_PUBLIC_PADDLE_GROWTH_YEARLY_PRICE_ID` | REMOVE / DO NOT USE | Not part of current canonical pricing model. |
| `NEXT_PUBLIC_PADDLE_AGENCY_PRICE_ID` | REMOVE / DO NOT USE | Not part of current canonical pricing model. |
| `NEXT_PUBLIC_PADDLE_AGENCY_YEARLY_PRICE_ID` | REMOVE / DO NOT USE | Not part of current canonical pricing model. |
| Any sandbox `pri_...` ID in Production | REMOVE / DO NOT USE | Production checkout must use live Paddle IDs only. |

## Current Blockers

| Check | Status |
| --- | --- |
| Starter production env vars confirmed in Vercel | BLOCKED / NOT CONFIRMED |
| Live Paddle price IDs available | BLOCKED BY PADDLE VERIFICATION |
| Live client-side token available | BLOCKED / NOT CONFIRMED |
| Live API key available | BLOCKED / NOT CONFIRMED |
| Live webhook secret configured | BLOCKED / NOT CONFIRMED |

## Rule

Do not update Vercel Production with sandbox IDs. Wait for live Paddle approval, create the live catalog, then map live IDs into Vercel.
