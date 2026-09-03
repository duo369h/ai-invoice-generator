SET lock_timeout = '10s';

-- R56B2A: make creation usage immutable while leaving business-document
-- deletion behavior unchanged. The existing ledger has no FK from
-- document_id to quotes/invoices, so deleting a document cannot delete its
-- creation event.
ALTER TABLE public.document_usage_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.document_usage_events FROM PUBLIC, anon, authenticated, service_role;

-- Backfill only currently applicable-cycle documents. This preserves existing
-- current-cycle usage without inventing history outside the active cycle.
INSERT INTO public.document_usage_events (
  user_id, document_type, document_id, idempotency_key,
  cycle_start, cycle_end, created_at
)
SELECT q.user_id, 'quote', q.id, q.id,
       c.cycle_start, c.cycle_end, q.created_at
FROM public.quotes q
CROSS JOIN LATERAL public.get_user_active_document_cycle(q.user_id) c
WHERE c.doc_limit IS NOT NULL
  AND q.created_at >= c.cycle_start
  AND q.created_at < c.cycle_end
ON CONFLICT (user_id, document_type, document_id) DO NOTHING;

INSERT INTO public.document_usage_events (
  user_id, document_type, document_id, idempotency_key,
  cycle_start, cycle_end, created_at
)
SELECT i.user_id, 'invoice', i.id, i.id,
       c.cycle_start, c.cycle_end, i.created_at
FROM public.invoices i
CROSS JOIN LATERAL public.get_user_active_document_cycle(i.user_id) c
WHERE c.doc_limit IS NOT NULL
  AND i.created_at >= c.cycle_start
  AND i.created_at < c.cycle_end
ON CONFLICT (user_id, document_type, document_id) DO NOTHING;

-- Trusted-server quota read. The private ledger is never exposed to the Data
-- API roles; only the service role may call this function.
CREATE OR REPLACE FUNCTION public.get_user_document_usage(
  p_user_id UUID
)
RETURNS TABLE (
  cycle_start TIMESTAMPTZ,
  cycle_end TIMESTAMPTZ,
  doc_limit INT,
  total_used BIGINT,
  quotes_used BIGINT,
  invoices_used BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cycle_start TIMESTAMPTZ;
  v_cycle_end TIMESTAMPTZ;
  v_limit INT;
BEGIN
  SELECT c.cycle_start, c.cycle_end, c.doc_limit
    INTO v_cycle_start, v_cycle_end, v_limit
  FROM public.get_user_active_document_cycle(p_user_id) c;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE e.document_type = 'quote'),
    COUNT(*) FILTER (WHERE e.document_type = 'invoice')
    INTO total_used, quotes_used, invoices_used
  FROM public.document_usage_events e
  WHERE e.user_id = p_user_id
    AND e.cycle_start = v_cycle_start
    AND e.cycle_end = v_cycle_end;

  cycle_start := v_cycle_start;
  cycle_end := v_cycle_end;
  doc_limit := v_limit;
  RETURN NEXT;
END;
$$;

