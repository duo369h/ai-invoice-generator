-- Studio OS Persistence Migration (TASK E)

CREATE TABLE IF NOT EXISTS public.client_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  health TEXT NOT NULL DEFAULT 'Healthy',
  timezone TEXT NOT NULL DEFAULT 'EST (UTC-5)',
  sla TEXT NOT NULL DEFAULT '< 24 hours',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  notes TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.client_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Design',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.client_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Discovery',
  milestones JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.client_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_deliverables ENABLE ROW LEVEL SECURITY;

-- Select Policies
CREATE POLICY "Users can select own client_metadata" ON public.client_metadata FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can select own client_notes" ON public.client_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can select own client_files" ON public.client_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can select own client_deliverables" ON public.client_deliverables FOR SELECT USING (auth.uid() = user_id);

-- Insert Policies
CREATE POLICY "Users can insert own client_metadata" ON public.client_metadata FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert own client_notes" ON public.client_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert own client_files" ON public.client_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert own client_deliverables" ON public.client_deliverables FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update Policies
CREATE POLICY "Users can update own client_metadata" ON public.client_metadata FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own client_notes" ON public.client_notes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own client_files" ON public.client_files FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own client_deliverables" ON public.client_deliverables FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Delete Policies
CREATE POLICY "Users can delete own client_metadata" ON public.client_metadata FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own client_notes" ON public.client_notes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own client_files" ON public.client_files FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own client_deliverables" ON public.client_deliverables FOR DELETE USING (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_metadata TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_files TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_deliverables TO authenticated;

GRANT ALL PRIVILEGES ON public.client_metadata TO service_role;
GRANT ALL PRIVILEGES ON public.client_notes TO service_role;
GRANT ALL PRIVILEGES ON public.client_files TO service_role;
GRANT ALL PRIVILEGES ON public.client_deliverables TO service_role;
