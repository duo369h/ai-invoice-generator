# Corvioz Production Environment Setup Guide

Audience: non-technical founder

Goal: enable production signup, login, dashboard data, rate limiting, email notifications, and analytics for `https://www.corvioz.com`.

## Current Status

Deployment is complete. Domain, sitemap, robots, and canonical metadata are live.

The remaining blocker is environment variables.

Current Vercel production status:

```text
No Environment Variables found for jianxu-han-s-projects/corvioz
```

This means the live website can load public pages, but production signup, login, dashboard, email, analytics, and rate limiting are not fully connected yet.

## Very Important Rules

1. Do not paste secret keys into ChatGPT, public docs, screenshots, or emails.
2. Add secrets only inside Vercel Project Settings -> Environment Variables.
3. Use the `Production` environment in Vercel.
4. After adding or changing variables, redeploy the site.
5. Public variables start with `NEXT_PUBLIC_`. Secret server variables do not.

## How To Open Vercel Environment Variables

1. Go to [vercel.com](https://vercel.com).
2. Log in with the account that owns the Corvioz project.
3. Open team/project area: `jianxu-han-s-projects`.
4. Open project: `corvioz`.
5. Click `Settings`.
6. Click `Environment Variables`.
7. For each variable below:
   - enter the variable name in `Key`;
   - paste the value in `Value`;
   - select `Production`;
   - click `Save`.
8. When all required variables are added, redeploy the production site.

## Local Values Already Found

Checked locally without printing secret values.

| Variable | Local status | Use for production? |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Present | Yes |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Present | Yes |
| `NEXT_PUBLIC_HELLO_EMAIL` | Present | Yes |
| `NEXT_PUBLIC_BILLING_EMAIL` | Present | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Present | Yes, if this is the production Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Present | Yes, if this is the production Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | Present | Yes, if this is the production Supabase project |
| `UPSTASH_REDIS_REST_URL` | Empty | No, create/copy from Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Empty | No, create/copy from Upstash |
| `RESEND_API_KEY` | Not present | No, create/copy from Resend |
| `RESEND_FROM_SUPPORT` | Present in example | Use after sender/domain is verified |
| `RESEND_FROM_BILLING` | Present in example | Use after sender/domain is verified |
| `NEXT_PUBLIC_GA_ID` | Empty in example, not present locally | Create/copy from GA4 |

## Required Production Variables

Add these to Vercel Production.

### Core Site Variables

| Variable | Value | Required | Where to place it | How to verify |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://www.corvioz.com` | Yes | Vercel -> Corvioz -> Settings -> Environment Variables -> Production | Live sitemap, robots, canonical, and email links use `https://www.corvioz.com`. |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | `support@corvioz.com` or your real support mailbox | Yes | Vercel Production | Public support/legal pages show the correct support email. |
| `NEXT_PUBLIC_HELLO_EMAIL` | `hello@corvioz.com` or your real hello mailbox | Yes | Vercel Production | Public contact surfaces show the correct hello email. |
| `NEXT_PUBLIC_BILLING_EMAIL` | `billing@corvioz.com` or your real billing mailbox | Yes | Vercel Production | Billing/legal surfaces show the correct billing email. |

## Supabase Variables

Purpose: enables signup, login, user profiles, dashboard, leads, quotes, invoices, and portal data.

### Where To Get Supabase Values

1. Go to [supabase.com](https://supabase.com).
2. Log in.
3. Open the production Corvioz project.
4. Go to `Project Settings`.
5. Open `API`.
6. Copy:
   - Project URL
   - anon public key
   - service_role key

### Supabase Variables To Add

| Variable | Where to obtain it | Required | Where to place it in Vercel | How to verify |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase -> Project Settings -> API -> Project URL | Yes | Vercel Production | `https://www.corvioz.com/api/user` changes from `503 production persistence is not configured` to `401` when not logged in. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase -> Project Settings -> API -> anon public key | Yes | Vercel Production | Signup/login page can connect to Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase -> Project Settings -> API -> service_role key | Yes | Vercel Production only | Dashboard and portal server operations work. Never expose this in browser or docs. |

### Supabase Verification Steps

After adding the variables and redeploying:

1. Open `https://www.corvioz.com/api/user` in a private/incognito browser.
2. Expected result when not logged in:

```json
{"error":"Authentication required to access user profile."}
```

3. The status should be `401`, not `503`.
4. Create or use a confirmed Supabase test user.
5. Log in at `https://www.corvioz.com/auth`.
6. Open the dashboard.
7. Confirm dashboard data loads instead of showing persistence configuration errors.

Advanced verification command:

```bash
CORVIOZ_BASE_URL=https://www.corvioz.com \
CORVIOZ_TEST_EMAIL=confirmed-test-user@example.com \
CORVIOZ_TEST_PASSWORD='replace-with-test-password' \
npm run verify:production-loop
```

## Upstash Variables

Purpose: enables production-safe rate limiting. Without Upstash, production API routes can fail or rate-limit incorrectly.

### Where To Get Upstash Values

1. Go to [upstash.com](https://upstash.com).
2. Log in.
3. Create or open the Corvioz Redis database.
4. Choose a region near Vercel production if possible.
5. Open the database details page.
6. Find the `REST URL` and `REST Token`.

### Upstash Variables To Add

| Variable | Where to obtain it | Required | Where to place it in Vercel | How to verify |
| --- | --- | --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis database -> REST URL | Yes | Vercel Production | Public API routes stop returning unexpected `429` immediately after normal requests. |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis database -> REST Token | Yes | Vercel Production | Rate limiting works across production requests. |

### Upstash Verification Steps

After adding the variables and redeploying:

1. Open:

```text
https://www.corvioz.com/api/freelancers
```

2. Expected result:
   - not `429` on the first normal request;
   - should return a JSON list or an empty JSON list.
3. Refresh once or twice.
4. It should still not block normal usage.

## Resend Variables

Purpose: enables production email notifications, such as lead alerts, quote/invoice emails, and portal updates.

### Where To Get Resend Values

1. Go to [resend.com](https://resend.com).
2. Log in.
3. Add and verify the Corvioz sending domain, usually `corvioz.com`.
4. Follow Resend's DNS instructions at your DNS provider.
5. Wait until Resend shows the domain as verified.
6. Go to `API Keys`.
7. Create a production API key.
8. Copy the API key once and store it securely.

### Resend Variables To Add

| Variable | Where to obtain it | Required | Where to place it in Vercel | How to verify |
| --- | --- | --- | --- | --- |
| `RESEND_API_KEY` | Resend -> API Keys -> production API key | Yes | Vercel Production only | A real test email is accepted by Resend and received in a test inbox. |
| `RESEND_FROM_SUPPORT` | Verified Resend sender, recommended `support@corvioz.com` | Yes for email launch | Vercel Production | Welcome/support emails use the correct sender. |
| `RESEND_FROM_BILLING` | Verified Resend sender, recommended `billing@corvioz.com` | Yes for email launch | Vercel Production | Quote/invoice emails use the correct sender. |

### Resend Verification Steps

After adding the variables and redeploying:

1. Confirm the sending domain is verified in Resend.
2. Create a production test user.
3. Trigger an email-producing action, such as quote/invoice sending.
4. Check Resend dashboard:
   - the email should appear as sent or delivered;
   - it should not be missing.
5. Check the recipient inbox.
6. Confirm the email arrived and links point to `https://www.corvioz.com`.

Expected behavior if Resend is missing:

- Corvioz should fail visibly.
- It should not pretend the email was sent.

## GA4 Variables

Purpose: enables Google Analytics 4 traffic and conversion tracking.

### Where To Get GA4 Values

1. Go to [analytics.google.com](https://analytics.google.com).
2. Open or create the Corvioz GA4 property.
3. Go to `Admin`.
4. Under `Data collection and modification`, open `Data streams`.
5. Select the web stream for `https://www.corvioz.com`.
6. Copy the Measurement ID.
7. It looks like `G-XXXXXXXXXX`.

### GA4 Variable To Add

| Variable | Where to obtain it | Required | Where to place it in Vercel | How to verify |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_GA_ID` | GA4 -> Admin -> Data streams -> Web stream -> Measurement ID | Yes for analytics | Vercel Production | GA4 Realtime or DebugView receives `page_view` events. |

### GA4 Verification Steps

After adding the variable and redeploying:

1. Open `https://www.corvioz.com`.
2. In GA4, open `Reports -> Realtime`.
3. Visit several pages:
   - homepage;
   - invoice generator;
   - quote generator;
   - pricing;
   - auth page.
4. Confirm active users or page views appear in GA4.
5. If no events appear after a few minutes:
   - confirm the Vercel variable name is exactly `NEXT_PUBLIC_GA_ID`;
   - confirm the value starts with `G-`;
   - confirm the site was redeployed after adding the variable.

## Recommended Setup Order

Do the setup in this order:

1. Add Core Site variables.
2. Add Supabase variables.
3. Add Upstash variables.
4. Redeploy.
5. Verify signup, login, dashboard, and public APIs.
6. Add Resend variables.
7. Redeploy.
8. Verify real email sending.
9. Add GA4 variable.
10. Redeploy.
11. Verify GA4 Realtime.

## How To Redeploy After Adding Variables

Option A: Vercel website

1. Open Vercel.
2. Open project `corvioz`.
3. Go to `Deployments`.
4. Find the latest production deployment.
5. Click the three-dot menu.
6. Click `Redeploy`.
7. Keep production target selected.
8. Wait until the deployment says `Ready`.

Option B: local command

```bash
npx vercel --prod --yes
```

Use this only from the Corvioz project folder.

## Final Production Verification Checklist

After all required variables are configured and the site is redeployed:

- [ ] `https://www.corvioz.com` loads.
- [ ] `https://corvioz.com` redirects to `https://www.corvioz.com/`.
- [ ] `https://www.corvioz.com/sitemap.xml` has 821 URLs.
- [ ] `https://www.corvioz.com/robots.txt` points to the `www` sitemap.
- [ ] `https://www.corvioz.com/api/user` returns `401` when logged out, not `503`.
- [ ] A new user can sign up.
- [ ] A confirmed user can log in.
- [ ] Dashboard loads real user data.
- [ ] User can create a public profile.
- [ ] Public lead form can submit a lead.
- [ ] Dashboard shows the new lead.
- [ ] User can create a quote.
- [ ] User can create an invoice.
- [ ] Client portal opens with a valid token.
- [ ] Email notification is sent and received.
- [ ] GA4 Realtime shows page views.

## What Success Looks Like

Corvioz is ready for real freelancer beta testing when:

1. Vercel Production has all required env variables.
2. The site has been redeployed after env setup.
3. Supabase signup/login works.
4. Dashboard data persists.
5. Public lead capture works.
6. Quote and invoice creation work.
7. Client portal works.
8. Resend sends real emails.
9. GA4 receives live traffic.

Until then, Corvioz is deployed publicly but not fully production-ready.

