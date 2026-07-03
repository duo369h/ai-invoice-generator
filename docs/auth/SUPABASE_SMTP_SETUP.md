# Production SMTP Setup for Supabase Auth in Corvioz

By default, Supabase projects use a built-in email provider with strict rate limits (typically 3 emails per hour). This default setup is intended only for development and is highly unreliable for production use. In production, transactional confirmation emails must be sent through a dedicated, custom SMTP provider.

---

## 1. Why Custom SMTP is Required
- **Reliability:** Supabase default email limits prevent signup scale and increase spam risk.
- **Domain Alignment:** Custom SMTP allows transactional emails to come directly from `@corvioz.com` (e.g., `noreply@corvioz.com` or `support@corvioz.com`), which is crucial for brand trust.
- **Note on Cloudflare:** Cloudflare Email Routing is **receive-only**; it cannot be used to send outbound SMTP mail.

---

## 2. Recommended SMTP Providers
We recommend the following transactional email providers:
- **Resend** (Recommended for developers, simple API & SMTP setup)
- **Postmark** (Exceptional deliverability, fast delivery)
- **Mailgun** (High volume, robust routing)
- **Amazon SES** (Highly cost-effective, requires manual AWS sandbox approval)

---

## 3. Configuration Steps in Supabase

1. **Access Settings:**
   Go to your [Supabase Dashboard](https://supabase.com/dashboard) -> Select your Project -> Navigate to **Authentication** -> **Emails** / **SMTP Settings**.

2. **Enable Custom SMTP:**
   Toggle the **Enable Custom SMTP** switch to `ON`.

3. **Configure Connection Properties:**
   Fill in the credentials provided by your SMTP service (do not use real secrets in source control):
   - **SMTP Host:** e.g., `smtp.resend.com` or `smtp.postmarkapp.com`
   - **Port:** `587` (StartTLS recommended) or `465` (SSL)
   - **Username:** e.g., `resend` or your Postmark API token
   - **Password:** Your SMTP/API secret key
   - **Sender Email:** `noreply@corvioz.com` or `support@corvioz.com` (Must match a domain verified in your SMTP account)
   - **Sender Name:** `Corvioz` or `Corvioz Support`

4. **Save Changes:**
   Click **Save** at the bottom of the page.

---

## 4. Required DNS Records (Deliverability Checklist)
To prevent your verification emails from landing in users' spam folders, add these records to your DNS provider (e.g., Cloudflare, GoDaddy):

- **SPF (Sender Policy Framework):**
  Add a TXT record for your domain authorizing your SMTP provider to send emails.
  - *Example:* `v=spf1 include:amazonses.com ~all` or `v=spf1 include:spf.providers.com ~all`

- **DKIM (DomainKeys Identified Mail):**
  Add the CNAME or TXT records provided by your SMTP provider to sign and verify emails digitally.

- **DMARC (Domain-based Message Authentication, Reporting, and Conformance):**
  Add a TXT record at host `_dmarc.corvioz.com` to specify how email receivers should handle mail that fails SPF/DKIM checks.
  - *Example (Monitoring/Relaxed Policy):* `v=DMARC1; p=none; rua=mailto:dmarc-reports@corvioz.com;`

---

## 5. Verification Checklist
Once configured, test the following user flows to verify SMTP is working:
- [ ] **New User Signup:** Create a new account with email/password and verify that the confirmation email is delivered instantly to the inbox.
- [ ] **Password Reset:** Use the "Forgot Password" flow to send a reset link.
- [ ] **Magic Link Login:** Request a magic link to sign in passwordless.
- [ ] **Email Change:** Verify updating a user's email address from the dashboard settings.
