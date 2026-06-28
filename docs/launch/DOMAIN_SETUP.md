# Corvioz Domain Setup

Sprint 3 goal: prepare `corvioz.com` for production Vercel deployment.

No product functionality is added in this phase.

## Target Domain

Canonical production domain:

```text
https://www.corvioz.com
```

Secondary domain:

```text
https://www.corvioz.com
```

Expected behavior:

- `www.corvioz.com` is the canonical URL.
- `corvioz.com` redirects to `www.corvioz.com`.
- SSL is active for both apex and `www`.
- App metadata, sitemap, robots, and RSS use `https://www.corvioz.com`.

## Vercel Domain Configuration

In Vercel project settings:

1. Open Project Settings.
2. Go to Domains.
3. Add:

```text
corvioz.com
www.corvioz.com
```

4. Set `www.corvioz.com` as the primary domain.
5. Enable redirect from `corvioz.com` to `www.corvioz.com`.

## DNS Configuration

If using Vercel nameservers:

1. Change the domain registrar nameservers to Vercel nameservers.
2. Let Vercel manage the apex and `www` records.

If keeping external DNS:

1. Point apex `corvioz.com` to Vercel using the DNS records Vercel shows in the Domains screen.
2. Point `www.corvioz.com` to Vercel using the DNS records Vercel shows.
3. Do not guess record values; use the exact values from Vercel's domain verification panel.

## SSL

After DNS is correct:

1. Wait for Vercel domain verification.
2. Confirm Vercel issues SSL certificates for:
   - `corvioz.com`
   - `www.corvioz.com`
3. Confirm both URLs load with HTTPS.

Checks:

```bash
curl -I https://www.corvioz.com
curl -I https://www.corvioz.com
```

Expected:

- No certificate warning.
- `www` redirects to apex.
- Apex returns the production app.

## Canonical URL

Vercel Production env must include:

```bash
NEXT_PUBLIC_SITE_URL=https://www.corvioz.com
```

Code paths using this value:

- `src/app/lib/config.js`
- `src/app/sitemap.js`
- `src/app/robots.js`
- app metadata and RSS surfaces.

Post-deploy checks:

```bash
curl https://www.corvioz.com/sitemap.xml | head
curl https://www.corvioz.com/robots.txt
```

Expected:

- Sitemap URLs use `https://www.corvioz.com`.
- Robots references `https://www.corvioz.com/sitemap.xml`.

## Supabase Auth Redirects

Add both apex and `www` redirect URLs in Supabase Auth:

```text
https://www.corvioz.com/auth
https://www.corvioz.com/dashboard
https://www.corvioz.com/auth
https://www.corvioz.com/dashboard
```

Primary user-facing redirect should land on:

```text
https://www.corvioz.com/dashboard
```

## Domain Status

Current status:

- Canonical env target documented as `https://www.corvioz.com`.
- Vercel domain attachment: pending.
- DNS verification: pending.
- SSL issuance: pending.
- `www` redirect verification: pending.
