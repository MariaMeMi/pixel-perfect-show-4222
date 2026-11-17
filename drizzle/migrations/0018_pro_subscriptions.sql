CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  price_id text NOT NULL,
  pricing_group text NOT NULL CHECK (pricing_group IN ('low','premium','unknown')),
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz,
  environment text NOT NULL CHECK (environment IN ('sandbox','live')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id, environment);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_object_id text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('payment','refund')),
  user_id uuid,
  stripe_subscription_id text,
  price_id text,
  pricing_group text NOT NULL DEFAULT 'unknown' CHECK (pricing_group IN ('low','premium','unknown')),
  amount_cents integer NOT NULL,
  currency text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('sandbox','live')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_active_pro(_user_id uuid, _env text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id AND environment = _env
      AND status IN ('active','trialing','past_due')
      AND (current_period_end IS NULL OR current_period_end > now())
  );
$$;
REVOKE EXECUTE ON FUNCTION public.has_active_pro(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_active_pro(uuid, text) TO authenticated, service_role;