-- Phase 2: one explicit, idempotent Approved Quote -> Invoice Draft boundary.
CREATE TABLE IF NOT EXISTS public.quote_invoice_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL UNIQUE REFERENCES public.invoices(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quote_invoice_conversions_quote_unique UNIQUE (user_id, quote_id)
);

CREATE INDEX IF NOT EXISTS idx_quote_invoice_conversions_quote_id
  ON public.quote_invoice_conversions(quote_id);

ALTER TABLE public.quote_invoice_conversions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.quote_invoice_conversions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_invoice_conversions TO service_role;

CREATE OR REPLACE FUNCTION public.create_invoice_draft_from_approved_quote(
  p_user_id UUID,
  p_quote_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_quote public.quotes%ROWTYPE;
  v_existing public.quote_invoice_conversions%ROWTYPE;
  v_invoice JSONB;
  v_invoice_id UUID;
BEGIN
  -- Serialize all document creation and this conversion for the account.
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  SELECT * INTO v_quote
  FROM public.quotes
  WHERE id = p_quote_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUOTE_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_existing
  FROM public.quote_invoice_conversions
  WHERE user_id = p_user_id AND quote_id = p_quote_id;

  IF FOUND THEN
    SELECT to_jsonb(i) INTO v_invoice
    FROM public.invoices i
    WHERE i.id = v_existing.invoice_id AND i.user_id = p_user_id;
    IF v_invoice IS NULL THEN
      RAISE EXCEPTION 'QUOTE_ALREADY_CONVERTED' USING ERRCODE = 'P0001';
    END IF;
    RETURN jsonb_build_object('invoice', v_invoice, 'created', false, 'idempotent', true);
  END IF;

  IF v_quote.status = 'converted' THEN
    RAISE EXCEPTION 'QUOTE_ALREADY_CONVERTED' USING ERRCODE = 'P0001';
  END IF;
  IF v_quote.status IS DISTINCT FROM 'approved' THEN
    RAISE EXCEPTION 'QUOTE_NOT_APPROVED' USING ERRCODE = 'P0001';
  END IF;

  -- Reuse the single database quota/ownership authority. Snapshot values come
  -- from the Quote row; the live Client row is never read here.
  SELECT public.check_and_create_invoice(
    p_user_id,
    jsonb_build_object(
      'status', 'draft',
      'doc_type', 'invoice',
      'invoice_kind', 'standard',
      'client_id', v_quote.client_id,
      'quote_id', v_quote.id,
      'client_name', v_quote.client_name,
      'client_email', v_quote.client_email,
      'client_address', v_quote.client_address,
      'business_name', v_quote.business_name,
      'business_email', v_quote.business_email,
      'business_address', v_quote.business_address,
      'logo_url', v_quote.logo_url,
      'currency', v_quote.currency,
      'items', v_quote.items,
      'subtotal', v_quote.subtotal,
      'discount_rate', v_quote.discount_rate,
      'discount_amount', v_quote.discount_amount,
      'tax_rate', v_quote.tax_rate,
      'tax_amount', v_quote.tax_amount,
      'total', v_quote.total,
      'invoice_date', CURRENT_DATE,
      'payment_terms', 'Net 30',
      'notes', v_quote.notes,
      'payment_status', 'unpaid',
      'amount_paid_cents', 0,
      'amount_due_cents', v_quote.total
    )
  ) INTO v_invoice;

  v_invoice_id := (v_invoice->>'id')::UUID;
  INSERT INTO public.quote_invoice_conversions(user_id, quote_id, invoice_id)
  VALUES (p_user_id, p_quote_id, v_invoice_id);

  UPDATE public.quotes
  SET status = 'converted', updated_at = now()
  WHERE id = p_quote_id AND user_id = p_user_id AND status = 'approved';

  RETURN jsonb_build_object('invoice', v_invoice, 'created', true, 'idempotent', false);
END;
$$;

REVOKE ALL ON FUNCTION public.create_invoice_draft_from_approved_quote(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_invoice_draft_from_approved_quote(UUID, UUID) TO service_role;
