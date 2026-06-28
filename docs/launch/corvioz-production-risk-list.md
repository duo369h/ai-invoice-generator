# Corvioz Production Risk List

Generated: 2026-06-20 02:08 CST

## P0: Must Fix Before Broad Paid Launch

1. GA4 is not enabled in production.
   - Evidence: no `NEXT_PUBLIC_GA_ID` in Vercel Production env.
   - Evidence: production HTML has no GA/Plausible/Clarity script.
   - Impact: cannot measure page views, CTA clicks, activation, or conversion.

2. Email delivery is not externally proven.
   - Evidence: Resend env exists and API trigger paths returned success.
   - Gap: no Resend message IDs are returned or stored by the app.
   - Gap: no inbox delivery or Resend event feed was available in this run.
   - Impact: users may assume lead/invoice/quote emails were delivered when they were not.

3. Payment layer is not ready for self-serve monetization.
   - Evidence: payment activation is still manual/beta in docs/pages.
   - Evidence: no verified payment webhook/account upgrade loop.
   - Impact: first revenue is possible manually, but not scalable or self-serve.

4. Production pricing/payment path is inconsistent.
   - Evidence: source pricing page includes Paddle checkout logic.
   - Evidence: live production pricing page emphasizes Start Free/manual-beta style flow.
   - Impact: buyers may not understand whether Pro can be purchased instantly.

## P1: Should Fix Before First External User Cohort

1. Google Fonts are blocked by CSP.
   - Evidence: Playwright console error on `/auth`, `/dashboard`, and `/portal/not-a-real-token`.
   - Impact: visual polish/performance inconsistency; console noise during audits.

2. Full offline reload has no app-level fallback.
   - Evidence: Playwright offline reload of `/dashboard` showed Chrome `ERR_INTERNET_DISCONNECTED`.
   - Impact: acceptable for beta, but weak for perceived stability on bad networks.

3. Rate limiting depends on stable request identity.
   - Prior evidence: fixed `X-Forwarded-For` triggered `429`, normal repeated requests did not always trigger.
   - Impact: abuse protection may be inconsistent depending on Vercel/IP headers.

4. Email failures are caught and logged but not surfaced to the user.
   - Evidence: email send calls are wrapped in `try/catch` and API success does not include email status.
   - Impact: invoice/lead/quote workflows may appear successful even if notification failed.

5. New-user seed data behavior is ambiguous.
   - Evidence: Vercel logs showed `[SEEDING] Initializing demo d...` on first `/api/user`.
   - Impact: demo data can help onboarding, but it must not confuse real user records.

## P2: Monitor During Beta

1. Invalid portal token logs console errors.
   - User-facing UI is friendly: `Access Denied`.
   - Console still logs `Error: Document not found or access denied`.

2. CTA tracking is implemented but inert until analytics env exists.
   - Code has `trackEvent`, but no collector is initialized.

3. Manual activation operations need a runbook.
   - If revenue is collected via PayPal/manual activation, support must track payment, account email, activation time, refund status, and renewal.

4. Dashboard first-run UX is acceptable but not instrumented.
   - First screen has Quick Actions and blank states.
   - No proof of onboarding funnel analytics.

## Current Launch Position

Controlled beta: yes.

Manual first revenue: possible.

Broad paid launch: no.

Reason: core product works, but measurement, email delivery proof, and payment activation are not yet launch-grade.
