-- Phase 3 strict remediation: one idempotent payment-write authority.
-- The prior six-argument overload is retired after all runtime callers move
-- to the idempotency-key signature.
CREATE OR REPLACE FUNCTION public.record_invoice_payment(
  p_user_id UUID,
  p_invoice_id UUID,
  p_amount_cents INTEGER,
  p_currency TEXT,
  p_source TEXT DEFAULT 'manual',
  p_received_at TIMESTAMPTZ DEFAULT NOW(),
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  invoice_row public.invoices;
  existing_payment public.invoice_payments;
  total_paid INTEGER;
  payment_received_at TIMESTAMPTZ;
BEGIN
  IF p_amount_cents IS NULL OR p_amount_cents <= 0 THEN
    RAISE EXCEPTION 'invoice_payment_amount_invalid';
  END IF;
  IF p_source NOT IN ('manual', 'portal', 'legacy_backfill') THEN
    RAISE EXCEPTION 'invoice_payment_source_invalid';
  END IF;
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) = 0 OR length(p_idempotency_key) > 200 THEN
    RAISE EXCEPTION 'invoice_payment_idempotency_key_invalid';
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

  SELECT * INTO existing_payment
  FROM public.invoice_payments
  WHERE user_id = p_user_id AND idempotency_key = trim(p_idempotency_key);
  IF FOUND THEN
    IF existing_payment.invoice_id <> p_invoice_id
      OR existing_payment.amount_cents <> p_amount_cents
      OR UPPER(existing_payment.currency) <> UPPER(p_currency)
      OR existing_payment.source <> p_source THEN
      RAISE EXCEPTION 'invoice_payment_idempotency_key_reused';
    END IF;
    SELECT * INTO invoice_row
    FROM public.invoices
    WHERE id = p_invoice_id AND user_id = p_user_id;
    RETURN invoice_row;
  END IF;

  SELECT COALESCE(SUM(amount_cents), 0) INTO total_paid
  FROM public.invoice_payments
  WHERE invoice_id = p_invoice_id AND status = 'succeeded';

  IF total_paid + p_amount_cents > invoice_row.total THEN
    RAISE EXCEPTION 'invoice_payment_exceeds_amount_due';
  END IF;

  payment_received_at := COALESCE(p_received_at, NOW());
  INSERT INTO public.invoice_payments (
    invoice_id, user_id, amount_cents, currency, status, source, received_at, idempotency_key
  ) VALUES (
    p_invoice_id, p_user_id, p_amount_cents, UPPER(p_currency), 'succeeded', p_source, payment_received_at, trim(p_idempotency_key)
  );

  total_paid := total_paid + p_amount_cents;
  UPDATE public.invoices
  SET amount_paid_cents = total_paid,
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

  UPDATE public.first_revenue_loops
  SET first_payment_received_at = COALESCE(first_payment_received_at, payment_received_at),
      stage = CASE WHEN invoice_row.payment_status = 'paid' THEN 'complete'
                   WHEN stage IN ('quote_approved', 'invoice_created') THEN 'first_payment_received'
                   ELSE stage END,
      completed_at = CASE WHEN invoice_row.payment_status = 'paid' THEN COALESCE(completed_at, payment_received_at)
                          ELSE completed_at END,
      updated_at = NOW()
  WHERE user_id = p_user_id AND invoice_id = p_invoice_id;

  RETURN invoice_row;
END;
$$;

DROP FUNCTION public.record_invoice_payment(UUID, UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ);

REVOKE ALL ON FUNCTION public.record_invoice_payment(UUID, UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_invoice_payment(UUID, UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ, TEXT) TO service_role;
