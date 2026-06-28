-- Migration: Improve database integrity on revenue_outcomes table
-- Converts proposal_id from TEXT to UUID and adds quote relational constraints

ALTER TABLE public.revenue_outcomes
  ALTER COLUMN proposal_id TYPE UUID USING proposal_id::uuid;

-- Add foreign key constraint to quotes table
ALTER TABLE public.revenue_outcomes
  ADD CONSTRAINT fk_revenue_outcomes_proposal
  FOREIGN KEY (proposal_id) REFERENCES public.quotes(id)
  ON DELETE CASCADE;

-- Add unique constraint (user_id, proposal_id) to prevent duplicate outcomes
ALTER TABLE public.revenue_outcomes
  ADD CONSTRAINT unique_user_proposal_outcome
  UNIQUE (user_id, proposal_id);
