CREATE TABLE public.skin_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  device_hash text NOT NULL,
  path text NOT NULL UNIQUE,
  score integer,
  summary text,
  lang text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX skin_photos_user_idx ON public.skin_photos(user_id);
CREATE INDEX skin_photos_device_idx ON public.skin_photos(device_hash, created_at);
GRANT ALL ON public.skin_photos TO service_role;
ALTER TABLE public.skin_photos ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.skin_photos IS 'Consented skin-check photos; server-only access.';