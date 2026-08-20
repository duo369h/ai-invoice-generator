-- ============================================================
-- Migration Candidate: 20260820_pricing_v2_reconciliation.sql
-- Status: CANDIDATE ONLY (Execution prohibited without explicit authorization)
-- Layer: B (Database Schema & Pricing Reconciliation)
-- ============================================================

-- 1. Profiles plan constraint reconciliation (adding starter)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'agency', 'studio'));

-- 2. Subscriptions plan constraint reconciliation (adding starter)
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'agency', 'studio'));

-- 3. Upsert Canonical Pricing Plans (Free, Starter, Pro)
INSERT INTO public.pricing_plans (id, name, price_monthly, price_yearly, active, display_order, features)
VALUES
  ('free', 'Free', 0.00, 0.00, true, 1, '["Quotes and invoices", "5 new documents each cycle", "PDF exports with Corvioz branding"]')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  active = EXCLUDED.active,
  display_order = EXCLUDED.display_order,
  features = EXCLUDED.features;

INSERT INTO public.pricing_plans (id, name, price_monthly, price_yearly, active, display_order, features)
VALUES
  ('starter', 'Starter', 9.00, 90.00, true, 2, '["Quotes and invoices", "30 new documents each billing cycle", "Clean PDF exports"]')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  active = EXCLUDED.active,
  display_order = EXCLUDED.display_order,
  features = EXCLUDED.features;

INSERT INTO public.pricing_plans (id, name, price_monthly, price_yearly, active, display_order, features)
VALUES
  ('pro', 'Pro', 19.00, 190.00, true, 3, '["Everything in Starter", "Unlimited new documents", "Client Portal with client approval"]')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  active = EXCLUDED.active,
  display_order = EXCLUDED.display_order,
  features = EXCLUDED.features;

-- 4. Mark legacy growth tier inactive (preserving historical rows)
UPDATE public.pricing_plans SET active = false WHERE id = 'growth';

-- 5. Studio tier: Non-destructive initialization (insert canonical inactive row only if absent)
INSERT INTO public.pricing_plans (id, name, price_monthly, price_yearly, active, display_order, features)
VALUES
  ('studio', 'Studio', NULL, NULL, false, 4, '[]')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. SHARED ANNIVERSARY HELPER FUNCTION
