REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
ON TABLE public.invoices, public.quotes
FROM anon, authenticated, service_role;
