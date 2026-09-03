# False Unlimited Claim Correction

Current entitlement compatibility field `unlimited_invoices` is false for all plans. Dashboard and current upgrade/copy surfaces no longer promise unlimited documents, invoices, proposals, or billing.

The underlying `src/app/lib/supabase.js` quota implementation was inspected and not changed. No numeric Pro limit was invented, no Pro creation was blocked, and no quota migration was added.