-- Preserves original anchor day without accumulation drift:
-- Jan 31 -> Feb 28/29 -> Mar 31 -> Apr 30
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_clamped_anniversary_timestamptz(
  p_anchor TIMESTAMPTZ,
  p_month_offset INT
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_anchor_utc TIMESTAMP;
  v_anchor_year INT;
  v_anchor_month INT;
  v_anchor_day INT;
  v_anchor_time TIME;
  v_target_month_offset INT;
  v_target_year INT;
  v_target_month INT;
  v_days_in_month INT;
  v_clamped_day INT;
  v_target_date DATE;
  v_result_utc TIMESTAMP;
BEGIN
  IF p_anchor IS NULL THEN
    RETURN NULL;
  END IF;

  -- Explicitly extract timestamp components at UTC
  v_anchor_utc := p_anchor AT TIME ZONE 'UTC';
  v_anchor_year := EXTRACT(YEAR FROM v_anchor_utc)::INT;
  v_anchor_month := EXTRACT(MONTH FROM v_anchor_utc)::INT;
  v_anchor_day := EXTRACT(DAY FROM v_anchor_utc)::INT;
  v_anchor_time := v_anchor_utc::TIME;

  -- Absolute offset calculation
  v_target_month_offset := (v_anchor_year * 12 + v_anchor_month - 1) + p_month_offset;
  v_target_year := FLOOR(v_target_month_offset / 12)::INT;
  v_target_month := (v_target_month_offset % 12) + 1;

  -- Days in target month
  v_days_in_month := EXTRACT(DAY FROM (DATE_TRUNC('month', MAKE_DATE(v_target_year, v_target_month, 1)) + INTERVAL '1 month - 1 day'))::INT;
  v_clamped_day := LEAST(v_anchor_day, v_days_in_month);

  v_target_date := MAKE_DATE(v_target_year, v_target_month, v_clamped_day);
  v_result_utc := (v_target_date + v_anchor_time);

  RETURN v_result_utc AT TIME ZONE 'UTC';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_active_document_cycle(
  p_user_id UUID,
  OUT cycle_start TIMESTAMPTZ,
  OUT cycle_end TIMESTAMPTZ,
  OUT doc_limit INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan TEXT;
  v_created_at TIMESTAMPTZ;
  v_sub_start TIMESTAMPTZ;
  v_sub_end TIMESTAMPTZ;
  v_month_offset INT := 0;
  v_c_start TIMESTAMPTZ;
  v_c_end TIMESTAMPTZ;
BEGIN
  -- 1. Fetch user profile
  SELECT plan, created_at INTO v_plan, v_created_at
  FROM public.profiles
  WHERE id = p_user_id;

  v_plan := COALESCE(v_plan, 'free');
  v_created_at := COALESCE(v_created_at, NOW());

  -- 2. Pro & Agency: Unlimited
  IF v_plan = 'pro' OR v_plan = 'agency' THEN
    doc_limit := NULL;
    cycle_start := NOW() - INTERVAL '1 year';
    cycle_end := NOW() + INTERVAL '1 year';
    RETURN;
  END IF;

  -- 3. Legacy Studio: Preserve legacy non-5 unlimited behavior
  IF v_plan = 'studio' THEN
    doc_limit := NULL;
    cycle_start := NOW() - INTERVAL '1 year';
    cycle_end := NOW() + INTERVAL '1 year';
    RETURN;
  END IF;

  -- 4. Starter: Check active subscription billing cycle
  IF v_plan = 'starter' THEN
    SELECT current_period_start, current_period_end
    INTO v_sub_start, v_sub_end
    FROM public.subscriptions
    WHERE user_id = p_user_id
      AND status IN ('active', 'trialing')
      AND current_period_start IS NOT NULL
      AND current_period_end IS NOT NULL
      AND current_period_start <= NOW()
      AND current_period_end > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_sub_start IS NOT NULL AND v_sub_end IS NOT NULL THEN
      doc_limit := 30;
      cycle_start := v_sub_start;
      cycle_end := v_sub_end;
      RETURN;
    END IF;

    -- Starter fallback if subscription record not yet populated
    doc_limit := 30;
  ELSE
    doc_limit := 5; -- Free
  END IF;

  -- 5. Free / Starter Anniversary calculation without drift
  v_c_start := public.get_clamped_anniversary_timestamptz(v_created_at, v_month_offset);
  v_c_end := public.get_clamped_anniversary_timestamptz(v_created_at, v_month_offset + 1);

  WHILE v_c_end <= NOW() LOOP
    v_month_offset := v_month_offset + 1;
    v_c_start := v_c_end;
    v_c_end := public.get_clamped_anniversary_timestamptz(v_created_at, v_month_offset + 1);
  END LOOP;

  cycle_start := v_c_start;
  cycle_end := v_c_end;
END;
$$;

-- ============================================================
-- 8. SECURED ATOMIC DOCUMENT CREATION RPCs
-- Restrict execution to service_role ONLY.
-- Uses shared get_user_active_document_cycle and per-user advisory lock.
-- ============================================================

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
  v_quote_row JSONB;
BEGIN
  -- 1. Explicit per-user serialization lock for the transaction duration
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- 2. Derive authoritative cycle window and document limit
  SELECT cycle_start, cycle_end, doc_limit
  INTO v_cycle_start, v_cycle_end, v_limit
  FROM public.get_user_active_document_cycle(p_user_id);

  -- 3. If finite limit, count existing documents in active cycle
  IF v_limit IS NOT NULL THEN
    SELECT (
      (SELECT COUNT(*) FROM public.quotes WHERE user_id = p_user_id AND created_at >= v_cycle_start AND created_at < v_cycle_end) +
      (SELECT COUNT(*) FROM public.invoices WHERE user_id = p_user_id AND created_at >= v_cycle_start AND created_at < v_cycle_end)
    ) INTO v_count;

    IF v_count >= v_limit THEN
      RAISE EXCEPTION 'QUOTA_EXCEEDED: allowance of % documents reached for cycle', v_limit
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- 4. Insert quote document inside the locked transaction
  INSERT INTO public.quotes (
    user_id,
    quote_number,
    client_name,
    client_email,
    client_address,
    business_name,
    business_email,
    business_address,
    logo_url,
    items,
    subtotal,
    discount_rate,
    discount_amount,
    tax_rate,
    tax_amount,
    total,
    currency,
    notes,
    status
  ) VALUES (
    p_user_id,
    COALESCE(p_quote_payload->>'quote_number', 'QUO-' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6))),
    COALESCE(p_quote_payload->>'client_name', ''),
    COALESCE(p_quote_payload->>'client_email', ''),
    COALESCE(p_quote_payload->>'client_address', ''),
    COALESCE(p_quote_payload->>'business_name', ''),
    COALESCE(p_quote_payload->>'business_email', ''),
    COALESCE(p_quote_payload->>'business_address', ''),
    COALESCE(p_quote_payload->>'logo_url', ''),
    COALESCE(p_quote_payload->'items', '[]'::jsonb),
    COALESCE((p_quote_payload->>'subtotal')::numeric, 0),
    COALESCE((p_quote_payload->>'discount_rate')::numeric, 0),
    COALESCE((p_quote_payload->>'discount_amount')::numeric, 0),
    COALESCE((p_quote_payload->>'tax_rate')::numeric, 0),
    COALESCE((p_quote_payload->>'tax_amount')::numeric, 0),
    COALESCE((p_quote_payload->>'total')::numeric, 0),
    COALESCE(p_quote_payload->>'currency', 'USD'),
    COALESCE(p_quote_payload->>'notes', ''),
    COALESCE(p_quote_payload->>'status', 'draft')
  )
  RETURNING to_jsonb(quotes.*) INTO v_quote_row;

  RETURN v_quote_row;
