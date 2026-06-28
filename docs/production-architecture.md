# Corvioz — Production Architecture

> Last updated: June 2026  
> Status: **Active / Production-ready**

---

## Overview

Corvioz is a freelancer SaaS product built on **Next.js 14 (App Router)**, **Supabase** (Postgres + Auth + RLS), and **Paddle Billing**. This document describes the production system topology, data flow for the revenue funnel, and the entitlement enforcement model.

---

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server Components + API Routes |
| Auth & DB | Supabase (Postgres + RLS) | Service role for webhook writes; anon key for client reads |
| Billing | Paddle Billing (v2 API) | Webhooks for subscription state; Paddle.js for checkout |
| Rate Limiting | Upstash Redis | Per-IP + per-user limits on AI/export endpoints |
| Analytics | GA4 + Microsoft Clarity | Event tracking via `lib/analytics.ts` |
| AI Parsing | DeepSeek API | Optional; falls back to local heuristic parser |
| Hosting | Vercel | Edge config + ISR for public pages |

---

## Subscription Plans

| Plan | Monthly | Yearly | Key Features |
|---|---|---|---|
| **Free** | $0 | $0 | 3 invoices, 2 clients, watermark PDF |
| **Pro** | $12 | $10/mo | Unlimited invoices, client portal, clean PDF |
| **Growth** | $19 | $16/mo | Everything Pro + batch invoicing, automation |
| **Studio** | $29 | $24/mo | Everything Growth + white-label, priority support |

---

## Revenue Funnel — Data Flow

```
User clicks "Get Pro" on /pricing
        │
        ▼
paddle.Checkout.open() ← loadPaddleScript() + NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
        │
        ▼  (real payment completed)
Paddle fires POST /api/webhooks/paddle
        │
        ├─ 1. Verify Paddle-Signature (HMAC-SHA256 + replay-attack check)
        ├─ 2. Idempotency: check billing_events.event_id
        ├─ 3. Resolve user: custom_data.user_id → paddle_customer_id → email
        ├─ 4. Map price ID → plan (Pro / Growth / Studio) via env vars
        ├─ 5. Write: profiles.plan, profiles.paddle_customer_id
        ├─ 6. Write: subscriptions (paddle_subscription_id, period dates)
        ├─ 7. Write: entitlements (feature booleans from getUserEntitlements())
        └─ 8. Write: billing_events (audit log, idempotency key)
        │
        ▼
Dashboard.js calls useUserSubscription() / canAccess()
        │
        ├─ Client path: entitlements table (RLS SELECT) → feature booleans
        └─ Server path: createServiceSupabaseClient() → profiles.plan → getUserEntitlements()
```

---

## Key Files

### Entitlement System

| File | Purpose |
|---|---|
| [`lib/entitlements.ts`](../lib/entitlements.ts) | Single source of truth: `getUserEntitlements(plan)`, `isPaidPlan(plan)`, `canAccess(userId, feature)` |
| [`lib/usage/usageLimiter.ts`](../lib/usage/usageLimiter.ts) | Free-tier usage limits (3 invoices, 2 clients, 0 exports) |
| [`lib/monetization/upgradeTriggers.ts`](../lib/monetization/upgradeTriggers.ts) | Per-action gate checks (invoice, export, client portal, etc.) |

### Billing Backend

| File | Purpose |
|---|---|
| [`src/app/api/webhooks/paddle/route.ts`](../src/app/api/webhooks/paddle/route.ts) | Paddle webhook handler — signature verification, plan mapping, DB writes |
| [`src/app/lib/paddle-client.ts`](../src/app/lib/paddle-client.ts) | Browser-side Paddle.js loader (`loadPaddleScript()`) |

### Frontend Subscription State

| File | Purpose |
|---|---|
| [`src/hooks/useUserSubscription.js`](../src/hooks/useUserSubscription.js) | Client hook: fetches `plan` + `entitlements` from API; exposes `isPaid`, `isAuthenticated` |
| [`src/app/pricing/page.js`](../src/app/pricing/page.js) | Pricing page — uses `useUserSubscription` to show "Current Plan" badge and disable duplicate upgrades |
| [`src/components/dashboard/Dashboard.js`](../src/components/dashboard/Dashboard.js) | Main dashboard — calls `getUserEntitlements()` for initial state; queries `entitlements` table for live state |

### Database

| File | Purpose |
|---|---|
| [`supabase/schema.sql`](../supabase/schema.sql) | Full schema for initial database setup |
| [`supabase/migration-paddle.sql`](../supabase/migration-paddle.sql) | Billing migration: `subscriptions`, `entitlements`, `billing_events`, `pricing_plans` tables |

---

## Database Schema (Billing-Related Tables)

### `profiles` (extended)
```sql
paddle_customer_id TEXT  -- set on first successful webhook
plan TEXT DEFAULT 'free' -- free | pro | growth | studio
```

### `subscriptions`
```sql
user_id UUID
paddle_subscription_id TEXT
price_id TEXT
plan TEXT
status TEXT
current_period_start TIMESTAMPTZ
current_period_end TIMESTAMPTZ
```

