# Ready For Redeploy

Date: 2026-07-01

READY_FOR_REDEPLOY: NO

## Primary Blocker

`PADDLE_LIVE_VERIFICATION_IN_PROGRESS`

The live Paddle account is still under review. Production checkout should not be redeployed until live Paddle products, live price IDs, live token, live API key, and live webhook secret are confirmed.

## Failed / Incomplete Checks

| Check | Status |
| --- | --- |
| Live Paddle account approved | FAIL |
| Live Starter monthly price ID available | FAIL |
| Live Starter yearly price ID available | FAIL |
| Live Pro monthly price ID confirmed | FAIL |
| Live Pro yearly price ID available | FAIL |
| Live Studio monthly/yearly reserved price IDs available | FAIL |
| Vercel `NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID` configured | FAIL / NOT CONFIRMED |
| Vercel `NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID` configured | FAIL / NOT CONFIRMED |
| Vercel production Paddle client token confirmed | FAIL / NOT CONFIRMED |
| Vercel production Paddle API key confirmed | FAIL / NOT CONFIRMED |
| Vercel production Paddle webhook secret confirmed | FAIL / NOT CONFIRMED |
| `/api/pricing` production validation | NOT RUN |
| Pricing page production validation | NOT RUN |
| Checkout initialization validation | NOT RUN |

## Do Not Deploy Until

1. Paddle live verification is approved.
2. Live Paddle catalog mirrors the canonical Corvioz pricing model.
3. Vercel Production uses live Paddle IDs only.
4. `/api/pricing` returns Starter and Pro as purchasable with valid live IDs.
5. Pricing page and checkout initialization pass production smoke tests.

## Redeploy Decision

Current decision: WAIT.
