# Pricing Render Fix

Date: 2026-07-01

## Problem

The pricing section could render incomplete or blank because the UI depended on `/api/pricing`. In production, `/api/pricing` can return an error when Paddle production price IDs are missing or invalid. That made the pricing section unsuitable for Paddle review because reviewers could not reliably see the plans.

The standalone `/pricing` page also had a first-visit identity gate, which could prevent reviewers from seeing pricing cards immediately.

## Fix

Added UI-only fallback pricing data in:

```text
src/app/page.js
src/app/pricing/page.js
```

The fallback renders:

| Plan | Monthly | Yearly display | CTA |
| --- | ---: | ---: | --- |
| Free | `$0/mo` | `$0/mo` | Get Started / Start Free |
| Starter | `$9/mo` | `$7/mo` | Upgrade |
| Pro | `$19/mo` | `$16/mo` | Upgrade |
| Studio | `$29/mo` | `$24/mo` | Upgrade |

Each card includes:

```text
Name
Price
Feature list
CTA button
Terms / Privacy links
```

## Fallback Behavior

The UI now uses API data when available, but falls back to the review-safe 4-plan set when:

```text
/api/pricing returns non-200
/api/pricing returns success=false
/api/pricing returns missing/empty plans
Studio API price is 0 or missing
```

This does not change Paddle IDs or checkout configuration.

## Toggle Behavior

Monthly / Yearly toggle was verified on:

```text
/
/#pricing
/pricing
```

Expected values:

```text
Monthly: $0, $9, $19, $29
Yearly:  $0, $7, $16, $24
```

Browser verification result: PASS.
