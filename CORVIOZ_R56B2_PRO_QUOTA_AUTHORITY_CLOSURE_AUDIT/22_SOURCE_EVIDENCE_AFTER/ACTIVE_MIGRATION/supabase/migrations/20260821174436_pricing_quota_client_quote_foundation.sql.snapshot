SET lock_timeout = '10s';

-- 1) Pricing V2 plan compatibility on live profile/subscription state.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'agency', 'studio'));

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'agency', 'studio'));

-- 2) Phase 1 Client -> Quote foundation. Keep existing quote snapshot fields and add a nullable client link.
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS client_id UUID,
  ADD COLUMN IF NOT EXISTS business_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS business_email TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS business_address TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'quotes'
      AND c.conname = 'quotes_client_id_fkey'
  ) THEN
    ALTER TABLE public.quotes
      ADD CONSTRAINT quotes_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON public.quotes(client_id);

-- 3) Non-drifting account-anniversary helper, anchored in UTC.
CREATE OR REPLACE FUNCTION public.get_clamped_anniversary_timestamptz(
  p_anchor TIMESTAMPTZ,
  p_month_offset INT
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
IMMUTABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_anchor_utc TIMESTAMP;
  v_target_month TIMESTAMP;
  v_last_day INT;
BEGIN
  IF p_anchor IS NULL THEN
    RETURN NULL;
  END IF;

  v_anchor_utc := p_anchor AT TIME ZONE 'UTC';
  v_target_month := date_trunc('month', v_anchor_utc) + make_interval(months => p_month_offset);
  v_last_day := EXTRACT(DAY FROM (date_trunc('month', v_target_month) + INTERVAL '1 month - 1 day'))::INT;

  RETURN make_timestamptz(
    EXTRACT(YEAR FROM v_target_month)::INT,
    EXTRACT(MONTH FROM v_target_month)::INT,
    LEAST(EXTRACT(DAY FROM v_anchor_utc)::INT, v_last_day),
    EXTRACT(HOUR FROM v_anchor_utc)::INT,
    EXTRACT(MINUTE FROM v_anchor_utc)::INT,
    EXTRACT(SECOND FROM v_anchor_utc)::DOUBLE PRECISION,
    'UTC'
  );
END;
$$;

-- 4) Database-authoritative document cycle. Starter prefers the live subscription period;
--    Free and fallback Starter use the profile account anniversary. Pro/legacy paid tiers are unlimited.
CREATE OR REPLACE FUNCTION public.get_user_active_document_cycle(
  p_user_id UUID
)
RETURNS TABLE (
  cycle_start TIMESTAMPTZ,
  cycle_end TIMESTAMPTZ,
  doc_limit INT
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_plan TEXT;
  v_anchor TIMESTAMPTZ;
  v_now TIMESTAMPTZ := CURRENT_TIMESTAMP;
  v_sub_start TIMESTAMPTZ;
  v_sub_end TIMESTAMPTZ;
  v_month_offset INT;
  v_cycle_start TIMESTAMPTZ;
  v_cycle_end TIMESTAMPTZ;
  v_limit INT;
BEGIN
  SELECT lower(COALESCE(p.plan, 'free')), COALESCE(p.created_at, v_now)
    INTO v_plan, v_anchor
  FROM public.profiles p
  WHERE p.id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_plan IN ('pro', 'agency', 'studio') THEN
    RETURN QUERY SELECT NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ, NULL::INT;
    RETURN;
  END IF;

  IF v_plan = 'starter' THEN
    v_limit := 30;

    SELECT s.current_period_start, s.current_period_end
      INTO v_sub_start, v_sub_end
    FROM public.subscriptions s
    WHERE s.user_id = p_user_id
      AND lower(COALESCE(s.plan, '')) = 'starter'
      AND s.status IN ('active', 'trialing')
      AND s.current_period_start IS NOT NULL
      AND s.current_period_end IS NOT NULL
      AND s.current_period_start <= v_now
      AND s.current_period_end > v_now
    ORDER BY s.current_period_end DESC
    LIMIT 1;

    IF v_sub_start IS NOT NULL AND v_sub_end IS NOT NULL THEN
      RETURN QUERY SELECT v_sub_start, v_sub_end, v_limit;
      RETURN;
    END IF;
  ELSE
    v_limit := 5;
  END IF;

  v_month_offset := GREATEST(
    0,
    (EXTRACT(YEAR FROM (v_now AT TIME ZONE 'UTC'))::INT - EXTRACT(YEAR FROM (v_anchor AT TIME ZONE 'UTC'))::INT) * 12
    + (EXTRACT(MONTH FROM (v_now AT TIME ZONE 'UTC'))::INT - EXTRACT(MONTH FROM (v_anchor AT TIME ZONE 'UTC'))::INT)
  );

  v_cycle_start := public.get_clamped_anniversary_timestamptz(v_anchor, v_month_offset);
  IF v_cycle_start > v_now AND v_month_offset > 0 THEN
    v_month_offset := v_month_offset - 1;
    v_cycle_start := public.get_clamped_anniversary_timestamptz(v_anchor, v_month_offset);
  END IF;

  v_cycle_end := public.get_clamped_anniversary_timestamptz(v_anchor, v_month_offset + 1);
  WHILE v_cycle_end <= v_now LOOP
    v_month_offset := v_month_offset + 1;
    v_cycle_start := v_cycle_end;
    v_cycle_end := public.get_clamped_anniversary_timestamptz(v_anchor, v_month_offset + 1);
  END LOOP;

  RETURN QUERY SELECT v_cycle_start, v_cycle_end, v_limit;
END;
$$;

-- 5) Atomic Quote creation: derive plan/cycle inside DB, serialize by user, count Quote+Invoice together.
CREATE OR REPLACE FUNCTION public.check_and_create_quote(
  p_user_id UUID,
  p_quote_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cycle_start TIMESTAMPTZ;
  v_cycle_end TIMESTAMPTZ;
  v_limit INT;
  v_count INT;
  v_client_id UUID;
  v_quote_row public.quotes%ROWTYPE;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  SELECT c.cycle_start, c.cycle_end, c.doc_limit
    INTO v_cycle_start, v_cycle_end, v_limit
  FROM public.get_user_active_document_cycle(p_user_id) c;

  IF v_limit IS NOT NULL THEN
    SELECT (
      (SELECT COUNT(*) FROM public.quotes q WHERE q.user_id = p_user_id AND q.created_at >= v_cycle_start AND q.created_at < v_cycle_end)
      +
      (SELECT COUNT(*) FROM public.invoices i WHERE i.user_id = p_user_id AND i.created_at >= v_cycle_start AND i.created_at < v_cycle_end)
    ) INTO v_count;

    IF v_count >= v_limit THEN
      RAISE EXCEPTION 'QUOTA_EXCEEDED: allowance of % documents reached for cycle', v_limit
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  v_client_id := NULLIF(p_quote_payload->>'client_id', '')::UUID;
  IF v_client_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = v_client_id AND c.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'CLIENT_NOT_OWNED'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.quotes (
    user_id, client_id, quote_number,
    client_name, client_email, client_address,
    business_name, business_email, business_address, logo_url,
    items, subtotal, discount_rate, discount_amount,
    tax_rate, tax_amount, total, currency, notes, status
  ) VALUES (
    p_user_id,
    v_client_id,
    COALESCE(NULLIF(p_quote_payload->>'quote_number', ''), 'QUO-' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6))),
    COALESCE(p_quote_payload->>'client_name', ''),
    COALESCE(p_quote_payload->>'client_email', ''),
    COALESCE(p_quote_payload->>'client_address', ''),
    COALESCE(p_quote_payload->>'business_name', ''),
    COALESCE(p_quote_payload->>'business_email', ''),
    COALESCE(p_quote_payload->>'business_address', ''),
    COALESCE(p_quote_payload->>'logo_url', ''),
    COALESCE(p_quote_payload->'items', '[]'::JSONB),
    COALESCE(NULLIF(p_quote_payload->>'subtotal', '')::INT, 0),
    COALESCE(NULLIF(p_quote_payload->>'discount_rate', '')::NUMERIC, 0),
    COALESCE(NULLIF(p_quote_payload->>'discount_amount', '')::INT, 0),
    COALESCE(NULLIF(p_quote_payload->>'tax_rate', '')::NUMERIC, 0),
    COALESCE(NULLIF(p_quote_payload->>'tax_amount', '')::INT, 0),
    COALESCE(NULLIF(p_quote_payload->>'total', '')::INT, 0),
    COALESCE(NULLIF(p_quote_payload->>'currency', ''), 'USD'),
    COALESCE(p_quote_payload->>'notes', ''),
    COALESCE(NULLIF(p_quote_payload->>'status', ''), 'draft')
  )
  RETURNING * INTO v_quote_row;

  RETURN to_jsonb(v_quote_row);
