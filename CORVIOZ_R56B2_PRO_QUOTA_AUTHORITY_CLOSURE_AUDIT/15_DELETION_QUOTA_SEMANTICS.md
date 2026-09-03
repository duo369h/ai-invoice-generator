# Deletion Quota Semantics

Current behavior counts rows in `public.quotes` and `public.invoices` by `created_at` inside the active cycle. It does not count immutable creation events. Therefore deleting an otherwise eligible current-cycle row removes it from the count and can restore capacity. R56B2 records this existing behavior and does not redesign it. Settled invoice deletion remains protected by the existing payment guardrails.
