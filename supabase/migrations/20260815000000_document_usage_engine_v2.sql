-- Pricing P0 Phase 2: immutable document-creation usage.
-- This migration deliberately does not backfill historical documents. It widens
-- existing plan CHECK constraints to accept the approved Starter value while
-- preserving every previously allowed plan value.

-- Starter is the Phase 2 paid tier. Keep legacy stored plan values valid while
-- making the canonical plan value persistable for both profile and subscription
-- authorities.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'starter', 'pro', 'agency', 'studio'));
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('free', 'starter', 'pro', 'agency', 'studio'));

CREATE TABLE IF NOT EXISTS public.document_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('quote', 'invoice')),
  document_id UUID NOT NULL,
  idempotency_key UUID NOT NULL,
  cycle_start TIMESTAMPTZ NOT NULL,
  cycle_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT document_usage_events_document_unique UNIQUE (user_id, document_type, document_id),
  CONSTRAINT document_usage_events_idempotency_unique UNIQUE (user_id, document_type, idempotency_key),
  CONSTRAINT document_usage_events_cycle_valid CHECK (cycle_end > cycle_start)
);

CREATE INDEX IF NOT EXISTS document_usage_events_user_cycle_idx
  ON public.document_usage_events (user_id, cycle_start, cycle_end);

