-- BUG-ACTIVATION-QUOTE-002: keep the Free first-quote claim self-contained.
-- This replaces only the RPC body; it introduces no schema changes.

CREATE OR REPLACE FUNCTION public.create_first_revenue_quote(
  p_user_id UUID,
  p_quote JSONB
)
RETURNS public.quotes
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  loop_row public.first_revenue_loops;
  quote_row public.quotes;
BEGIN
  -- A newly verified user can reach this RPC before a request-scoped profile
  -- insert is visible to the service-role connection. Establish the FK parent
  -- here so the profile, loop claim, and quote insert share one transaction.
  INSERT INTO public.profiles (id, email, name, plan)
  SELECT
    auth_user.id,
    auth_user.email,
    COALESCE(
      NULLIF(auth_user.raw_user_meta_data->>'name', ''),
      NULLIF(auth_user.raw_user_meta_data->>'full_name', ''),
      NULLIF(split_part(auth_user.email, '@', 1), ''),
      'User'
    ),
    'free'
  FROM auth.users AS auth_user
  WHERE auth_user.id = p_user_id
  ON CONFLICT (id) DO NOTHING;

  PERFORM 1
  FROM public.profiles
  WHERE id = p_user_id
  FOR KEY SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'first_revenue_profile_not_found';
  END IF;

  INSERT INTO public.first_revenue_loops (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT *
  INTO loop_row
  FROM public.first_revenue_loops
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF loop_row.legacy_blocked_at IS NOT NULL THEN
    RAISE EXCEPTION 'first_revenue_loop_legacy_blocked';
  END IF;

  IF loop_row.quote_id IS NOT NULL THEN
    RAISE EXCEPTION 'first_revenue_quote_already_claimed';
  END IF;

  INSERT INTO public.quotes (
    user_id,
    quote_number,
    client_name,
    client_email,
    client_address,
    items,
    subtotal,
    discount_rate,
    discount_amount,
    tax_rate,
    tax_amount,
    total,
    currency,
    notes,
    status,
    updated_at
  ) VALUES (
    p_user_id,
    p_quote->>'quote_number',
    p_quote->>'client_name',
    COALESCE(p_quote->>'client_email', ''),
    COALESCE(p_quote->>'client_address', ''),
    COALESCE(p_quote->'items', '[]'::jsonb),
    CASE WHEN COALESCE(p_quote->>'subtotal', '') ~ '^[+-]?[0-9]+$'
      THEN (p_quote->>'subtotal')::INTEGER ELSE 0 END,
    CASE WHEN COALESCE(p_quote->>'discount_rate', '') ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$'
      THEN (p_quote->>'discount_rate')::NUMERIC ELSE 0 END,
    CASE WHEN COALESCE(p_quote->>'discount_amount', '') ~ '^[+-]?[0-9]+$'
      THEN (p_quote->>'discount_amount')::INTEGER ELSE 0 END,
    CASE WHEN COALESCE(p_quote->>'tax_rate', '') ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$'
      THEN (p_quote->>'tax_rate')::NUMERIC ELSE 0 END,
    CASE WHEN COALESCE(p_quote->>'tax_amount', '') ~ '^[+-]?[0-9]+$'
      THEN (p_quote->>'tax_amount')::INTEGER ELSE 0 END,
    CASE WHEN COALESCE(p_quote->>'total', '') ~ '^[+-]?[0-9]+$'
      THEN (p_quote->>'total')::INTEGER ELSE 0 END,
    COALESCE(NULLIF(p_quote->>'currency', ''), 'USD'),
    COALESCE(p_quote->>'notes', ''),
    'draft',
    NOW()
  )
  RETURNING * INTO quote_row;

  UPDATE public.first_revenue_loops
  SET quote_id = quote_row.id,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN quote_row;
END;
$$;

REVOKE ALL ON FUNCTION public.create_first_revenue_quote(UUID, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_first_revenue_quote(UUID, JSONB)
  TO service_role;