END;
$$;

-- 6) Atomic Invoice creation: same combined quota authority and ledger-neutral initial payment state.
CREATE OR REPLACE FUNCTION public.check_and_create_invoice(
  p_user_id UUID,
  p_invoice_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cycle_start TIMESTAMPTZ;
  v_cycle_end TIMESTAMPTZ;
  v_limit INT;
  v_count INT;
  v_client_id UUID;
  v_quote_id UUID;
  v_total INT;
  v_requested_status TEXT;
  v_invoice_row public.invoices%ROWTYPE;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  SELECT c.cycle_start, c.cycle_end, c.doc_limit
    INTO v_cycle_start, v_cycle_end, v_limit
  FROM public.get_user_active_document_cycle(p_user_id) c;

  IF v_limit IS NOT NULL THEN
    SELECT (
      (SELECT COUNT(*) FROM public.quotes q WHERE q.user_id = p_user_id AND q.created_at >= v_cycle_start AND q.created_at < v_cycle_end)
      +
      (SELECT COUNT(*) FROM public.invoices i WHERE i.user_id = p_user_id AND i.created_at >= v_cycle_start AND i.created_at < v_cycle_end)
    ) INTO v_count;

    IF v_count >= v_limit THEN
      RAISE EXCEPTION 'QUOTA_EXCEEDED: allowance of % documents reached for cycle', v_limit
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  v_client_id := NULLIF(p_invoice_payload->>'client_id', '')::UUID;
  IF v_client_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = v_client_id AND c.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'CLIENT_NOT_OWNED'
      USING ERRCODE = 'P0001';
  END IF;

  v_quote_id := NULLIF(p_invoice_payload->>'quote_id', '')::UUID;
  IF v_quote_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.quotes q WHERE q.id = v_quote_id AND q.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'QUOTE_NOT_OWNED'
      USING ERRCODE = 'P0001';
  END IF;

  v_total := GREATEST(COALESCE(NULLIF(p_invoice_payload->>'total', '')::INT, 0), 0);
  v_requested_status := lower(COALESCE(NULLIF(p_invoice_payload->>'status', ''), 'draft'));
  IF v_requested_status NOT IN ('draft', 'pending', 'sent', 'overdue', 'approved') THEN
    v_requested_status := 'draft';
  END IF;

  INSERT INTO public.invoices (
    user_id, invoice_number, status, doc_type,
    invoice_kind, payment_status, amount_paid_cents, amount_due_cents,
    client_id, quote_id, payment_link,
    client_name, client_email, client_address,
    business_name, business_email, business_address, logo_url,
    currency, items, subtotal, discount_rate, discount_amount,
    tax_rate, tax_amount, total, invoice_date, due_date,
    payment_terms, notes
  ) VALUES (
    p_user_id,
    COALESCE(NULLIF(p_invoice_payload->>'invoice_number', ''), 'INV-' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6))),
    v_requested_status,
    CASE WHEN lower(COALESCE(p_invoice_payload->>'doc_type', 'invoice')) IN ('invoice', 'receipt') THEN lower(COALESCE(p_invoice_payload->>'doc_type', 'invoice')) ELSE 'invoice' END,
    CASE WHEN lower(COALESCE(p_invoice_payload->>'invoice_kind', 'standard')) IN ('standard', 'deposit', 'milestone', 'final') THEN lower(COALESCE(p_invoice_payload->>'invoice_kind', 'standard')) ELSE 'standard' END,
    'unpaid',
    0,
    v_total,
    v_client_id,
    v_quote_id,
    COALESCE(p_invoice_payload->>'payment_link', ''),
    COALESCE(p_invoice_payload->>'client_name', ''),
    COALESCE(p_invoice_payload->>'client_email', ''),
    COALESCE(p_invoice_payload->>'client_address', ''),
    COALESCE(p_invoice_payload->>'business_name', ''),
    COALESCE(p_invoice_payload->>'business_email', ''),
    COALESCE(p_invoice_payload->>'business_address', ''),
    COALESCE(p_invoice_payload->>'logo_url', ''),
    COALESCE(NULLIF(p_invoice_payload->>'currency', ''), 'USD'),
    COALESCE(p_invoice_payload->'items', '[]'::JSONB),
    COALESCE(NULLIF(p_invoice_payload->>'subtotal', '')::INT, 0),
    COALESCE(NULLIF(p_invoice_payload->>'discount_rate', '')::NUMERIC, 0),
    COALESCE(NULLIF(p_invoice_payload->>'discount_amount', '')::INT, 0),
    COALESCE(NULLIF(p_invoice_payload->>'tax_rate', '')::NUMERIC, 0),
    COALESCE(NULLIF(p_invoice_payload->>'tax_amount', '')::INT, 0),
    v_total,
    COALESCE(NULLIF(p_invoice_payload->>'invoice_date', '')::DATE, CURRENT_DATE),
    NULLIF(p_invoice_payload->>'due_date', '')::DATE,
    COALESCE(NULLIF(p_invoice_payload->>'payment_terms', ''), 'Net 30'),
    COALESCE(p_invoice_payload->>'notes', '')
  )
  RETURNING * INTO v_invoice_row;

  RETURN to_jsonb(v_invoice_row);
END;
$$;

-- 7) Keep these internal database authorities callable only from trusted server code.
REVOKE ALL ON FUNCTION public.get_clamped_anniversary_timestamptz(TIMESTAMPTZ, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_active_document_cycle(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_and_create_quote(UUID, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_and_create_invoice(UUID, JSONB) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_clamped_anniversary_timestamptz(TIMESTAMPTZ, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_active_document_cycle(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_and_create_quote(UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_and_create_invoice(UUID, JSONB) TO service_role;