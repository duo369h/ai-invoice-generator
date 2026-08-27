-- Read-only gate report. Run with psql -v ON_ERROR_STOP=1.
WITH expected(version) AS (
  VALUES ('20260710202115'),('20260711181554'),('20260711183628'),
         ('20260711192505'),('20260725213909'),('20260729135940'),
         ('20260815142927'),('20260821174436'),('20260821185325'),
         ('20260821190820'),('20260821191944')
), actual AS (
  SELECT version FROM supabase_migrations.schema_migrations
), gates AS (
  SELECT 'history_exact_11' AS gate,
    CASE WHEN (SELECT count(*) FROM actual)=11
           AND NOT EXISTS (SELECT 1 FROM expected e WHERE NOT EXISTS (SELECT 1 FROM actual a WHERE a.version=e.version))
           AND NOT EXISTS (SELECT 1 FROM actual a WHERE NOT EXISTS (SELECT 1 FROM expected e WHERE e.version=a.version))
         THEN 'PASS' ELSE 'FAIL' END AS status,
    'expected Production migration authority remains the exact 11-state baseline' AS detail
  UNION ALL SELECT 'document_usage_events_absent', CASE WHEN to_regclass('public.document_usage_events') IS NULL THEN 'PASS' ELSE 'FAIL' END, 'usage table must still be absent before promotion'
  UNION ALL SELECT 'usage_rpcs_absent', CASE WHEN NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('create_document_with_usage','resolve_free_document_usage_cycle')) THEN 'PASS' ELSE 'FAIL' END, 'usage RPCs must still be absent before promotion'
  UNION ALL SELECT 'subscriptions_paddle_price_id_absent', CASE WHEN NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.subscriptions'::regclass AND attname='paddle_price_id' AND NOT attisdropped) THEN 'PASS' ELSE 'FAIL' END, 'R9 compatibility column must not already exist'
  UNION ALL SELECT 'subscription_user_duplicates_zero', CASE WHEN NOT EXISTS (SELECT 1 FROM public.subscriptions GROUP BY user_id HAVING count(*)>1) THEN 'PASS' ELSE 'FAIL' END, 'one current subscription row per user'
  UNION ALL SELECT 'populated_paddle_subscription_duplicates_zero', CASE WHEN NOT EXISTS (SELECT 1 FROM (SELECT NULLIF(BTRIM(paddle_subscription_id),'') AS paddle_id FROM public.subscriptions WHERE NULLIF(BTRIM(paddle_subscription_id),'') IS NOT NULL GROUP BY 1 HAVING count(*)>1) d) THEN 'PASS' ELSE 'FAIL' END, 'populated Paddle subscription IDs must be unique'
  UNION ALL SELECT 'entitlement_user_duplicates_zero', CASE WHEN NOT EXISTS (SELECT 1 FROM public.entitlements GROUP BY user_id HAVING count(*)>1) THEN 'PASS' ELSE 'FAIL' END, 'entitlement authority must be one row per user'
  UNION ALL SELECT 'billing_event_semantic_unique', CASE WHEN EXISTS (SELECT 1 FROM pg_index ix WHERE ix.indrelid='public.billing_events'::regclass AND ix.indisunique AND ix.indpred IS NULL AND ix.indexprs IS NULL AND ix.indnkeyatts=1 AND ix.indkey[0]=(SELECT attnum FROM pg_attribute WHERE attrelid='public.billing_events'::regclass AND attname='event_id')) THEN 'PASS' ELSE 'FAIL' END, 'event_id must already have semantic full-column uniqueness'
  UNION ALL SELECT 'redundant_event_index_absent', CASE WHEN NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace='public'::regnamespace AND relname='billing_events_event_id_unique' AND relkind='i') THEN 'PASS' ELSE 'FAIL' END, 'R9 must not inherit the old redundant standalone index'
  UNION ALL SELECT 'r1_entitlement_fields_absent', CASE WHEN NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.entitlements'::regclass AND attname IN ('invoice','quote','pdf_branding','client_approval','approval_scope') AND NOT attisdropped) THEN 'PASS' ELSE 'FAIL' END, 'R1 fields must still be pending'
  UNION ALL SELECT 'record_invoice_payment_7_present', CASE WHEN to_regprocedure('public.record_invoice_payment(uuid,uuid,integer,text,text,timestamptz,text)') IS NOT NULL THEN 'PASS' ELSE 'FAIL' END, 'seven-parameter payment authority must remain'
  UNION ALL SELECT 'quote_invoice_fk_present', CASE WHEN EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.invoices'::regclass AND c.confrelid='public.quotes'::regclass AND c.contype='f') THEN 'PASS' ELSE 'FAIL' END, 'Quote -> Invoice foreign-key authority must remain'
  UNION ALL SELECT 'relevant_objects_present', CASE WHEN to_regclass('public.profiles') IS NOT NULL AND to_regclass('public.subscriptions') IS NOT NULL AND to_regclass('public.entitlements') IS NOT NULL AND to_regclass('public.billing_events') IS NOT NULL AND to_regclass('public.quotes') IS NOT NULL AND to_regclass('public.invoices') IS NOT NULL AND to_regclass('public.invoice_payments') IS NOT NULL THEN 'PASS' ELSE 'FAIL' END, 'all migration dependencies must be present'
)
SELECT gate,status,detail FROM gates ORDER BY gate;
