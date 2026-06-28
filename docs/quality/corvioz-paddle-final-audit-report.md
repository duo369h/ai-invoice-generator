# Corvioz Pre-Paddle Launch Full Audit Report

**Date**: 2026-06-22  
**Auditor**: Pre-Launch Readiness Inspector  
**Verdict**: 🔴 **NOT READY** for Paddle submission (until critical blockers are resolved)

---

## PART 1 — Paddle Compliance Check (Page-Level)

Each public page has been audited against SaaS clarity, marketing claims, and conversion consistency.

### 1. Landing Page (`/`)
* **SaaS Clarity**: ✅ High. The headline ("Create your first invoice.") and subheadline clearly identify it as a focused workspace for freelancers.
* **Marketing Language Risk**: ✅ Safe. No "guaranteed income" or "AI makes money" claims. Copy is focused on utility and freelancer workspace management.
* **Conversion Clarity**: ✅ High. Nav and Hero are focused on the primary `Create Invoice` action.
* **Trust Signals**: ✅ Footer contains active links to legal policies, contact support, and social links. The founder note is present and authentic.

### 2. Pricing Page (`/pricing`)
* **SaaS Clarity**: ✅ High. Transparent 3-tier presentation (Free / Pro / Agency) with monthly/yearly pricing.
* **Marketing Language Risk**: ✅ Safe. Fabricated stats were replaced with factual product guarantees (refund policy, cancel anytime, etc.).
* **Conversion Clarity**: 🟡 Inconsistent CTA wording. The Free plan CTA is labeled `Get Started` on this page, but `Create Invoice` on the Landing Page.
* **Trust Signals**: ✅ Displays a 14-day refund guarantee, trust badges, and testimonials. 

### 3. Checkout Flow (Paddle Integration)
* **SaaS Clarity**: ✅ High. Integration uses native `loadPaddleScript` client SDK popups.
* **Marketing Language Risk**: ✅ Safe.
* **Conversion Clarity**: 🔴 **Critical Blocker**. The client-side handler in `pricing/page.js` does not redirect the user or refresh session state upon `checkout.completed`. The user remains on the pricing page.
* **Trust Signals**: ✅ Uses SSL secured environments and custom metadata linking to the user ID.

### 4. Invoice Create Page (`/invoices/create`)
* **SaaS Clarity**: ✅ High. Loads the interactive freelancer invoice creator directly in guest mode.
* **Marketing Language Risk**: ✅ Safe.
* **Conversion Clarity**: ✅ High. Watermarked PDF export acts as the primary upgrade gate.
* **Trust Signals**: ✅ Shows clear tooltip indicators of watermarking on the free plan.

### 5. Quote Create Page (`/quotes/create`)
* **SaaS Clarity**: ✅ High. Uses identical layout to the invoice generator.
* **Marketing Language Risk**: ✅ Safe.
* **Conversion Clarity**: ✅ High.
* **Trust Signals**: ✅ Consistently labels free plan watermark warnings.

### 6. Client Portal (`/client` & `/portal/[token]`)
* **SaaS Clarity**: ✅ High. Dedicated secure link workspace for client review.
* **Marketing Language Risk**: ✅ Safe.
* **Conversion Clarity**: ✅ High. Direct link using `doc.payment_link` lets clients settle balances with the freelancer.
* **Trust Signals**: ✅ Set to `index: false` to ensure clients' invoices are kept private from search engines.

### 7. Dashboard (`/dashboard`)
* **SaaS Clarity**: ✅ High. Core client, invoice, and quote listing.
* **Marketing Language Risk**: ✅ Safe.
* **Conversion Clarity**: ✅ High. Offers upgrading gates linked to `/pricing`.
* **Trust Signals**: ✅ Verified responsive down to 320px SE viewports.

### 8. Legal & Support Pages (`/terms`, `/privacy`, `/contact`)
* **SaaS Clarity**: ✅ High.
* **Marketing Language Risk**: 🔴 **Critical Blocker**.
  * `/refund-policy` refers to manual PayPal payments and manual activation, contradicting our Paddle integration.
  * `/privacy` refers to PayPal as our payment provider.
  * `/terms` lists only a flat $9/month Pro plan and has no mention of the Agency plan or monthly/yearly pricing toggles.
* **Trust Signals**: ✅ The contact page properly imports and displays the active support email `support@corvioz.com`.

---

## PART 2 — Top 10 Critical Launch Risks

Below are the 10 most critical launch risks ranked by severity.

### 1. Outdated Refund Policy Page
* **Where it appears**: `/refund-policy`
* **Why it matters**: The page references manual PayPal invoices and case-by-case 7-day refunds. This directly conflicts with the 14-day guarantee advertised on the pricing page and our integration with Paddle. Paddle reviewers will reject merchant applications on this basis.
* **Severity**: 🔴 P0 (Compliance Blocker)
* **Suggested Fix**: Update `/refund-policy` to specify a 14-day refund guarantee matching the pricing page and refer to Paddle as the payment partner.

