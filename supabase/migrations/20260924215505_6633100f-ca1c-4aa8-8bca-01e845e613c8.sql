CREATE TABLE public.email_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  experience_type text NOT NULL CHECK (experience_type IN ('redness','botox_information')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.email_leads TO service_role;
ALTER TABLE public.email_leads ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.experiment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL CHECK (event_name IN ('analysis_started','analysis_completed','email_gate_viewed','email_submitted','results_viewed')),
  experience_type text NOT NULL CHECK (experience_type IN ('redness','botox_information')),
  session_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.experiment_events TO service_role;
ALTER TABLE public.experiment_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.experiment_events (experience_type, event_name, created_at);