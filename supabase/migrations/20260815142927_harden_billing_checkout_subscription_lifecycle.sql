ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_interval text,
  ADD COLUMN IF NOT EXISTS paddle_customer_id text,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz,
  ADD COLUMN IF NOT EXISTS latest_event_occurred_at timestamptz;

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_billing_interval_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_billing_interval_check
  CHECK (billing_interval IS NULL OR billing_interval IN ('monthly', 'yearly'));

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_paddle_subscription_id_unique
  ON public.subscriptions (paddle_subscription_id)
  WHERE paddle_subscription_id IS NOT NULL AND paddle_subscription_id <> '';
CREATE UNIQUE INDEX IF NOT EXISTS entitlements_user_id_unique ON public.entitlements (user_id);

CREATE TABLE IF NOT EXISTS public.billing_checkout_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('starter', 'pro')),
  billing_interval text NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
  paddle_price_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  paddle_customer_id text,
  paddle_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_checkout_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.billing_checkout_intents FROM anon, authenticated;
GRANT ALL ON TABLE public.billing_checkout_intents TO service_role;

CREATE OR REPLACE FUNCTION public.apply_paddle_billing_event(
  p_event_id text, p_event_type text, p_user_id uuid, p_checkout_intent_id uuid,
  p_customer_id text, p_subscription_id text, p_price_id text, p_plan text,
  p_billing_interval text, p_status text, p_period_start timestamptz,
  p_period_end timestamptz, p_occurred_at timestamptz, p_cancel_at_period_end boolean,
  p_payload jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_intent public.billing_checkout_intents; v_sub public.subscriptions; v_event_id uuid;
BEGIN
  INSERT INTO public.billing_events(event_id, user_id, event_type, payload)
  VALUES (p_event_id, p_user_id, p_event_type, p_payload)
  ON CONFLICT (event_id) DO NOTHING RETURNING id INTO v_event_id;
  IF v_event_id IS NULL THEN RETURN jsonb_build_object('duplicate', true); END IF;

  IF p_plan NOT IN ('starter','pro','free') OR p_billing_interval IS NOT NULL AND p_billing_interval NOT IN ('monthly','yearly') THEN
    RAISE EXCEPTION 'BILLING_MAPPING_INVALID';
  END IF;
  IF p_plan = 'starter' AND p_status IN ('active','trialing') AND (p_period_start IS NULL OR p_period_end IS NULL OR p_period_end <= p_period_start) THEN
    RAISE EXCEPTION 'BILLING_STARTER_PERIOD_REQUIRED';
  END IF;
  IF p_checkout_intent_id IS NOT NULL THEN
    SELECT * INTO v_intent FROM public.billing_checkout_intents WHERE id = p_checkout_intent_id FOR UPDATE;
    IF NOT FOUND OR v_intent.user_id <> p_user_id OR v_intent.plan <> p_plan OR v_intent.billing_interval <> p_billing_interval OR v_intent.paddle_price_id <> p_price_id OR v_intent.expires_at <= now() THEN
      RAISE EXCEPTION 'BILLING_CHECKOUT_INTENT_INVALID';
    END IF;
    IF v_intent.paddle_customer_id IS NOT NULL AND v_intent.paddle_customer_id <> p_customer_id THEN RAISE EXCEPTION 'BILLING_OWNER_MISMATCH'; END IF;
  END IF;

  SELECT * INTO v_sub FROM public.subscriptions WHERE paddle_subscription_id = p_subscription_id FOR UPDATE;
  IF FOUND AND (v_sub.user_id <> p_user_id OR (v_sub.paddle_customer_id <> '' AND v_sub.paddle_customer_id <> p_customer_id)) THEN RAISE EXCEPTION 'BILLING_OWNER_MISMATCH'; END IF;
  IF FOUND AND v_sub.latest_event_occurred_at IS NOT NULL AND p_occurred_at < v_sub.latest_event_occurred_at THEN RETURN jsonb_build_object('ignored_out_of_order', true); END IF;

  INSERT INTO public.subscriptions(user_id,paddle_subscription_id,paddle_customer_id,paddle_price_id,price_id,plan,billing_interval,status,current_period_start,current_period_end,cancel_at_period_end,canceled_at,latest_event_occurred_at)
  VALUES(p_user_id,p_subscription_id,p_customer_id,p_price_id,p_price_id,p_plan,p_billing_interval,p_status,p_period_start,p_period_end,p_cancel_at_period_end,CASE WHEN p_status='canceled' THEN p_occurred_at ELSE NULL END,p_occurred_at)
  ON CONFLICT (paddle_subscription_id) WHERE paddle_subscription_id IS NOT NULL AND paddle_subscription_id <> '' DO UPDATE SET
    paddle_customer_id=EXCLUDED.paddle_customer_id,paddle_price_id=EXCLUDED.paddle_price_id,price_id=EXCLUDED.price_id,plan=EXCLUDED.plan,billing_interval=EXCLUDED.billing_interval,status=EXCLUDED.status,current_period_start=EXCLUDED.current_period_start,current_period_end=EXCLUDED.current_period_end,cancel_at_period_end=EXCLUDED.cancel_at_period_end,canceled_at=EXCLUDED.canceled_at,latest_event_occurred_at=EXCLUDED.latest_event_occurred_at,updated_at=now();
  UPDATE public.profiles SET plan=p_plan,paddle_customer_id=p_customer_id,paddle_subscription_id=p_subscription_id,current_period_end=p_period_end,updated_at=now() WHERE id=p_user_id;
  INSERT INTO public.entitlements(user_id,plan,export_pdf,client_portal,crm,automation,advanced_invoicing,updated_at)
  VALUES(p_user_id,p_plan,p_plan IN ('starter','pro'),p_plan='pro',p_plan='pro',false,p_plan='pro',now())
  ON CONFLICT (user_id) DO UPDATE SET plan=EXCLUDED.plan,export_pdf=EXCLUDED.export_pdf,client_portal=EXCLUDED.client_portal,crm=EXCLUDED.crm,automation=EXCLUDED.automation,advanced_invoicing=EXCLUDED.advanced_invoicing,updated_at=now();
  IF p_checkout_intent_id IS NOT NULL THEN UPDATE public.billing_checkout_intents SET consumed_at=now(),paddle_customer_id=p_customer_id,paddle_subscription_id=p_subscription_id WHERE id=p_checkout_intent_id; END IF;
  RETURN jsonb_build_object('applied', true);
END $$;
REVOKE ALL ON FUNCTION public.apply_paddle_billing_event(text,text,uuid,uuid,text,text,text,text,text,text,timestamptz,timestamptz,timestamptz,boolean,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_paddle_billing_event(text,text,uuid,uuid,text,text,text,text,text,text,timestamptz,timestamptz,timestamptz,boolean,jsonb) TO service_role;