-- Atomic Quote creation: one advisory lock, immutable usage count, business
-- insert, and usage-event insert in the same transaction.
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
  v_count BIGINT;
  v_client_id UUID;
  v_quote_row public.quotes%ROWTYPE;
  v_event_rows INT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  SELECT c.cycle_start, c.cycle_end, c.doc_limit
    INTO v_cycle_start, v_cycle_end, v_limit
  FROM public.get_user_active_document_cycle(p_user_id) c;

  IF v_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM public.document_usage_events e
    WHERE e.user_id = p_user_id
      AND e.cycle_start = v_cycle_start
      AND e.cycle_end = v_cycle_end;

    IF v_count >= v_limit THEN
      RAISE EXCEPTION 'QUOTA_EXCEEDED: allowance of % documents reached for cycle', v_limit
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  v_client_id := NULLIF(p_quote_payload->>'client_id', '')::UUID;
  IF v_client_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = v_client_id AND c.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'CLIENT_NOT_OWNED' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.quotes (
    user_id, client_id, quote_number,
    client_name, client_email, client_address,
    business_name, business_email, business_address, logo_url,
    items, subtotal, discount_rate, discount_amount,
    tax_rate, tax_amount, total, currency, notes, status
  ) VALUES (
    p_user_id,
    v_client_id,
    COALESCE(NULLIF(p_quote_payload->>'quote_number', ''), 'QUO-' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6))),
    COALESCE(p_quote_payload->>'client_name', ''),
    COALESCE(p_quote_payload->>'client_email', ''),
    COALESCE(p_quote_payload->>'client_address', ''),
    COALESCE(p_quote_payload->>'business_name', ''),
    COALESCE(p_quote_payload->>'business_email', ''),
    COALESCE(p_quote_payload->>'business_address', ''),
    COALESCE(p_quote_payload->>'logo_url', ''),
    COALESCE(p_quote_payload->'items', '[]'::JSONB),
    COALESCE(NULLIF(p_quote_payload->>'subtotal', '')::INT, 0),
    COALESCE(NULLIF(p_quote_payload->>'discount_rate', '')::NUMERIC, 0),
    COALESCE(NULLIF(p_quote_payload->>'discount_amount', '')::INT, 0),
    COALESCE(NULLIF(p_quote_payload->>'tax_rate', '')::NUMERIC, 0),
    COALESCE(NULLIF(p_quote_payload->>'tax_amount', '')::INT, 0),
    COALESCE(NULLIF(p_quote_payload->>'total', '')::INT, 0),
    COALESCE(NULLIF(p_quote_payload->>'currency', ''), 'USD'),
    COALESCE(p_quote_payload->>'notes', ''),
    COALESCE(NULLIF(p_quote_payload->>'status', ''), 'draft')
  )
  RETURNING * INTO v_quote_row;

  INSERT INTO public.document_usage_events (
    user_id, document_type, document_id, idempotency_key, cycle_start, cycle_end
  ) VALUES (
    p_user_id, 'quote', v_quote_row.id, v_quote_row.id, v_cycle_start, v_cycle_end
  ) ON CONFLICT (user_id, document_type, document_id) DO NOTHING;
  GET DIAGNOSTICS v_event_rows = ROW_COUNT;
  IF v_event_rows = 0 AND NOT EXISTS (
    SELECT 1 FROM public.document_usage_events e
    WHERE e.user_id = p_user_id AND e.document_type = 'quote' AND e.document_id = v_quote_row.id
  ) THEN
    RAISE EXCEPTION 'DOCUMENT_USAGE_IDEMPOTENCY_INTEGRITY_ERROR';
  END IF;

  RETURN to_jsonb(v_quote_row);
END;
$$;

