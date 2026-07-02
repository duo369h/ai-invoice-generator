# Production Readiness Checklist

Date: 2026-07-01
Goal: Make Corvioz reviewable for Paddle domain approval.

## Pricing Reviewability

| Item | Status |
| --- | --- |
| Pricing section visible on homepage | PASS |
| `/pricing` route visible without identity gate blocker | PASS |
| Free plan rendered | PASS |
| Starter plan rendered | PASS |
| Pro plan rendered | PASS |
| Studio plan rendered | PASS |
| Each card has name | PASS |
| Each card has price | PASS |
| Each card has feature list | PASS |
| Each card has CTA button | PASS |
| Monthly / Yearly toggle works | PASS |
| No blank pricing section | PASS |

## Route Reviewability

| Route | Status |
| --- | --- |
| `/` | PASS |
| `/#pricing` | PASS |
| `/pricing` | PASS |
| `/terms` | PASS |
| `/privacy` | PASS |
| `/refund-policy` | PASS |

## Payment Boundary

| Constraint | Status |
| --- | --- |
| Paddle integration unchanged | PASS |
| Paddle price IDs unchanged | PASS |
| Backend payment logic unchanged | PASS |
| Webhook logic unchanged | PASS |
| Database unchanged | PASS |

## Login Flow

| Item | Status |
| --- | --- |
| Google OAuth error does not crash auth page | PASS |
| Email magic-link login remains available | PASS |
| Auth UI does not block pricing review | PASS |

## Remaining External Requirement

Paddle dashboard domain approval must still be configured with the canonical production origin:

```text
https://www.corvioz.com
```

Recommended Paddle review URLs:

```text
https://www.corvioz.com
https://www.corvioz.com/#pricing
https://www.corvioz.com/pricing
https://www.corvioz.com/terms
https://www.corvioz.com/privacy
https://www.corvioz.com/refund-policy
```

FINAL_UI_READINESS: PASS
