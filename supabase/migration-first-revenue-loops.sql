-- =====================================================================
-- HISTORICAL ARCHIVE ONLY
-- DO NOT RUN AGAINST PRODUCTION
-- DO NOT SYNTHESIZE MIGRATION HISTORY
-- =====================================================================
--
-- Provenance
--   Original file : supabase/migration-first-revenue-loops.sql
--   Recovered from: /Users/duo/Documents/想做个网站/corvioz/supabase/
--                   (byte-identical second copy also found in
--                    Desktop/Corvioz-SAFE-03B0-20260725-045031/source-snapshot/)
--   SHA-256       : b7adb16da995812534321e8a908cfac34bc91c8ed3d0bf94eab187ab9cdec7ec
--   Original mtime: 2026-07-10 21:26
--   Status in Git : NEVER committed on any ref (verified via
--                   `git log --all -- supabase/*first-revenue*` -> empty)
--
-- Why this file is being archived
--   The objects it creates ALREADY EXIST in production
--   (project fgortrxozlbzxbkerejz) but were applied out-of-band, so
--   supabase_migrations.schema_migrations contains NO row for them.
--   This file is restored to Git purely to close that source-history gap.
--
-- Verification performed (SAFE-03B2H-A, read-only)
--   - table columns 1-6, PK, both FKs (ON DELETE RESTRICT / CASCADE),
--     both UNIQUE constraints, both partial indexes: EXACT MATCH
--   - RLS enabled, 0 policies, owner postgres: MATCH
--   - table grants: postgres + service_role only; anon/authenticated none: MATCH
--   - claim_first_revenue_quote production body: EXACT MATCH to this file
--   - all functions SECURITY INVOKER with SET search_path=public: MATCH
--   - function EXECUTE granted only to postgres + service_role: MATCH
--
-- KNOWN DIVERGENCE FROM CURRENT PRODUCTION (expected, do not "fix" here)
--   1. Production first_revenue_loops additionally has columns
--        stage, first_payment_received_at, completed_at
--      plus constraint first_revenue_loops_stage_check.
--      Those come from migration-first-revenue-loop-payment-completion.sql,
--      which IS already registered as 20260711192505.
--   2. Production claim_first_revenue_invoice_draft is the LATER version from
--      that same payment-completion migration (its body writes `stage`).
--      The definition below is the ORIGINAL, superseded version. That is
--      correct for a historical archive and must NOT be edited to match today.
--
-- WHY RE-RUNNING IS UNSAFE
--   a) The cutover backfill below inserts legacy_blocked_at = NOW() for every
--      free-plan profile that owns any quote or invoice. At original apply time
--      that targeted pre-existing users only. Today 15 of 16 loop rows already
--      hold a quote_id, so any free user who has since created a document but
--      has no loop row yet would be PERMANENTLY blocked from the free
--      first-revenue loop. ON CONFLICT DO NOTHING protects existing rows only.
--   b) It also REVOKEs INSERT/UPDATE/DELETE on public.quotes and public.invoices
--      from `authenticated` — a permission change whose blast radius extends
--      well beyond this table.
--
-- Handling rules for the next stage
--   - Commit as documentation of history only.
--   - Do NOT execute against any environment.
--   - Do NOT insert a matching row into supabase_migrations.schema_migrations.
--   - If a runnable equivalent is ever needed, author a separate, idempotent,
--     backfill-free migration and review it independently.
-- =====================================================================

-- Pass 4.1A: one server-owned free revenue-preparation loop per user.
-- Apply with a Supabase migration runner; this file is intentionally additive.

