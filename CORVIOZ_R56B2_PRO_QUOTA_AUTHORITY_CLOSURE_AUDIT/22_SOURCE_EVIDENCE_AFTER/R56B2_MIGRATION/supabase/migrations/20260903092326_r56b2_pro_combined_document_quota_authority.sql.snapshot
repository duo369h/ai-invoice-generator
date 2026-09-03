SET lock_timeout = '10s';

-- R56B-2: freeze the current combined Quote + Invoice creation authority.
-- Historical migrations remain immutable. This forward migration replaces only
-- the cycle function used by the existing atomic creation RPCs.
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

  -- Agency/Studio are legacy compatibility tracks and remain outside the
  -- current public quota authority. Pro is explicitly finite at 100.
  IF v_plan IN ('agency', 'studio') THEN
    RETURN QUERY SELECT NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ, NULL::INT;
    RETURN;
  END IF;

  IF v_plan = 'starter' THEN
    v_limit := 30;
  ELSIF v_plan = 'pro' THEN
    v_limit := 100;
  ELSE
    v_limit := 5;
  END IF;

  IF v_plan IN ('starter', 'pro') THEN
    SELECT s.current_period_start, s.current_period_end
      INTO v_sub_start, v_sub_end
    FROM public.subscriptions s
    WHERE s.user_id = p_user_id
      AND lower(COALESCE(s.plan, '')) = v_plan
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
  END IF;

  -- Existing accepted fallback: account-anniversary cycle anchored to the
  -- profile creation timestamp, used only when no valid paid period exists.
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

COMMENT ON FUNCTION public.get_user_active_document_cycle(UUID) IS
  'R56B-2 authority: Free 5, Starter 30, Pro 100 combined Quotes and Invoices per billing cycle; Agency/Studio legacy compatibility.';

GRANT EXECUTE ON FUNCTION public.get_user_active_document_cycle(UUID) TO authenticated, service_role;
