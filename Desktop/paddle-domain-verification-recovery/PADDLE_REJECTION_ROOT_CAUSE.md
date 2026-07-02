# Paddle Rejection Root Cause

Date: 2026-07-01
Task type: Payment infrastructure recovery. No source code changes, no deployment.

## Root Cause

Paddle was given the apex domain and apex URLs:

- `corvioz.com`
- `https://corvioz.com/pricing`
- `https://corvioz.com/terms`
- `https://corvioz.com/privacy`
- `https://corvioz.com/refund-policy`

But the active production domain is:

- `https://www.corvioz.com`

The apex domain is not the active checkout host. It redirects to `www`.

## Evidence

| Check | Result |
| --- | --- |
| `https://corvioz.com` | `308` redirect to `https://www.corvioz.com/` |
| `https://www.corvioz.com` | `200` |
| `https://corvioz.com/pricing` | `308` redirect to `https://www.corvioz.com/pricing` |
| `https://www.corvioz.com/pricing` | `200` |
| `https://www.corvioz.com/terms` | `200` |
| `https://www.corvioz.com/privacy` | `200` |
| `https://www.corvioz.com/refund-policy` | `200` |
| `https://www.corvioz.com/robots.txt` | Uses `Host: https://www.corvioz.com` and `Sitemap: https://www.corvioz.com/sitemap.xml` |
| `https://www.corvioz.com/sitemap.xml` | Uses `https://www.corvioz.com` URLs |

## Rejection Diagnosis

Most likely rejection reason:

`PADDLE_DOMAIN_MISMATCH_APEX_VS_WWW`

Paddle domain approval is exact-host sensitive. The configured Paddle domain and policy URLs should match the live checkout origin exactly. Corvioz currently uses `www.corvioz.com` as the production host, while the submitted Paddle configuration used `corvioz.com`.

## Secondary Risk

No Paddle domain verification file was found in the app public/static paths during local inspection.

If Paddle supplied a verification file or token, it has not been confirmed as deployed at a public URL. This is a secondary risk because the observed rejection can already be explained by the apex-vs-www mismatch.

## Not The Root Cause

| Hypothesis | Finding |
| --- | --- |
| Production site down | Not supported. `https://www.corvioz.com` returns `200`. |
| Pricing page missing | Not supported. `https://www.corvioz.com/pricing` returns `200`. |
| Legal pages missing | Not supported. Terms, Privacy, and Refund policy all return `200` on `www`. |
| HTTPS failure | Not supported for `www`; HTTPS is working. |
| Sandbox failure | Not supported. Sandbox remains functional and separate from live domain verification. |
