-- Pass 4 Beta Sprint 1: additive invoice payment foundation.

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_kind TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS amount_paid_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_due_cents INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_invoice_kind_check') THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_invoice_kind_check
      CHECK (invoice_kind IN ('standard', 'deposit', 'milestone', 'final'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_payment_status_check') THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_payment_status_check
      CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overdue'));
  END IF;
END
$$;

UPDATE public.invoices
SET
  invoice_kind = COALESCE(NULLIF(invoice_kind, ''), 'standard'),
  amount_paid_cents = CASE WHEN status = 'paid' THEN total ELSE 0 END,
  amount_due_cents = CASE WHEN status = 'paid' THEN 0 ELSE total END,
  payment_status = CASE
    WHEN status = 'paid' THEN 'paid'
    WHEN due_date IS NOT NULL AND due_date < CURRENT_DATE THEN 'overdue'
    ELSE 'unpaid'
  END
WHERE amount_paid_cents = 0
  AND amount_due_cents = 0
  AND payment_status = 'unpaid';

CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  source TEXT NOT NULL CHECK (source IN ('manual', 'portal', 'legacy_backfill')),
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON public.invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_user_id ON public.invoice_payments(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_payments_legacy_backfill
  ON public.invoice_payments(invoice_id, source)
  WHERE source = 'legacy_backfill';

INSERT INTO public.invoice_payments (
  invoice_id, user_id, amount_cents, currency, status, source, received_at
)
SELECT id, user_id, total, currency, 'succeeded', 'legacy_backfill', updated_at
FROM public.invoices
WHERE status = 'paid'
  AND total > 0
ON CONFLICT DO NOTHING;

ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.invoice_payments FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.invoice_payments TO authenticated;

DROP POLICY IF EXISTS "Users can view own invoice payments" ON public.invoice_payments;
CREATE POLICY "Users can view own invoice payments"
  ON public.invoice_payments
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.record_invoice_payment(
  p_user_id UUID,
  p_invoice_id UUID,
  p_amount_cents INTEGER,
  p_currency TEXT,
  p_source TEXT DEFAULT 'manual',
  p_received_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  invoice_row public.invoices;
  total_paid INTEGER;
BEGIN
  IF p_amount_cents IS NULL OR p_amount_cents <= 0 THEN
    RAISE EXCEPTION 'invoice_payment_amount_invalid';
  END IF;

  IF p_source NOT IN ('manual', 'portal', 'legacy_backfill') THEN
    RAISE EXCEPTION 'invoice_payment_source_invalid';
  END IF;

  SELECT * INTO invoice_row
  FROM public.invoices
  WHERE id = p_invoice_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invoice_not_found';
  END IF;

  IF UPPER(COALESCE(p_currency, '')) <> UPPER(invoice_row.currency) THEN
    RAISE EXCEPTION 'invoice_payment_currency_mismatch';
  END IF;

  INSERT INTO public.invoice_payments (
    invoice_id, user_id, amount_cents, currency, status, source, received_at
  ) VALUES (
    p_invoice_id, p_user_id, p_amount_cents, UPPER(p_currency), 'succeeded', p_source, COALESCE(p_received_at, NOW())
  );

  SELECT COALESCE(SUM(amount_cents), 0) INTO total_paid
  FROM public.invoice_payments
  WHERE invoice_id = p_invoice_id AND status = 'succeeded';

  UPDATE public.invoices
  SET
    amount_paid_cents = total_paid,
    amount_due_cents = GREATEST(total - total_paid, 0),
    payment_status = CASE
      WHEN total_paid >= total THEN 'paid'
      WHEN total_paid > 0 THEN 'partial'
      WHEN due_date IS NOT NULL AND due_date < CURRENT_DATE THEN 'overdue'
      ELSE 'unpaid'
    END,
    updated_at = NOW()
  WHERE id = p_invoice_id AND user_id = p_user_id
  RETURNING * INTO invoice_row;

  RETURN invoice_row;
END;
$$;

REVOKE ALL ON FUNCTION public.record_invoice_payment(UUID, UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_invoice_payment(UUID, UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ) TO service_role;

-- Keep the existing first-revenue anchor, but never mutate an approved Quote to converted.
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
  SELECT * INTO loop_row
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
    SELECT * INTO invoice_row
    FROM public.invoices
    WHERE id = loop_row.invoice_id AND user_id = p_user_id AND quote_id = p_quote_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'first_revenue_invoice_mismatch';
    END IF;
    RETURN jsonb_build_object('invoice', to_jsonb(invoice_row), 'created', false);
  END IF;

  PERFORM 1 FROM public.quotes
  WHERE id = p_quote_id AND user_id = p_user_id AND status = 'approved'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'first_revenue_quote_not_approved';
  END IF;

  INSERT INTO public.invoices (
    user_id, invoice_number, status, doc_type, invoice_kind, payment_status,
    amount_paid_cents, amount_due_cents, client_id, quote_id, payment_link,
    client_name, client_email, client_address, business_name, business_email,
    business_address, logo_url, currency, items, subtotal, discount_rate,
    discount_amount, tax_rate, tax_amount, total, invoice_date, due_date,
    payment_terms, notes, updated_at
  ) VALUES (
    p_user_id, p_invoice->>'invoice_number', 'draft', 'invoice',
    COALESCE(NULLIF(p_invoice->>'invoice_kind', ''), 'deposit'), 'unpaid', 0,
    COALESCE((p_invoice->>'total')::INTEGER, 0),
    NULLIF(p_invoice->>'client_id', '')::UUID, p_quote_id,
    COALESCE(p_invoice->>'payment_link', ''), p_invoice->>'client_name',
    COALESCE(p_invoice->>'client_email', ''), COALESCE(p_invoice->>'client_address', ''),
    COALESCE(p_invoice->>'business_name', ''), COALESCE(p_invoice->>'business_email', ''),
    COALESCE(p_invoice->>'business_address', ''), COALESCE(p_invoice->>'logo_url', ''),
    COALESCE(NULLIF(p_invoice->>'currency', ''), 'USD'),
    COALESCE(p_invoice->'items', '[]'::jsonb), COALESCE((p_invoice->>'subtotal')::INTEGER, 0),
    COALESCE((p_invoice->>'discount_rate')::NUMERIC, 0), COALESCE((p_invoice->>'discount_amount')::INTEGER, 0),
    COALESCE((p_invoice->>'tax_rate')::NUMERIC, 0), COALESCE((p_invoice->>'tax_amount')::INTEGER, 0),
    COALESCE((p_invoice->>'total')::INTEGER, 0),
    COALESCE(NULLIF(p_invoice->>'invoice_date', '')::DATE, CURRENT_DATE),
    NULLIF(p_invoice->>'due_date', '')::DATE, COALESCE(NULLIF(p_invoice->>'payment_terms', ''), 'Net 30'),
    COALESCE(p_invoice->>'notes', ''), NOW()
  ) RETURNING * INTO invoice_row;

  UPDATE public.first_revenue_loops
  SET invoice_id = invoice_row.id, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('invoice', to_jsonb(invoice_row), 'created', true);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_first_revenue_invoice_draft(UUID, UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_first_revenue_invoice_draft(UUID, UUID, JSONB) TO service_role;
;