END;
$$;

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
  v_invoice_row JSONB;
BEGIN
  -- 1. Explicit per-user serialization lock for the transaction duration
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- 2. Derive authoritative cycle window and document limit
  SELECT cycle_start, cycle_end, doc_limit
  INTO v_cycle_start, v_cycle_end, v_limit
  FROM public.get_user_active_document_cycle(p_user_id);

  -- 3. If finite limit, count existing documents in active cycle
  IF v_limit IS NOT NULL THEN
    SELECT (
      (SELECT COUNT(*) FROM public.quotes WHERE user_id = p_user_id AND created_at >= v_cycle_start AND created_at < v_cycle_end) +
      (SELECT COUNT(*) FROM public.invoices WHERE user_id = p_user_id AND created_at >= v_cycle_start AND created_at < v_cycle_end)
    ) INTO v_count;

    IF v_count >= v_limit THEN
      RAISE EXCEPTION 'QUOTA_EXCEEDED: allowance of % documents reached for cycle', v_limit
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- 4. Insert invoice document inside the locked transaction
  INSERT INTO public.invoices (
    user_id,
    invoice_number,
    status,
    doc_type,
    client_id,
    quote_id,
    payment_link,
    client_name,
    client_email,
    client_address,
    business_name,
    business_email,
    business_address,
    logo_url,
    currency,
    items,
    subtotal,
    discount_rate,
    discount_amount,
    tax_rate,
    tax_amount,
    total,
    invoice_date,
    due_date,
    payment_terms,
    notes,
    invoice_kind,
    payment_status,
    amount_paid_cents,
    amount_due_cents
  ) VALUES (
    p_user_id,
    COALESCE(p_invoice_payload->>'invoice_number', 'INV-' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6))),
    COALESCE(p_invoice_payload->>'status', 'pending'),
    COALESCE(p_invoice_payload->>'doc_type', 'invoice'),
    (p_invoice_payload->>'client_id')::uuid,
    (p_invoice_payload->>'quote_id')::uuid,
    COALESCE(p_invoice_payload->>'payment_link', ''),
    COALESCE(p_invoice_payload->>'client_name', ''),
    COALESCE(p_invoice_payload->>'client_email', ''),
    COALESCE(p_invoice_payload->>'client_address', ''),
    COALESCE(p_invoice_payload->>'business_name', ''),
    COALESCE(p_invoice_payload->>'business_email', ''),
    COALESCE(p_invoice_payload->>'business_address', ''),
    COALESCE(p_invoice_payload->>'logo_url', ''),
    COALESCE(p_invoice_payload->>'currency', 'USD'),
    COALESCE(p_invoice_payload->'items', '[]'::jsonb),
    COALESCE((p_invoice_payload->>'subtotal')::numeric, 0),
    COALESCE((p_invoice_payload->>'discount_rate')::numeric, 0),
    COALESCE((p_invoice_payload->>'discount_amount')::numeric, 0),
    COALESCE((p_invoice_payload->>'tax_rate')::numeric, 0),
    COALESCE((p_invoice_payload->>'tax_amount')::numeric, 0),
    COALESCE((p_invoice_payload->>'total')::numeric, 0),
    COALESCE((p_invoice_payload->>'invoice_date')::date, CURRENT_DATE),
    (p_invoice_payload->>'due_date')::date,
    COALESCE(p_invoice_payload->>'payment_terms', 'Net 30'),
    COALESCE(p_invoice_payload->>'notes', ''),
    COALESCE(p_invoice_payload->>'invoice_kind', 'standard'),
    COALESCE(p_invoice_payload->>'payment_status', 'unpaid'),
    COALESCE((p_invoice_payload->>'amount_paid_cents')::int, 0),
    COALESCE((p_invoice_payload->>'amount_due_cents')::int, COALESCE((p_invoice_payload->>'total')::int, 0))
  )
  RETURNING to_jsonb(invoices.*) INTO v_invoice_row;

  RETURN v_invoice_row;
END;
$$;

-- 9. Secure Privileges
REVOKE ALL ON FUNCTION public.get_clamped_anniversary_timestamptz(TIMESTAMPTZ, INT) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_clamped_anniversary_timestamptz(TIMESTAMPTZ, INT) TO service_role;

REVOKE ALL ON FUNCTION public.get_user_active_document_cycle(UUID) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_active_document_cycle(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.check_and_create_quote(UUID, JSONB) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_and_create_quote(UUID, JSONB) TO service_role;

REVOKE ALL ON FUNCTION public.check_and_create_invoice(UUID, JSONB) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_and_create_invoice(UUID, JSONB) TO service_role;
