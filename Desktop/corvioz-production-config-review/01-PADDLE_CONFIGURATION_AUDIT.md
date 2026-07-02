# Paddle Configuration Audit

Date: 2026-07-01
Scope: Production configuration alignment only. No source code changes, no commits, no deployment.

## Canonical Corvioz Pricing Model

| Plan | Billing | Price | Paddle Product Required | Public Checkout |
| --- | --- | ---: | --- | --- |
| Free | None | $0 | No | No |
| Starter | Monthly | $9 | Yes | Yes |
| Starter | Yearly | $86 | Yes | Yes |
| Pro | Monthly | $19 | Yes | Yes |
| Pro | Yearly | $182 | Yes | Yes |
| Studio | Monthly | $29 | Yes, reserved | No, waitlist |
| Studio | Yearly | $278 | Yes, reserved | No, waitlist |

## Sandbox Catalog Audit

Sandbox is aligned for development and integration testing. These IDs are sandbox-only and must not be used in Vercel Production.

| Item | Status | Action | Notes |
| --- | --- | --- | --- |
| Corvioz Starter product | Active | KEEP | Created in sandbox. Product ID: `pro_01kwe13hck8jrxeqtg7xtvgsj2`. |
| Starter monthly price | Active | KEEP | `$9.00/Monthly`, Price ID: `pri_01kwe1fbepyp43fspcnk5m7e9h`. |
| Starter yearly price | Active | KEEP | `$86.00/Yearly`, Price ID: `pri_01kwe1rech11jngjhycx0kqkna`. |
| Corvioz Pro product | Active | KEEP | Existing sandbox product. Product ID: `pro_01kvtshpp09ymdjvgqq9xd5d0k`. |
| Pro monthly price | Active | KEEP | `$19.00/Monthly`, Price ID: `pri_01kvtsxxmfgp89gsf421r1a644`. |
| Pro yearly price | Active | KEEP | `$182.00/Yearly`, Price ID: `pri_01kwe23kjeva3kgzdyg2a9t33p`. |
| Legacy Studio monthly under Pro | Archived | REMOVE FROM ACTIVE USE | Old `$39.00/Monthly` Studio price under Pro product. Price ID: `pri_01kvttczsy1v09e2fe7rnmkks7`. Correctly archived. |
| Corvioz Studio product | Active | KEEP / WAITLIST | Created in sandbox. Product ID: `pro_01kwe27z6y9zadcvpvqmshybzs`. |
| Studio monthly price | Active | KEEP / RESERVED | `$29.00/Monthly`, Price ID: `pri_01kwe2cjaw10apgjk4qq41rzm9`. Reserved for future Studio opening. |
| Studio yearly price | Active | KEEP / RESERVED | `$278.00/Yearly`, Price ID: `pri_01kwe2fn61dvb7wefd7kd6p0ck`. Reserved for future Studio opening. |

## Live Production Catalog Audit

| Area | Status | Action |
| --- | --- | --- |
| Paddle live verification | In progress | WAIT |
| Live production products | Not verified in this audit | CREATE after Paddle approval if missing |
| Live production price IDs | Not available yet | CREATE after Paddle approval |
| Live checkout readiness | Blocked | Do not redeploy production checkout until live IDs and Vercel env vars are verified |

## Production Rule

Never copy sandbox IDs into Vercel Production. Production must use live `vendors.paddle.com` product and price IDs only.
