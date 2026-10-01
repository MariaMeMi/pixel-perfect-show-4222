CREATE TABLE public.user_plans (
  user_id uuid NOT NULL,
  environment text NOT NULL DEFAULT 'sandbox',
  plan text NOT NULL DEFAULT 'free',
  plus_started_at timestamptz,
  plus_expires_at timestamptz,
  stripe_session_id text,
  stripe_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, environment)
);
GRANT SELECT ON public.user_plans TO authenticated;
GRANT ALL ON public.user_plans TO service_role;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "People can view their own plan" ON public.user_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);