-- Atomic Invoice creation: same immutable counter and transaction boundary;
-- payment truth remains initialized by the database, not the caller.
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
  v_count BIGINT;
  v_client_id UUID;
  v_quote_id UUID;
  v_total INT;
  v_requested_status TEXT;
  v_invoice_row public.invoices%ROWTYPE;
  v_event_rows INT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  SELECT c.cycle_start, c.cycle_end, c.doc_limit
    INTO v_cycle_start, v_cycle_end, v_limit
  FROM public.get_user_active_document_cycle(p_user_id) c;

  IF v_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM public.document_usage_events e
    WHERE e.user_id = p_user_id
      AND e.cycle_start = v_cycle_start
      AND e.cycle_end = v_cycle_end;

    IF v_count >= v_limit THEN
      RAISE EXCEPTION 'QUOTA_EXCEEDED: allowance of % documents reached for cycle', v_limit
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  v_client_id := NULLIF(p_invoice_payload->>'client_id', '')::UUID;
  IF v_client_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = v_client_id AND c.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'CLIENT_NOT_OWNED' USING ERRCODE = 'P0001';
  END IF;

  v_quote_id := NULLIF(p_invoice_payload->>'quote_id', '')::UUID;
  IF v_quote_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.quotes q WHERE q.id = v_quote_id AND q.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'QUOTE_NOT_OWNED' USING ERRCODE = 'P0001';
  END IF;

  v_total := GREATEST(COALESCE(NULLIF(p_invoice_payload->>'total', '')::INT, 0), 0);
  v_requested_status := lower(COALESCE(NULLIF(p_invoice_payload->>'status', ''), 'draft'));
  IF v_requested_status NOT IN ('draft', 'pending', 'sent', 'overdue', 'approved') THEN
    v_requested_status := 'draft';
  END IF;

  INSERT INTO public.invoices (
    user_id, invoice_number, status, doc_type,
    invoice_kind, payment_status, amount_paid_cents, amount_due_cents,
    client_id, quote_id, payment_link,
    client_name, client_email, client_address,
    business_name, business_email, business_address, logo_url,
    currency, items, subtotal, discount_rate, discount_amount,
    tax_rate, tax_amount, total, invoice_date, due_date,
    payment_terms, notes
  ) VALUES (
    p_user_id,
    COALESCE(NULLIF(p_invoice_payload->>'invoice_number', ''), 'INV-' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6))),
    v_requested_status,
    CASE WHEN lower(COALESCE(p_invoice_payload->>'doc_type', 'invoice')) IN ('invoice', 'receipt') THEN lower(COALESCE(p_invoice_payload->>'doc_type', 'invoice')) ELSE 'invoice' END,
    CASE WHEN lower(COALESCE(p_invoice_payload->>'invoice_kind', 'standard')) IN ('standard', 'deposit', 'milestone', 'final') THEN lower(COALESCE(p_invoice_payload->>'invoice_kind', 'standard')) ELSE 'standard' END,
    'unpaid', 0, v_total,
    v_client_id, v_quote_id,
    COALESCE(p_invoice_payload->>'payment_link', ''),
    COALESCE(p_invoice_payload->>'client_name', ''),
    COALESCE(p_invoice_payload->>'client_email', ''),
    COALESCE(p_invoice_payload->>'client_address', ''),
    COALESCE(p_invoice_payload->>'business_name', ''),
    COALESCE(p_invoice_payload->>'business_email', ''),
    COALESCE(p_invoice_payload->>'business_address', ''),
    COALESCE(p_invoice_payload->>'logo_url', ''),
    COALESCE(NULLIF(p_invoice_payload->>'currency', ''), 'USD'),
    COALESCE(p_invoice_payload->'items', '[]'::JSONB),
    COALESCE(NULLIF(p_invoice_payload->>'subtotal', '')::INT, 0),
    COALESCE(NULLIF(p_invoice_payload->>'discount_rate', '')::NUMERIC, 0),
    COALESCE(NULLIF(p_invoice_payload->>'discount_amount', '')::INT, 0),
    COALESCE(NULLIF(p_invoice_payload->>'tax_rate', '')::NUMERIC, 0),
    COALESCE(NULLIF(p_invoice_payload->>'tax_amount', '')::INT, 0),
    v_total,
    COALESCE(NULLIF(p_invoice_payload->>'invoice_date', '')::DATE, CURRENT_DATE),
    NULLIF(p_invoice_payload->>'due_date', '')::DATE,
    COALESCE(NULLIF(p_invoice_payload->>'payment_terms', ''), 'Net 30'),
    COALESCE(p_invoice_payload->>'notes', '')
  )
  RETURNING * INTO v_invoice_row;

  INSERT INTO public.document_usage_events (
    user_id, document_type, document_id, idempotency_key, cycle_start, cycle_end
  ) VALUES (
    p_user_id, 'invoice', v_invoice_row.id, v_invoice_row.id, v_cycle_start, v_cycle_end
  ) ON CONFLICT (user_id, document_type, document_id) DO NOTHING;
  GET DIAGNOSTICS v_event_rows = ROW_COUNT;
  IF v_event_rows = 0 AND NOT EXISTS (
    SELECT 1 FROM public.document_usage_events e
    WHERE e.user_id = p_user_id AND e.document_type = 'invoice' AND e.document_id = v_invoice_row.id
  ) THEN
    RAISE EXCEPTION 'DOCUMENT_USAGE_IDEMPOTENCY_INTEGRITY_ERROR';
  END IF;

  RETURN to_jsonb(v_invoice_row);
END;
$$;

-- Explicit trusted-server-only function authority. PUBLIC is revoked first
-- because PostgreSQL grants EXECUTE to PUBLIC by default.
REVOKE ALL ON FUNCTION public.get_user_active_document_cycle(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_and_create_quote(UUID, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_and_create_invoice(UUID, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_document_usage(UUID) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_user_active_document_cycle(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_and_create_quote(UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_and_create_invoice(UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_document_usage(UUID) TO service_role;
