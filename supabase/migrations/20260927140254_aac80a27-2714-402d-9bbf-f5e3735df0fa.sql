ALTER TABLE public.experiment_events DROP CONSTRAINT IF EXISTS experiment_events_event_name_check;
ALTER TABLE public.experiment_events DROP CONSTRAINT IF EXISTS experiment_events_experience_type_check;
ALTER TABLE public.experiment_events ADD CONSTRAINT experiment_events_event_name_check CHECK (event_name ~ '^[a-z_]{3,60}$');
ALTER TABLE public.experiment_events ADD CONSTRAINT experiment_events_experience_type_check CHECK (experience_type IN ('redness','botox_information','skin_journey'));
ALTER TABLE public.experiment_events ADD COLUMN IF NOT EXISTS referral_code text CHECK (referral_code IS NULL OR referral_code ~ '^[A-Za-z0-9]{6,16}$');
ALTER TABLE public.email_leads ADD COLUMN IF NOT EXISTS referred_by text CHECK (referred_by IS NULL OR referred_by ~ '^[A-Za-z0-9]{6,16}$');
CREATE INDEX IF NOT EXISTS experiment_events_ref_idx ON public.experiment_events (referral_code);