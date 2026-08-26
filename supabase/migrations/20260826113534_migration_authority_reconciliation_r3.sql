-- Migration authority reconciliation R3.
-- billing_events.event_id is already enforced by the baseline UNIQUE constraint
-- billing_events_event_id_key. R2 added a redundant standalone unique index;
-- remove only that redundant index and retain the constraint as the authority.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class idx
    JOIN pg_namespace ns ON ns.oid = idx.relnamespace
    WHERE ns.nspname = 'public'
      AND idx.relname = 'billing_events_event_id_unique'
  )
  AND EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace ns ON ns.oid = t.relnamespace
    WHERE ns.nspname = 'public'
      AND t.relname = 'billing_events'
      AND c.conname = 'billing_events_event_id_key'
      AND c.contype = 'u'
  ) THEN
    DROP INDEX public.billing_events_event_id_unique;
  END IF;
END
$$;
