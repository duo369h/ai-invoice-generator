# Next Step Actions

Date: 2026-07-01
Current phase: Task 1 - Paddle Domain Fix

## Execution Gate

TASK_1_PASS: NO
TASK_2_ALLOWED: NO
TASK_3_ALLOWED: NO

Task 2 and Task 3 were not run because Task 1 has not passed. The remaining blocker is external Paddle-side verification.

## Required Manual / Dashboard Actions

1. Open Paddle production dashboard.
2. Locate production checkout allowed domains / approved domains / website domain settings.
3. Set the primary production domain to:

```text
https://www.corvioz.com
```

4. Remove any apex-only dependency on:

```text
https://corvioz.com
```

5. Confirm Paddle public URLs use `www`:

```text
https://www.corvioz.com/pricing
https://www.corvioz.com/terms
https://www.corvioz.com/privacy
https://www.corvioz.com/refund-policy
```

6. Confirm Paddle webhook endpoint is:

```text
https://www.corvioz.com/api/webhooks/paddle
```

7. If Paddle provides a domain verification file or token, place it only in the static/public path required by Paddle and verify the exact public URL returns `200`.

## Re-Verification Commands

After updating Paddle, verify the public domain behavior again:

```bash
curl -I https://corvioz.com
curl -I https://corvioz.com/pricing
curl -I https://www.corvioz.com
curl -I https://www.corvioz.com/pricing
```

Expected:

```text
https://corvioz.com                 -> 308 to https://www.corvioz.com/
https://corvioz.com/pricing         -> 308 to https://www.corvioz.com/pricing
https://www.corvioz.com             -> 200
https://www.corvioz.com/pricing     -> 200
```

## Required Evidence Before Task 2

Add one of these before proceeding:

| Evidence Type | Required Proof |
| --- | --- |
| Paddle dashboard screenshot/manual confirmation | Shows `https://www.corvioz.com` as the production allowed checkout domain. |
| Paddle API export | Shows production allowed domains include `https://www.corvioz.com`. |
| Paddle support confirmation | Confirms `www.corvioz.com` is the approved checkout origin. |

## Task 2 Preparation Only

Do not execute Task 2 yet. When Task 1 passes, Task 2 should audit these env keys without exposing secret values:

```text
PADDLE_API_KEY
PADDLE_WEBHOOK_SECRET
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
NEXT_PUBLIC_PADDLE_ENV
NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID
NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID
NEXT_PUBLIC_PADDLE_PRO_PRICE_ID
NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID
NEXT_PUBLIC_PADDLE_STUDIO_PRICE_ID
NEXT_PUBLIC_PADDLE_STUDIO_YEARLY_PRICE_ID
```

Known local preflight finding: `.env.example` documents Pro, Studio/Agency, and Growth placeholders, but does not define `NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID` or `NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID`, while the active pricing API and webhook resolver expect the Starter keys.
