# Pro Billing Cycle

`PRO_BILLING_CYCLE_AUTHORITY=active/trialing subscription current_period_start/current_period_end, with existing account-anniversary fallback when no valid subscription period exists`.

The database and server helper require the current time to be inside the subscription period. No arbitrary rolling 30-day or ±365-day window remains for Pro. The server boundary uses an exclusive end, matching the database row-count interval.
