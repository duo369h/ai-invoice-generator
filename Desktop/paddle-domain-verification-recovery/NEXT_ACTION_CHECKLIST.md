# Next Action Checklist

Date: 2026-07-01

## Immediate Next Action

Open Paddle live dashboard and correct the submitted domain from:

`corvioz.com`

to:

`www.corvioz.com`

## Paddle Dashboard Checklist

| Item | Status |
| --- | --- |
| Live dashboard, not sandbox | TODO |
| Approved/domain setting uses `www.corvioz.com` | TODO |
| Pricing URL uses `https://www.corvioz.com/pricing` | TODO |
| Terms URL uses `https://www.corvioz.com/terms` | TODO |
| Privacy URL uses `https://www.corvioz.com/privacy` | TODO |
| Refund URL uses `https://www.corvioz.com/refund-policy` | TODO |
| Checkout/default payment link uses `https://www.corvioz.com/pricing` | TODO |
| Client-side token allowed domain includes `www.corvioz.com` | TODO |
| Paddle verification file requirement checked | TODO |
| Domain resubmitted for review | TODO |

## Vercel / Public URL Checklist

| Item | Current Finding |
| --- | --- |
| `https://www.corvioz.com` | PASS, returns `200` |
| `https://corvioz.com` | PASS as redirect only, returns `308` to `www` |
| `https://www.corvioz.com/pricing` | PASS, returns `200` |
| `https://www.corvioz.com/terms` | PASS, returns `200` |
| `https://www.corvioz.com/privacy` | PASS, returns `200` |
| `https://www.corvioz.com/refund-policy` | PASS, returns `200` |
| `robots.txt` host | PASS, uses `https://www.corvioz.com` |
| `sitemap.xml` URLs | PASS, use `https://www.corvioz.com` |

## Stop Conditions

Do not proceed to Vercel production env updates or redeploy until:

1. Paddle domain status is approved.
2. Live Paddle product and price IDs exist.
3. Live Paddle client-side token exists.
4. Live Paddle API key exists.
5. Live Paddle webhook secret exists.
6. Vercel Production env vars use live Paddle values only.

## Next User-Guided Step

STEP 1

Open Paddle live dashboard:

`vendors.paddle.com`

Then open the rejected domain / approved domains / website verification area and confirm whether the submitted domain currently says `corvioz.com` or `www.corvioz.com`.
