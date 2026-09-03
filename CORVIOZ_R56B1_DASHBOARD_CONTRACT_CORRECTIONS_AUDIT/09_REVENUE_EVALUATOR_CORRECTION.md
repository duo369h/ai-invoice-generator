# Legacy Revenue Evaluator Correction

`src/app/api/revenue/evaluate/route.js` no longer independently enforces stale Free per-type limits for `create_invoice` or `create_quote`. Those actions return the canonical-document-authority explanation while atomic server/database creation remains the enforcement authority.

PDF export is allowed by the evaluator and branding is left to the current plan contract. Portal is neutral unavailable and does not redirect or upsell to Pro. This is a narrow reconciliation, not a Revenue System rewrite.
