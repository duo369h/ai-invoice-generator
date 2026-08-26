SET lock_timeout = '10s';

-- Keep the already-applied pricing migration authority intact. This R2
-- migration only adds the strict webhook ordering/runtime contract.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'agency', 'studio'));

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS latest_event_occurred_at TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS billing_interval TEXT;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'agency', 'studio'));
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'canceled', 'past_due', 'paused', 'trialing', 'incomplete', 'unpaid'));
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_billing_interval_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_billing_interval_check
  CHECK (billing_interval IN ('monthly', 'yearly') OR billing_interval IS NULL);

-- One subscription row per user. Empty legacy/default IDs are allowed to
-- repeat; populated Paddle IDs must be unique.
DO $$
DECLARE
  v_constraint RECORD;
BEGIN
  FOR v_constraint IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'subscriptions'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) ILIKE '%(paddle_subscription_id)%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.subscriptions DROP CONSTRAINT %I',
      v_constraint.conname
    );
  END LOOP;
END
$$;
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_unique
  ON public.subscriptions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_paddle_subscription_id_unique
  ON public.subscriptions(paddle_subscription_id)
  WHERE NULLIF(BTRIM(paddle_subscription_id), '') IS NOT NULL;

ALTER TABLE public.billing_events ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ;
ALTER TABLE public.billing_events ADD COLUMN IF NOT EXISTS applied BOOLEAN;
UPDATE public.billing_events
SET occurred_at = COALESCE(occurred_at, created_at, NOW()),
    applied = COALESCE(applied, true)
WHERE occurred_at IS NULL OR applied IS NULL;
ALTER TABLE public.billing_events ALTER COLUMN occurred_at SET DEFAULT NOW();
ALTER TABLE public.billing_events ALTER COLUMN occurred_at SET NOT NULL;
ALTER TABLE public.billing_events ALTER COLUMN applied SET DEFAULT true;
ALTER TABLE public.billing_events ALTER COLUMN applied SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS billing_events_event_id_unique
  ON public.billing_events(event_id);

