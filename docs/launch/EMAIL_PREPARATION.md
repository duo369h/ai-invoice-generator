# Email Preparation

Sprint 3 does not integrate Resend or any other email sending service.

This document only verifies reserved addresses, env placeholders, and future integration locations.

## Reserved Addresses

Production addresses to reserve:

```text
support@corvioz.com
hello@corvioz.com
billing@corvioz.com
```

## Current Env Placeholders

`.env.example` includes:

```bash
NEXT_PUBLIC_SUPPORT_EMAIL=support@corvioz.com
NEXT_PUBLIC_HELLO_EMAIL=hello@corvioz.com
NEXT_PUBLIC_BILLING_EMAIL=billing@corvioz.com
```

Future Resend placeholders are present but must remain disabled until email is intentionally integrated:

```bash
RESEND_API_KEY=
RESEND_FROM_SUPPORT=support@corvioz.com
RESEND_FROM_BILLING=billing@corvioz.com
```

## Current Application Usage

Current app code reads:

```text
NEXT_PUBLIC_SUPPORT_EMAIL
```

through:

```text
src/app/lib/config.js
```

`hello@corvioz.com` and `billing@corvioz.com` are reserved for production operations and future mail flows. They are not wired to active send logic.

## Future Resend Integration Locations

Do not implement these in Sprint 3. These are only reserved integration points:

- `src/app/lib/email.js`: future server-only mail helper.
- `src/app/api/portal/token/[token]/route.js`: future portal comment notifications after comment persistence succeeds.
- Future Paddle webhook route: future billing receipts and subscription notices after Paddle state is authoritative.
- Auth emails remain handled by Supabase Auth until a deliberate migration is planned.

## DNS Email Records

When email sending is implemented later, configure sender DNS records from the provider dashboard:

- SPF
- DKIM
- DMARC

Do not add guessed email DNS records before a provider is selected and verified.

## Verification Checklist

- `support@corvioz.com` reserved in env docs: yes.
- `hello@corvioz.com` reserved in env docs: yes.
- `billing@corvioz.com` reserved in env docs: yes.
- Resend not integrated: yes.
- No app route sends email in Sprint 3: yes.

Current status:

- Address placeholders documented: yes.
- `.env.example` placeholders present: yes.
- Resend integration: not connected.
- Email sending routes/helpers: not implemented.
