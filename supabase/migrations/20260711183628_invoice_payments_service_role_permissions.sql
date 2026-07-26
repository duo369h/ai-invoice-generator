-- Pass 4 payment settlement: preserve invoker RPC while granting its server role
-- the minimum ledger privileges required for insert and aggregate reads.

REVOKE INSERT, UPDATE, DELETE ON TABLE public.invoice_payments FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.invoice_payments TO service_role;
;
