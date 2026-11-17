CREATE TABLE public.locked_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'redness',
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.locked_analyses TO service_role;
ALTER TABLE public.locked_analyses ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_locked_analyses_created ON public.locked_analyses(created_at);