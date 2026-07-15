CREATE TABLE IF NOT EXISTS public.analytics_activation_claims (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event TEXT NOT NULL CHECK (event IN ('first_quote_created', 'first_invoice_created')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event)
);

ALTER TABLE public.analytics_activation_claims ENABLE ROW LEVEL SECURITY;
