# Corvioz Blockers List

**Date**: 2026-06-22  
**Phase**: Pre-Launch — Paddle + First 100 Users

---

## Severity Legend

| Symbol | Meaning |
|:---|:---|
| 🔴 | Launch blocker — must fix before real payments |
| 🟡 | High priority — fix before first 100 users |
| 🟢 | Low — acceptable for beta, fix post-launch |

---

## BLOCKER 1: Paddle Environment Variables Not Set

**Severity**: 🔴 Launch Blocker  
**Scope**: Payment system

**Details**:  
All Paddle env vars are empty in production. The code falls back to `'placeholder'` strings. If a real user attempts to upgrade, Paddle will attempt to open a checkout with `token = 'test_token_placeholder'` which will fail silently or throw an error.

**Variables required**:
- `PADDLE_API_KEY`
- `PADDLE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
- `NEXT_PUBLIC_PADDLE_PRO_PRICE_ID`
- `NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID`
- `NEXT_PUBLIC_PADDLE_AGENCY_PRICE_ID`
- `NEXT_PUBLIC_PADDLE_AGENCY_YEARLY_PRICE_ID`

**Resolution**: Set in Vercel/Netlify environment dashboard after Paddle seller approval. These are all handled by Codex / infrastructure.

---

## BLOCKER 2: No Transactional Email System

**Severity**: 🔴 Launch Blocker (for payment flow)  
**Scope**: Post-payment user communication

**Details**:  
`RESEND_API_KEY` is a placeholder. After a user upgrades, they receive:
- No payment confirmation email
- No welcome to Pro email
- No invoice for their subscription

Paddle itself sends a payment receipt, but no product-level onboarding email is delivered. For first users, this creates a trust gap: they paid but got no response from Corvioz.

**Resolution**: Connect Resend (API key is already referenced in `.env.example`). Requires Codex / backend work. Minimum: send a single "You're now on Pro" email triggered from the Paddle webhook handler.

---

## BLOCKER 3: GA4 / Clarity IDs Not Confirmed Set

**Severity**: 🟡 High  
**Scope**: Analytics visibility for first 100 users

**Details**:  
`NEXT_PUBLIC_GA_ID` and `NEXT_PUBLIC_CLARITY_ID` in `.env.example` are blank. Without these, no session recordings or funnel analytics will fire in production. You will be blind during the first 100-user window.

**Resolution**: Set `NEXT_PUBLIC_GA_ID` to your GA4 Measurement ID (e.g. `G-XXXXXXXXXX`) and `NEXT_PUBLIC_CLARITY_ID` in the deployment environment.

---

## BLOCKER 4: Supabase Service Role Key Required for Webhook

**Severity**: 🔴 Functional Blocker  
**Scope**: Paddle webhook → plan update

**Details**:  
The Paddle webhook handler (`/api/webhooks/paddle`) calls `createServiceSupabaseClient()` which requires `SUPABASE_SERVICE_ROLE_KEY`. If this env var is not set in production, every `subscription.activated` event will fail with:

```
Supabase admin client not initialized — 500
```

This means paying users will not have their plan upgraded.

**Resolution**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in the production environment (separate from `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

---

## BLOCKER 5: Webhook Endpoint Not Registered with Paddle

**Severity**: 🔴 Launch Blocker  
**Scope**: Subscription lifecycle

**Details**:  
The webhook route at `/api/webhooks/paddle` exists and is complete, but it must be registered in the Paddle seller dashboard to receive events. Without this:
- Upgrades appear to complete (Paddle checkout succeeds)
- But `subscription.activated` event never arrives
- User plan is never updated in Supabase

**Resolution**: In Paddle seller dashboard → Notifications → Add endpoint: `https://www.corvioz.com/api/webhooks/paddle`. Subscribe to: `subscription.activated`, `subscription.updated`, `subscription.canceled`, `subscription.paused`.

---

## Risk: Onboarding UX — Guest Invoice Limit Not Visible

**Severity**: 🟡 High  
**Scope**: First-time user activation

**Details**:  
A guest user can create invoices with no visible indication of the 5-invoice limit on the free plan. When they hit the export paywall, it may feel abrupt. There is no progress indicator (e.g., "3 of 5 free invoices used").

**Impact**: May create frustration and churn at the exact moment of conversion.

**Resolution**: Dashboard can display a `X of 5 free invoices` counter in the sidebar. Not implemented. *(Post-launch improvement, not a launch blocker.)*

---

## Risk: No Email Collection Before Signup

**Severity**: 🟡 High  
**Scope**: Lead recovery

**Details**:  
Users can create invoices, hit the export paywall, and leave — with no email collected. If they bounce at the export gate, there is no way to re-engage them.

**Resolution**: Add email capture before the export download (optional field, not required). *(Post-launch improvement.)*

---

## Risk: Paddle Yearly Price IDs Missing

**Severity**: 🟡 High  
**Scope**: Revenue

**Details**:  
`.env.example` has `NEXT_PUBLIC_PADDLE_PRO_PRICE_ID` and `NEXT_PUBLIC_PADDLE_AGENCY_PRICE_ID`, but **not** the yearly variants. The code references:
- `NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID`
- `NEXT_PUBLIC_PADDLE_AGENCY_YEARLY_PRICE_ID`

These are missing from `.env.example`. They must be created in Paddle and added to the deployed environment. Without them, yearly billing selection will attempt checkout with a placeholder ID.

**Resolution**: Add yearly price IDs to `.env.example` and deploy to environment.

---

## Risk: Rate Limiting — Upstash Not Confirmed

**Severity**: 🟢 Low  
**Scope**: API abuse

**Details**:  
`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are blank in `.env.example`. The code notes "falls back to in-memory limits" in development. For production with real traffic, Upstash should be connected to prevent API endpoint abuse.

**Resolution**: Connect Upstash Redis instance. Acceptable to defer until first traffic spike.

---

## Summary Table

| # | Blocker | Severity | Owner |
|:--|:---|:---|:---|
| 1 | Paddle env vars not set | 🔴 Launch blocker | Infrastructure / Codex |
| 2 | No transactional email | 🔴 Functional blocker | Backend / Codex |
| 3 | GA4 / Clarity IDs not set | 🟡 High | Infrastructure |
| 4 | Supabase service role key required | 🔴 Functional blocker | Infrastructure |
| 5 | Paddle webhook not registered | 🔴 Launch blocker | Paddle dashboard |
| 6 | No guest usage limit indicator | 🟡 High | UI — post-launch |
| 7 | No pre-export email capture | 🟡 High | UX — post-launch |
| 8 | Yearly Paddle price IDs missing from env | 🟡 High | Infrastructure |
| 9 | Upstash not connected | 🟢 Low | Infrastructure |
