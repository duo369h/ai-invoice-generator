# Route Verification

Date: 2026-07-01
Local verification base: `http://localhost:3000`

## Route Status

| Route | Status |
| --- | --- |
| `/` | 200 |
| `/pricing` | 200 |
| `/terms` | 200 |
| `/privacy` | 200 |
| `/refund-policy` | 200 |

## Pricing Route Rendering

| Page | Check | Result |
| --- | --- | --- |
| `/#pricing` | 4 pricing cards visible | PASS |
| `/#pricing` | CTA buttons visible | PASS |
| `/#pricing` | Monthly toggle values visible | PASS |
| `/#pricing` | Yearly toggle values visible | PASS |
| `/pricing` | 4 pricing cards visible | PASS |
| `/pricing` | CTA buttons visible | PASS |
| `/pricing` | Monthly toggle values visible | PASS |
| `/pricing` | Yearly toggle values visible | PASS |
| `/pricing` | No `Coming Soon` pricing state | PASS |

## Browser Assertion Output

```json
{
  "routes": [
    "/ 200",
    "/pricing 200",
    "/terms 200",
    "/privacy 200",
    "/refund-policy 200"
  ],
  "homeCards": 4,
  "homeButtons": 4,
  "homeMonthly": true,
  "homeYearly": true,
  "pricingCards": 4,
  "pricingButtons": 4,
  "pricingMonthly": true,
  "pricingYearly": true,
  "pricingHasComingSoon": false
}
```

## Build Verification

```text
npm run build
```

Result: PASS.
