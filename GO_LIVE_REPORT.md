# GO LIVE REPORT — Corvioz Release Freeze
**Date:** 2026-07-02  
**Engineer:** Release Verification Pass  
**Build:** Next.js 16.2.7 (Turbopack)

---

## 1. BUILD STATUS

| Check | Result |
|---|---|
| `npm run build` | ✅ PASS |
| TypeScript type check | ✅ PASS (after 1 build-fix) |
| Pages compiled | ✅ 1009 pages |
| Entry build guard | ✅ PASS |
| Compilation time | ✅ 4.3s compile / 4.4s static gen |

**Build fix applied:** `src/core/decision/decisionAdapter.ts` — `defaultPricingInput()` was missing the `billingPeriod` field required by `PricingViewModelInput`. Added `billingPeriod: 'monthly'` as a sensible default for the adapter's internal stub. **No pricing logic changed.**

---

## 2. ROUTE STATUS

All required production routes confirmed present in build output:

| Route | Type | Status |
|---|---|---|
| `/` | Static (○) | ✅ |
| `/pricing` | Static (○) | ✅ |
| `/auth` | Static (○) | ✅ |
| `/auth/callback` | Static (○) | ✅ |
| `/signup` | Static (○) | ✅ |
| `/dashboard` | Static (○) | ✅ |
| `/checkout` | Static (○) | ✅ |
| `/terms` | Static (○) | ✅ |
| `/privacy` | Static (○) | ✅ |
| `/api/pricing` | Dynamic (ƒ) | ✅ |
| `/api/auth/*` | Dynamic (ƒ) | ✅ |
| `/api/webhooks/paddle` | Dynamic (ƒ) | ✅ |

No 404s on required routes. No missing pages detected.

---

## 3. PRICING FLOW STATUS

**Pricing Contract Guard v1.1 — 57/57 CHECKS PASSED**

| Layer | Check | Result |
|---|---|---|
| API (`route.js`) | Returns raw plan data only, no price decisions | ✅ |
| API (`route.js`) | Reads Paddle price IDs from DB / env vars | ✅ |
| API (`route.js`) | Production guard: returns 500 if price IDs are placeholder | ✅ |
| `pricingViewModel.ts` | SOLE decision source for `price` and `priceId` | ✅ |
| `pricingViewModel.ts` | `billingPeriod → price` decision owned here | ✅ |
| `pricingViewModel.ts` | `billingPeriod → priceId` decision owned here | ✅ |
| `pricingViewModel.ts` | Deterministic: 5 identical-input runs → identical output | ✅ |
| `page.js` | Consumes `vm.price` only — no re-derivation | ✅ |
| `page.js` | Consumes `vm.priceMeta.priceId` only | ✅ |
| `page.js` | No `billingPeriod → price` selection ternary | ✅ |
| `controller.ts` | Pure Paddle execution, no pricing logic | ✅ |
| `pricingController.ts` | Pure passthrough `(vm) => vm` | ✅ |
| Bilateral consistency | Display price ↔ checkout priceId from same decision | ✅ |

**Flow verified:** `API (raw data) → pricingViewModel (decision) → page.js (render) → controller (execute)`

---

## 4. AUTH STATUS

| Check | Result |
|---|---|
| Auth route exists (`/auth`) | ✅ |
| Auth callback route exists (`/api/auth/callback`) | ✅ |
| Login route exists (`/api/auth/login`) | ✅ |
| Signout route exists (`/api/auth/signout`) | ✅ |
| Supabase URL configured | ✅ |
| Supabase anon key configured | ✅ |
| Supabase service role key configured | ✅ |

> **Note:** Google OAuth and magic link login require live Supabase environment verification (not testable via static build). Auth routes are present and Supabase credentials are configured. Recommend a manual smoke test on staging before final production push.

---

## 5. CHECKOUT STATUS (PADDLE)

| Check | Result |
|---|---|
| Checkout route exists (`/checkout`) | ✅ |
| Paddle webhook route exists (`/api/webhooks/paddle`) | ✅ |
| Checkout page imports `handleUpgradeCheckout` | ✅ |
| `handleUpgradeCheckout` passes `priceId` to Paddle | ✅ |
| `priceId` sourced from `vm.priceMeta.priceId` only | ✅ |
| Paddle price IDs in DB/env (starter, pro) | ⚠️ PLACEHOLDER |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | ⚠️ NOT SET in `.env.local` |
| `NEXT_PUBLIC_PADDLE_ENV` | ⚠️ NOT SET in `.env.local` |
| Production API guard blocks placeholder price IDs | ✅ (returns HTTP 500 if triggered) |

> **Paddle status:** Price IDs (`pri_starter_placeholder`, `pri_pro_placeholder`) are in `FALLBACK_PLANS`. The production API guard at `route.js:154–165` will return HTTP 500 for `/api/pricing` if Paddle price IDs remain as placeholder strings in production. **This is intentional protection.**  
> **Paddle client token and env** must be set in Vercel environment variables (dashboard → Settings → Environment Variables) before the checkout flow will function in production.

---

## 6. BLOCKERS

| # | Blocker | Severity | Scope |
|---|---|---|---|
| B-1 | `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` not set — checkout will not initialize | 🔴 HARD BLOCKER | Vercel env vars |
| B-2 | `NEXT_PUBLIC_PADDLE_ENV` not set — Paddle SDK env undefined | 🔴 HARD BLOCKER | Vercel env vars |
| B-3 | `paddle_monthly_price_id` / `paddle_yearly_price_id` contain `_placeholder` strings — API will return 500 in production | 🔴 HARD BLOCKER | Paddle dashboard → Vercel env vars |

**These blockers are configuration-only. No code changes are required. Resolution:**

1. Create `starter` and `pro` products in Paddle dashboard → copy price IDs
2. Set `NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID`, `NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID`, `NEXT_PUBLIC_PADDLE_PRO_PRICE_ID`, `NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID` in Vercel
3. Set `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` (from Paddle → Developer Tools → Authentication)
4. Set `NEXT_PUBLIC_PADDLE_ENV=production` in Vercel

---

## SUMMARY

| Area | Status |
|---|---|
| Build | ✅ PASS (1009 pages) |
| TypeScript | ✅ PASS |
| Routes | ✅ ALL PRESENT |
| Pricing contract | ✅ 57/57 CHECKS PASSED |
| Auth infrastructure | ✅ CONFIGURED |
| Checkout code | ✅ CORRECT |
| Paddle configuration | ❌ NOT CONFIGURED |

---

# BLOCKED

**Reason:** Paddle production price IDs and client token are not configured.  
The application code is production-ready. The checkout flow is architecturally correct and contract-verified.  
**This is a configuration deployment task, not a code task.**

Once Paddle environment variables are set in Vercel, re-run `verify:pricing-contract` and deploy.