CREATE OR REPLACE FUNCTION public.apply_paddle_webhook_event(
  p_event_id TEXT,
  p_event_type TEXT,
  p_user_id UUID,
  p_customer_id TEXT,
  p_subscription_id TEXT,
  p_price_id TEXT,
  p_plan TEXT,
  p_status TEXT,
  p_billing_interval TEXT,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_occurred_at TIMESTAMPTZ,
  p_payload JSONB,
  p_invoice BOOLEAN,
  p_quote BOOLEAN,
  p_export_pdf BOOLEAN,
  p_pdf_branding TEXT,
  p_client_portal BOOLEAN,
  p_client_approval BOOLEAN,
  p_approval_scope TEXT,
  p_crm BOOLEAN,
  p_automation BOOLEAN,
  p_advanced_invoicing BOOLEAN,
  p_unlimited_invoices BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_latest_occurred_at TIMESTAMPTZ;
BEGIN
  IF NULLIF(BTRIM(p_event_id), '') IS NULL THEN
    RAISE EXCEPTION 'event_id is required';
  END IF;

  IF p_occurred_at IS NULL THEN
    RAISE EXCEPTION 'occurred_at is required';
  END IF;

  -- Serialize every event for the same user. The idempotency check, stale
  -- check, business writes, and event record all occur in this transaction.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::TEXT, 0));

  IF EXISTS (
    SELECT 1 FROM public.billing_events WHERE event_id = p_event_id
  ) THEN
    RETURN jsonb_build_object(
      'duplicate', true,
      'applied', false,
      'stale', false,
      'event_id', p_event_id
    );
  END IF;

  SELECT latest_event_occurred_at
    INTO v_latest_occurred_at
  FROM public.subscriptions
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_latest_occurred_at IS NOT NULL AND p_occurred_at < v_latest_occurred_at THEN
    INSERT INTO public.billing_events (
      event_id, user_id, event_type, payload, occurred_at, applied, created_at
    ) VALUES (
      p_event_id, p_user_id, p_event_type, p_payload, p_occurred_at, false, NOW()
    );

    RETURN jsonb_build_object(
      'duplicate', false,
      'applied', false,
      'stale', true,
      'event_id', p_event_id,
      'latest_event_occurred_at', v_latest_occurred_at
    );
  END IF;

  UPDATE public.profiles
  SET plan = p_plan,
      paddle_customer_id = COALESCE(NULLIF(p_customer_id, ''), paddle_customer_id),
      updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.subscriptions (
    user_id,
    paddle_subscription_id,
    paddle_price_id,
    price_id,
    plan,
    status,
    billing_interval,
    current_period_start,
    current_period_end,
    latest_event_occurred_at,
    updated_at
  ) VALUES (
    p_user_id,
    COALESCE(NULLIF(p_subscription_id, ''), ''),
    COALESCE(p_price_id, ''),
    COALESCE(p_price_id, ''),
    p_plan,
    p_status,
    p_billing_interval,
    p_period_start,
    p_period_end,
    p_occurred_at,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    paddle_subscription_id = CASE
      WHEN NULLIF(EXCLUDED.paddle_subscription_id, '') IS NULL
        THEN public.subscriptions.paddle_subscription_id
      ELSE EXCLUDED.paddle_subscription_id
    END,
    paddle_price_id = CASE
      WHEN NULLIF(EXCLUDED.paddle_price_id, '') IS NULL
        THEN public.subscriptions.paddle_price_id
      ELSE EXCLUDED.paddle_price_id
    END,
    price_id = CASE
      WHEN NULLIF(EXCLUDED.price_id, '') IS NULL
        THEN public.subscriptions.price_id
      ELSE EXCLUDED.price_id
    END,
    plan = EXCLUDED.plan,
    status = EXCLUDED.status,
    billing_interval = COALESCE(EXCLUDED.billing_interval, public.subscriptions.billing_interval),
    current_period_start = COALESCE(EXCLUDED.current_period_start, public.subscriptions.current_period_start),
    current_period_end = COALESCE(EXCLUDED.current_period_end, public.subscriptions.current_period_end),
    latest_event_occurred_at = EXCLUDED.latest_event_occurred_at,
    updated_at = NOW();

  INSERT INTO public.entitlements (
    user_id,
    plan,
    invoice,
    quote,
    export_pdf,
    pdf_branding,
    client_portal,
    client_approval,
    approval_scope,
    crm,
    automation,
    advanced_invoicing,
    unlimited_invoices,
    updated_at
  ) VALUES (
    p_user_id,
    p_plan,
    p_invoice,
    p_quote,
    p_export_pdf,
    p_pdf_branding,
    p_client_portal,
    p_client_approval,
    p_approval_scope,
    p_crm,
    p_automation,
    p_advanced_invoicing,
    p_unlimited_invoices,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan = EXCLUDED.plan,
    invoice = EXCLUDED.invoice,
    quote = EXCLUDED.quote,
    export_pdf = EXCLUDED.export_pdf,
    pdf_branding = EXCLUDED.pdf_branding,
    client_portal = EXCLUDED.client_portal,
    client_approval = EXCLUDED.client_approval,
    approval_scope = EXCLUDED.approval_scope,
    crm = EXCLUDED.crm,
    automation = EXCLUDED.automation,
    advanced_invoicing = EXCLUDED.advanced_invoicing,
    unlimited_invoices = EXCLUDED.unlimited_invoices,
    updated_at = NOW();

  INSERT INTO public.billing_events (
    event_id, user_id, event_type, payload, occurred_at, applied, created_at
  ) VALUES (
    p_event_id, p_user_id, p_event_type, p_payload, p_occurred_at, true, NOW()
  );

  RETURN jsonb_build_object(
    'duplicate', false,
    'applied', true,
    'stale', false,
    'event_id', p_event_id,
    'latest_event_occurred_at', p_occurred_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_paddle_webhook_event(
  TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ,
  TIMESTAMPTZ, TIMESTAMPTZ, JSONB, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, BOOLEAN,
  BOOLEAN, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_paddle_webhook_event(
  TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ,
  TIMESTAMPTZ, TIMESTAMPTZ, JSONB, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, BOOLEAN,
  BOOLEAN, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN
) TO service_role;