-- Kept separately testable so the same UTC/clamping calculation used by the
-- write RPC can be verified for month-end and leap-year boundaries.
CREATE OR REPLACE FUNCTION public.resolve_free_document_usage_cycle(
  p_account_created_at TIMESTAMPTZ,
  p_as_of TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (cycle_start TIMESTAMPTZ, cycle_end TIMESTAMPTZ)
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_anchor_day INTEGER;
  v_target_year INTEGER;
  v_target_month INTEGER;
  v_target_last_day INTEGER;
  v_next_year INTEGER;
  v_next_month INTEGER;
  v_next_last_day INTEGER;
BEGIN
  v_anchor_day := EXTRACT(DAY FROM p_account_created_at AT TIME ZONE 'UTC');
  v_target_year := EXTRACT(YEAR FROM p_as_of AT TIME ZONE 'UTC');
  v_target_month := EXTRACT(MONTH FROM p_as_of AT TIME ZONE 'UTC');
  v_target_last_day := EXTRACT(DAY FROM (make_date(v_target_year, v_target_month, 1) + INTERVAL '1 month - 1 day'));
  cycle_start := (make_date(v_target_year, v_target_month, LEAST(v_anchor_day, v_target_last_day))::timestamp
    + (p_account_created_at AT TIME ZONE 'UTC')::time) AT TIME ZONE 'UTC';
  IF p_as_of < cycle_start THEN
    v_target_month := v_target_month - 1;
    IF v_target_month = 0 THEN v_target_month := 12; v_target_year := v_target_year - 1; END IF;
    v_target_last_day := EXTRACT(DAY FROM (make_date(v_target_year, v_target_month, 1) + INTERVAL '1 month - 1 day'));
    cycle_start := (make_date(v_target_year, v_target_month, LEAST(v_anchor_day, v_target_last_day))::timestamp
      + (p_account_created_at AT TIME ZONE 'UTC')::time) AT TIME ZONE 'UTC';
  END IF;
  v_next_year := EXTRACT(YEAR FROM cycle_start AT TIME ZONE 'UTC');
  v_next_month := EXTRACT(MONTH FROM cycle_start AT TIME ZONE 'UTC') + 1;
  IF v_next_month = 13 THEN v_next_month := 1; v_next_year := v_next_year + 1; END IF;
  v_next_last_day := EXTRACT(DAY FROM (make_date(v_next_year, v_next_month, 1) + INTERVAL '1 month - 1 day'));
  cycle_end := (make_date(v_next_year, v_next_month, LEAST(v_anchor_day, v_next_last_day))::timestamp
    + (p_account_created_at AT TIME ZONE 'UTC')::time) AT TIME ZONE 'UTC';
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_document_with_usage(
  p_user_id UUID,
  p_document_type TEXT,
  p_document_id UUID,
  p_idempotency_key UUID,
  p_document JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_account_created_at TIMESTAMPTZ;
  v_cycle_start TIMESTAMPTZ;
  v_cycle_end TIMESTAMPTZ;
  v_document_limit INTEGER;
  v_used INTEGER;
  v_document JSONB;
  v_existing JSONB;
  v_existing_document_id UUID;
BEGIN
  IF p_document_type NOT IN ('quote', 'invoice') THEN
    RAISE EXCEPTION 'DOCUMENT_TYPE_NOT_SUPPORTED';
  END IF;
  IF p_document_id IS NULL OR p_idempotency_key IS NULL OR p_document->>'id' IS DISTINCT FROM p_document_id::TEXT THEN
    RAISE EXCEPTION 'DOCUMENT_ID_REQUIRED';
  END IF;
  IF p_document->>'user_id' IS DISTINCT FROM p_user_id::TEXT THEN
    RAISE EXCEPTION 'DOCUMENT_OWNER_MISMATCH';
  END IF;

  SELECT lower(COALESCE(plan, 'free')), created_at
  INTO v_plan, v_account_created_at
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND';
  END IF;

  -- The profile row serializes one user's concurrent creation attempts.
  -- Re-check after obtaining that lock so a same-key retry returns its document.
  SELECT document_id INTO v_existing_document_id
  FROM public.document_usage_events
  WHERE user_id = p_user_id
    AND document_type = p_document_type
    AND idempotency_key = p_idempotency_key;
  IF v_existing_document_id IS NOT NULL THEN
    IF p_document_type = 'quote' THEN
      SELECT to_jsonb(quotes) INTO v_existing
      FROM public.quotes
      WHERE id = v_existing_document_id AND user_id = p_user_id;
    ELSE
      SELECT to_jsonb(invoices) INTO v_existing
      FROM public.invoices
      WHERE id = v_existing_document_id AND user_id = p_user_id;
    END IF;
    IF v_existing IS NOT NULL THEN
      RETURN v_existing;
    END IF;
    RAISE EXCEPTION 'DOCUMENT_USAGE_IDEMPOTENCY_INTEGRITY_ERROR';
  END IF;

  IF p_document_type = 'quote' THEN
    SELECT to_jsonb(quotes) INTO v_existing
    FROM public.quotes
    WHERE id = p_document_id AND user_id = p_user_id;
  ELSE
    SELECT to_jsonb(invoices) INTO v_existing
    FROM public.invoices
    WHERE id = p_document_id AND user_id = p_user_id;
  END IF;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  IF v_plan = 'free' THEN
    -- UTC anniversary cycle with a clamped month-end anniversary.
    SELECT cycle_start, cycle_end INTO v_cycle_start, v_cycle_end
    FROM public.resolve_free_document_usage_cycle(v_account_created_at, NOW());
    v_document_limit := 5;
  ELSE
    SELECT current_period_start, current_period_end
    INTO v_cycle_start, v_cycle_end
    FROM public.subscriptions
    WHERE user_id = p_user_id
      AND lower(plan) = v_plan
      AND status IN ('active', 'trialing')
      AND current_period_start IS NOT NULL
      AND current_period_end IS NOT NULL
      AND NOW() >= current_period_start
      AND NOW() < current_period_end
    ORDER BY current_period_end DESC
    LIMIT 1
    FOR UPDATE;
    IF v_cycle_start IS NULL OR v_cycle_end IS NULL THEN
      RAISE EXCEPTION 'PAID_USAGE_CYCLE_UNAVAILABLE';
    END IF;
    v_document_limit := CASE v_plan WHEN 'starter' THEN 30 WHEN 'pro' THEN NULL ELSE 0 END;
  END IF;

  IF v_document_limit IS NOT NULL THEN
    SELECT count(*) INTO v_used
    FROM public.document_usage_events
    WHERE user_id = p_user_id
      AND cycle_start = v_cycle_start
      AND cycle_end = v_cycle_end;
    IF v_used >= v_document_limit THEN
      RAISE EXCEPTION 'DOCUMENT_CREATION_LIMIT_REACHED';
    END IF;
  END IF;

  IF p_document_type = 'quote' THEN
    INSERT INTO public.quotes
    SELECT * FROM jsonb_populate_record(NULL::public.quotes, p_document)
    RETURNING to_jsonb(quotes) INTO v_document;
  ELSE
    INSERT INTO public.invoices
    SELECT * FROM jsonb_populate_record(
      NULL::public.invoices,
      jsonb_build_object(
        'status', 'draft',
        'doc_type', 'invoice',
        'client_email', '',
        'client_address', '',
        'business_name', '',
        'business_email', '',
        'business_address', '',
        'logo_url', '',
        'currency', 'USD',
        'items', '[]'::jsonb,
        'subtotal', 0,
        'discount_rate', 0,
        'discount_amount', 0,
        'tax_rate', 0,
        'tax_amount', 0,
        'total', 0,
        'payment_terms', 'Net 30',
        'notes', '',
        'invoice_kind', 'standard',
        'payment_status', 'unpaid',
        'amount_paid_cents', 0,
        'amount_due_cents', 0
      ) || p_document
    )
    RETURNING to_jsonb(invoices) INTO v_document;
  END IF;

  INSERT INTO public.document_usage_events (user_id, document_type, document_id, idempotency_key, cycle_start, cycle_end)
  VALUES (p_user_id, p_document_type, p_document_id, p_idempotency_key, v_cycle_start, v_cycle_end);

  RETURN v_document;
END;
$$;

REVOKE ALL ON FUNCTION public.create_document_with_usage(UUID, TEXT, UUID, UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_document_with_usage(UUID, TEXT, UUID, UUID, JSONB) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_document_with_usage(UUID, TEXT, UUID, UUID, JSONB) TO service_role;
