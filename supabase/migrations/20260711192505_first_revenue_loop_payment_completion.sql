-- Pass 4: persist the minimal first-revenue payment lifecycle.
-- This migration is additive and leaves Quote status and invoice linkage unchanged.

ALTER TABLE public.first_revenue_loops
  ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'quote_approved',
  ADD COLUMN IF NOT EXISTS first_payment_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'first_revenue_loops_stage_check'
  ) THEN
    ALTER TABLE public.first_revenue_loops
      ADD CONSTRAINT first_revenue_loops_stage_check
      CHECK (stage IN ('quote_approved', 'invoice_created', 'first_payment_received', 'complete'));
  END IF;
END
$$;

-- Bring existing linked loops in line with the payment ledger without changing
-- the linked Quote or Invoice.
WITH payment_totals AS (
  SELECT
    invoice_id,
    MIN(received_at) FILTER (WHERE status = 'succeeded') AS first_payment_received_at
  FROM public.invoice_payments
  GROUP BY invoice_id
)
UPDATE public.first_revenue_loops AS loop
SET
  stage = CASE
    WHEN loop.invoice_id IS NULL THEN 'quote_approved'
    WHEN invoice.payment_status = 'paid' THEN 'complete'
    WHEN payment_totals.first_payment_received_at IS NOT NULL THEN 'first_payment_received'
    ELSE 'invoice_created'
  END,
  first_payment_received_at = COALESCE(loop.first_payment_received_at, payment_totals.first_payment_received_at),
  completed_at = CASE
    WHEN invoice.payment_status = 'paid' THEN COALESCE(loop.completed_at, invoice.updated_at)
    ELSE loop.completed_at
  END,
  updated_at = NOW()
FROM public.invoices AS invoice
LEFT JOIN payment_totals ON payment_totals.invoice_id = invoice.id
WHERE invoice.id = loop.invoice_id;

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
  payment_received_at TIMESTAMPTZ;
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

  payment_received_at := COALESCE(p_received_at, NOW());

  INSERT INTO public.invoice_payments (
    invoice_id, user_id, amount_cents, currency, status, source, received_at
  ) VALUES (
    p_invoice_id, p_user_id, p_amount_cents, UPPER(p_currency), 'succeeded', p_source, payment_received_at
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

  -- The payment ledger is authoritative. Capture the first payment timestamp
  -- once, then promote the loop to complete only after full settlement.
  UPDATE public.first_revenue_loops
  SET
    first_payment_received_at = COALESCE(first_payment_received_at, payment_received_at),
    stage = CASE
      WHEN invoice_row.payment_status = 'paid' THEN 'complete'
      WHEN stage IN ('quote_approved', 'invoice_created') THEN 'first_payment_received'
      ELSE stage
    END,
    completed_at = CASE
      WHEN invoice_row.payment_status = 'paid' THEN COALESCE(completed_at, payment_received_at)
      ELSE completed_at
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND invoice_id = p_invoice_id;

  RETURN invoice_row;
END;
$$;

REVOKE ALL ON FUNCTION public.record_invoice_payment(UUID, UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_invoice_payment(UUID, UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ)
  TO service_role;

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
  SET invoice_id = invoice_row.id,
      stage = 'invoice_created',
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('invoice', to_jsonb(invoice_row), 'created', true);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_first_revenue_invoice_draft(UUID, UUID, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_first_revenue_invoice_draft(UUID, UUID, JSONB)
  TO service_role;
;