CREATE TABLE IF NOT EXISTS public.first_revenue_loops (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  quote_id UUID UNIQUE REFERENCES public.quotes(id) ON DELETE RESTRICT,
  invoice_id UUID UNIQUE REFERENCES public.invoices(id) ON DELETE RESTRICT,
  legacy_blocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_first_revenue_loops_quote_id
  ON public.first_revenue_loops(quote_id)
  WHERE quote_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_first_revenue_loops_invoice_id
  ON public.first_revenue_loops(invoice_id)
  WHERE invoice_id IS NOT NULL;

ALTER TABLE public.first_revenue_loops ENABLE ROW LEVEL SECURITY;

-- Quote writes go through the authenticated API and its service-role client.
-- This prevents direct client writes from bypassing the atomic free-user claim.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.quotes FROM authenticated;
GRANT SELECT ON TABLE public.quotes TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.invoices FROM authenticated;
GRANT SELECT ON TABLE public.invoices TO authenticated;

REVOKE ALL ON TABLE public.first_revenue_loops FROM anon, authenticated;
REVOKE ALL ON TABLE public.first_revenue_loops FROM PUBLIC;
GRANT ALL ON TABLE public.first_revenue_loops TO service_role;

-- Historical Free users who have already created business documents do not receive
-- a new free loop after this cutover. New users and users with no prior documents
-- remain eligible until a claim binds their first Quote.
INSERT INTO public.first_revenue_loops (user_id, legacy_blocked_at)
SELECT profiles.id, NOW()
FROM public.profiles AS profiles
WHERE profiles.plan = 'free'
  AND (
    EXISTS (SELECT 1 FROM public.quotes WHERE quotes.user_id = profiles.id)
    OR EXISTS (SELECT 1 FROM public.invoices WHERE invoices.user_id = profiles.id)
  )
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.claim_first_revenue_quote(
  p_user_id UUID,
  p_quote_id UUID
)
RETURNS public.first_revenue_loops
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  loop_row public.first_revenue_loops;
BEGIN
  PERFORM 1
  FROM public.quotes
  WHERE id = p_quote_id
    AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'first_revenue_quote_not_owned';
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

  IF loop_row.quote_id IS NULL THEN
    UPDATE public.first_revenue_loops
    SET quote_id = p_quote_id,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO loop_row;
  ELSIF loop_row.quote_id <> p_quote_id THEN
    RAISE EXCEPTION 'first_revenue_quote_already_claimed';
  END IF;

  RETURN loop_row;
END;
$$;

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
    COALESCE((p_quote->>'subtotal')::INTEGER, 0),
    COALESCE((p_quote->>'discount_rate')::NUMERIC, 0),
    COALESCE((p_quote->>'discount_amount')::INTEGER, 0),
    COALESCE((p_quote->>'tax_rate')::NUMERIC, 0),
    COALESCE((p_quote->>'tax_amount')::INTEGER, 0),
    COALESCE((p_quote->>'total')::INTEGER, 0),
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

DROP FUNCTION IF EXISTS public.claim_first_revenue_invoice_draft(UUID, UUID, UUID);

CREATE OR REPLACE FUNCTION public.claim_first_revenue_invoice_draft(
  p_user_id UUID,
  p_quote_id UUID,
  p_invoice JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  loop_row public.first_revenue_loops;
  invoice_row public.invoices;
BEGIN
  SELECT *
  INTO loop_row
  FROM public.first_revenue_loops
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND OR loop_row.legacy_blocked_at IS NOT NULL THEN
    RAISE EXCEPTION 'first_revenue_loop_unavailable';
  END IF;

  IF loop_row.quote_id IS DISTINCT FROM p_quote_id THEN
    RAISE EXCEPTION 'first_revenue_quote_mismatch';
  END IF;

  IF loop_row.invoice_id IS NOT NULL THEN
    SELECT *
    INTO invoice_row
    FROM public.invoices
    WHERE id = loop_row.invoice_id
      AND user_id = p_user_id
      AND quote_id = p_quote_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'first_revenue_invoice_mismatch';
    END IF;

    RETURN jsonb_build_object('invoice', to_jsonb(invoice_row), 'created', false);
  END IF;

  PERFORM 1
  FROM public.quotes
  WHERE id = p_quote_id
    AND user_id = p_user_id
    AND status = 'approved'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'first_revenue_quote_not_approved';
  END IF;

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
    updated_at
  ) VALUES (
    p_user_id,
    p_invoice->>'invoice_number',
    'draft',
    'invoice',
    NULLIF(p_invoice->>'client_id', '')::UUID,
    p_quote_id,
    COALESCE(p_invoice->>'payment_link', ''),
    p_invoice->>'client_name',
    COALESCE(p_invoice->>'client_email', ''),
    COALESCE(p_invoice->>'client_address', ''),
    COALESCE(p_invoice->>'business_name', ''),
    COALESCE(p_invoice->>'business_email', ''),
    COALESCE(p_invoice->>'business_address', ''),
    COALESCE(p_invoice->>'logo_url', ''),
    COALESCE(NULLIF(p_invoice->>'currency', ''), 'USD'),
    COALESCE(p_invoice->'items', '[]'::jsonb),
    COALESCE((p_invoice->>'subtotal')::INTEGER, 0),
    COALESCE((p_invoice->>'discount_rate')::NUMERIC, 0),
    COALESCE((p_invoice->>'discount_amount')::INTEGER, 0),
    COALESCE((p_invoice->>'tax_rate')::NUMERIC, 0),
    COALESCE((p_invoice->>'tax_amount')::INTEGER, 0),
    COALESCE((p_invoice->>'total')::INTEGER, 0),
    COALESCE(NULLIF(p_invoice->>'invoice_date', '')::DATE, CURRENT_DATE),
    NULLIF(p_invoice->>'due_date', '')::DATE,
    COALESCE(NULLIF(p_invoice->>'payment_terms', ''), 'Net 30'),
    COALESCE(p_invoice->>'notes', ''),
    NOW()
  )
  RETURNING * INTO invoice_row;

  UPDATE public.first_revenue_loops
  SET invoice_id = invoice_row.id,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  UPDATE public.quotes
  SET status = 'converted',
      updated_at = NOW()
  WHERE id = p_quote_id
    AND user_id = p_user_id
    AND status = 'approved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'first_revenue_quote_not_approved';
  END IF;

  RETURN jsonb_build_object('invoice', to_jsonb(invoice_row), 'created', true);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_first_revenue_quote(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_first_revenue_quote(UUID, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_first_revenue_invoice_draft(UUID, UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_first_revenue_quote(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_first_revenue_quote(UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_first_revenue_invoice_draft(UUID, UUID, JSONB) TO service_role;