### 2. Missing Redirect/Refresh on Payment Success
* **Where it appears**: `/pricing` (`handleUpgrade`)
* **Why it matters**: On `checkout.completed` event callback, the script only logs a tracking event. The customer is not redirected back to the dashboard, nor is their local cache/session reloaded, leaving them stranded on the pricing page.
* **Severity**: 🔴 P0 (Functional Blocker)
* **Suggested Fix**: In the Paddle callback, redirect the user back to the dashboard with a success parameter, e.g., `window.location.href = '/dashboard?checkout=success'`.

### 3. Outdated Terms of Service
* **Where it appears**: `/terms`
* **Why it matters**: Section 5 states "Pro plan at $9 USD per month" with no mention of the Agency plan ($29/mo) or yearly discount tiers ($7/mo Pro and $24/mo Agency). Payment provider compliance audits require legal agreements to match live pricing models.
* **Severity**: 🟡 P1 (Compliance Risk)
* **Suggested Fix**: Update terms to reflect current live tiers: Free, Pro ($9/mo billed monthly, $7/mo billed yearly), and Agency ($29/mo billed monthly, $24/mo billed yearly).

### 4. Outdated Payment Provider in Privacy Policy
* **Where it appears**: `/privacy`
* **Why it matters**: Mentions PayPal as the billing processor instead of Paddle.
* **Severity**: 🟡 P1 (Compliance Risk)
* **Suggested Fix**: Replace references to PayPal with Paddle in the Service Providers section.

### 5. Placeholder Paddle Keys and Price IDs
* **Where it appears**: `.env.example` / Production environment configuration
* **Why it matters**: Paddle token and plan keys fall back to `'test_token_placeholder'` and `'pri_pro_placeholder'`. Real checkouts will crash in production.
* **Severity**: 🔴 P0 (Launch Blocker)
* **Suggested Fix**: Create production price IDs in Paddle dashboard and configure variables in the production host (Vercel).

### 6. Transactional Emails Not Configured
* **Where it appears**: `src/app/lib/email.js`
* **Why it matters**: Upgraded users do not receive automated payment confirmations or pro welcome emails because the Resend API key is a placeholder.
* **Severity**: 🟡 P1 (UX Risk)
* **Suggested Fix**: Connect Resend API key and verify domain sender setup.

### 7. Free Tier CTA Inconsistency
* **Where it appears**: `/` vs `/pricing`
* **Why it matters**: Free tier CTA on `/` is `Create Invoice` but on `/pricing` is `Get Started`. Confuses the guest flow.
* **Severity**: 🟢 P2 (UX Polish)
* **Suggested Fix**: Align Free plan CTA label to be `Create Invoice` across both pages.

### 8. Lack of Guest Usage Limit Indicator
* **Where it appears**: `/invoices/create` / `/quotes/create` (Dashboard in guest mode)
* **Why it matters**: Guest users can draft up to 5 documents before hitting a limit, but have no visual indicators in the sidebar warning them of this limit. The paywall feels abrupt at export.
* **Severity**: 🟢 P2 (UX Friction)
* **Suggested Fix**: Display a document usage counter (e.g. `Draft 2 of 5`) in the guest dashboard sidebar.

### 9. Lack of Pre-Export Email Capture
* **Where it appears**: Document export modal
* **Why it matters**: If a guest user gets blocked by the upgrade/signup gate during export and bounces, we have captured zero contact information to re-engage them.
* **Severity**: 🟢 P2 (Growth Risk)
* **Suggested Fix**: Add an optional email input field to "Save Draft & Send Link" before showing the upgrade gate.

### 10. Default Sandbox Configuration
* **Where it appears**: `/pricing` (Paddle Initialization)
* **Why it matters**: The script uses `process.env.NEXT_PUBLIC_PADDLE_ENV || 'sandbox'`. If the production host environment variable is omitted, checkouts will run in sandbox mode live.
* **Severity**: 🟡 P1 (Launch Risk)
* **Suggested Fix**: Double-check Vercel deployment variables to ensure `NEXT_PUBLIC_PADDLE_ENV` is set to `production`.

---

## PART 3 — Page Consistency Report

The following inconsistencies have been identified across audited files:

1. **CTA Labels**:
   * **Inconsistent Free Plan CTA**: Landing Page lists `Create Invoice`, Pricing Page lists `Get Started`.
   * **Inconsistent SEO pages CTA**: Programmatic pages `/invoice-template` and `/freelancers/*` list `Start Free` instead of `Create Invoice` or `Get Started`. (Acceptable for search traffic intent, but flagged).
2. **Pricing Mismatch**:
   * **ToS vs Pricing page**: Terms only state "Pro plan at $9/mo", omitting the $29/mo Agency plan and yearly plans.
   * **Refund Policy vs Pricing page**: Refund policy mentions case-by-case 7-day refunds, while pricing lists a 14-day refund guarantee.
3. **Payment Processor Inconsistency**:
   * Privacy Policy and Refund Policy reference PayPal. The live site integrates Paddle.