### `entitlements`
```sql
user_id UUID
plan TEXT
export_pdf BOOLEAN
client_portal BOOLEAN
crm BOOLEAN
automation BOOLEAN
advanced_invoicing BOOLEAN
unlimited_invoices BOOLEAN
```

### `billing_events` (audit log + idempotency)
```sql
event_id TEXT UNIQUE  -- Paddle's event_id; prevents duplicate processing
event_type TEXT
user_id UUID
payload JSONB
```

### `pricing_plans` (CMS — public read)
```sql
id TEXT PRIMARY KEY  -- 'free' | 'pro' | 'growth' | 'studio'
paddle_monthly_price_id TEXT
paddle_yearly_price_id TEXT
features JSONB
price_monthly NUMERIC
price_yearly NUMERIC
```

---

## Webhook Event Handling

### Handled Events (allowlist)
| Event | Action |
|---|---|
| `subscription.created` | Activate plan, write entitlements |
| `subscription.updated` | Update plan/period, refresh entitlements |
| `subscription.activated` | Activate plan |
| `subscription.canceled` | Downgrade to `free`, clear entitlements |
| `subscription.paused` | Downgrade to `free` |
| `subscription.resumed` | Restore plan |
| `transaction.completed` | Activate plan (one-time or first payment) |
| `payment.completed` | Activate plan |

All other events are acknowledged (`200 OK`) but not processed.

### Plan Resolution Logic (`resolvePlanFromPriceId`)
1. Match against env var–configured price IDs (`NEXT_PUBLIC_PADDLE_*_PRICE_ID`)
2. Fall back to string pattern matching (`id.includes('studio')` etc.)
3. Default to `'pro'` for unknown IDs (logged as warning)

### Security
- **Signature verification**: HMAC-SHA256 with `PADDLE_WEBHOOK_SECRET`; enforced in production, optional in dev
- **Replay attack prevention**: Timestamp check (±5 minutes window)
- **Idempotency**: `billing_events.event_id` unique constraint prevents double-processing

---

## Environment Variables

See [`.env.example`](../.env.example) for the full list. Critical billing vars:

```bash
PADDLE_WEBHOOK_SECRET           # Required in production — webhook signature key
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN # Required — Paddle.js initializer token
NEXT_PUBLIC_PADDLE_ENV          # 'sandbox' | 'production'

# Price IDs (copy from Paddle Dashboard → Catalog → Prices)
NEXT_PUBLIC_PADDLE_PRO_PRICE_ID
NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID
NEXT_PUBLIC_PADDLE_GROWTH_PRICE_ID
NEXT_PUBLIC_PADDLE_GROWTH_YEARLY_PRICE_ID
NEXT_PUBLIC_PADDLE_AGENCY_PRICE_ID
NEXT_PUBLIC_PADDLE_AGENCY_YEARLY_PRICE_ID
```

---

## Deployment Checklist

Before going live, verify each of the following:

- [ ] **Supabase migration applied**: Run `supabase/migration-paddle.sql` in the Supabase SQL Editor
  - Confirm `entitlements` table has `unlimited_invoices` column
  - Confirm `pricing_plans` table is seeded with real Paddle price IDs
- [ ] **Paddle Dashboard**:
  - Webhook URL set to `https://www.corvioz.com/api/webhooks/paddle`
  - Events: `subscription.*`, `transaction.completed`, `payment.completed` enabled
  - `PADDLE_WEBHOOK_SECRET` copied from Paddle → Notifications → Webhook key
- [ ] **Vercel env vars**: All vars from `.env.example` set in Vercel project settings
- [ ] **Price IDs**: All `NEXT_PUBLIC_PADDLE_*_PRICE_ID` vars set to live Paddle price IDs
- [ ] **RLS policies**: Confirm `entitlements`, `subscriptions`, `billing_events` tables have RLS enabled and correct policies
- [ ] **E2E test**: Run `node scripts/revenue-funnel-verify.js` with sandbox credentials

---

## Local Development

```bash
# 1. Copy env template
cp .env.example .env.local

# 2. Fill in Supabase + Paddle sandbox credentials in .env.local
#    Set NEXT_PUBLIC_PADDLE_ENV=sandbox

# 3. Run dev server
npm run dev

# 4. Point Paddle sandbox webhooks to your local tunnel (e.g. ngrok)
#    ngrok http 3000
#    Set webhook URL in Paddle sandbox dashboard to https://<tunnel>/api/webhooks/paddle

# 5. Run E2E revenue funnel test (requires real sandbox credentials)
node scripts/revenue-funnel-verify.js
```

> **Note**: The E2E test (`revenue-funnel-verify.js`) will **fail fast** if `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` is not set to a real sandbox token. Mock event dispatching has been removed.

---

## RLS Policy Summary

| Table | Authenticated User | Service Role |
|---|---|---|
| `subscriptions` | SELECT own rows | ALL |
| `entitlements` | SELECT own rows | ALL |
| `billing_events` | SELECT own rows | ALL |
| `pricing_plans` | SELECT (active=true) | ALL |
| `profiles` | SELECT/UPDATE own row | ALL |
