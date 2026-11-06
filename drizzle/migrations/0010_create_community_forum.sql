CREATE TABLE public.community_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL CHECK (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text NOT NULL,
  bio text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX community_profiles_username_key ON public.community_profiles (lower(username));
GRANT SELECT ON public.community_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.community_profiles TO authenticated;
GRANT ALL ON public.community_profiles TO service_role;
ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.community_profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.community_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.community_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.forum_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,40}$'),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort smallint NOT NULL DEFAULT 0
);
GRANT SELECT ON public.forum_categories TO anon, authenticated;
GRANT ALL ON public.forum_categories TO service_role;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.forum_categories FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.forum_categories (slug, name, description, sort) VALUES
  ('rosacea-basics', 'Rosacea basics', 'Understanding redness, flushing and sensitive skin.', 1),
  ('triggers-lifestyle', 'Triggers & lifestyle', 'Food, weather, stress and everyday habits.', 2),
  ('treatments-routines', 'Treatments & routines', 'Skincare routines, creams and professional treatments people discuss.', 3),
  ('emotional-support', 'Emotional support', 'A kind space for the feelings side of skin.', 4),
  ('botox-aesthetics', 'Botox & aesthetics', 'Educational talk about cosmetic treatments and consultations.', 5),
  ('general', 'General chat', 'Everything else community-related.', 6);

CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.forum_categories(id),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 140),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  image_path text,
  status text NOT NULL DEFAULT 'visible' CHECK (status IN ('visible','hidden','deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX forum_posts_category_created ON public.forum_posts (category_id, created_at DESC);
GRANT SELECT ON public.forum_posts TO anon;
GRANT SELECT, INSERT, UPDATE ON public.forum_posts TO authenticated;
GRANT ALL ON public.forum_posts TO service_role;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_forum_moderator() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','moderator'))
$$;
GRANT EXECUTE ON FUNCTION public.is_forum_moderator() TO authenticated;

CREATE POLICY "posts_public_read" ON public.forum_posts FOR SELECT TO anon, authenticated
  USING (status = 'visible' OR author_id = auth.uid() OR public.is_forum_moderator());
CREATE POLICY "posts_insert_own" ON public.forum_posts FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND status = 'visible');
CREATE POLICY "posts_update_own" ON public.forum_posts FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND status <> 'hidden')
  WITH CHECK (author_id = auth.uid() AND status <> 'hidden');
CREATE POLICY "posts_update_moderator" ON public.forum_posts FOR UPDATE TO authenticated
  USING (public.is_forum_moderator()) WITH CHECK (public.is_forum_moderator());

CREATE OR REPLACE FUNCTION public.set_forum_post_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER forum_posts_updated_at BEFORE UPDATE ON public.forum_posts FOR EACH ROW EXECUTE FUNCTION public.set_forum_post_updated_at();

CREATE TABLE public.forum_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  status text NOT NULL DEFAULT 'visible' CHECK (status IN ('visible','hidden','deleted')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX forum_comments_post_created ON public.forum_comments (post_id, created_at);
GRANT SELECT ON public.forum_comments TO anon;
GRANT SELECT, INSERT, UPDATE ON public.forum_comments TO authenticated;
GRANT ALL ON public.forum_comments TO service_role;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_public_read" ON public.forum_comments FOR SELECT TO anon, authenticated
  USING (status = 'visible' OR author_id = auth.uid() OR public.is_forum_moderator());
CREATE POLICY "comments_insert_own" ON public.forum_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND status = 'visible');
CREATE POLICY "comments_update_own" ON public.forum_comments FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND status <> 'hidden')
  WITH CHECK (author_id = auth.uid() AND status <> 'hidden');
CREATE POLICY "comments_update_moderator" ON public.forum_comments FOR UPDATE TO authenticated
  USING (public.is_forum_moderator()) WITH CHECK (public.is_forum_moderator());

CREATE TABLE public.forum_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('heart','support','helpful')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((post_id IS NULL) <> (comment_id IS NULL))
);
CREATE UNIQUE INDEX forum_reactions_unique ON public.forum_reactions (user_id, kind, COALESCE(post_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(comment_id, '00000000-0000-0000-0000-000000000000'::uuid));
GRANT SELECT ON public.forum_reactions TO anon;
GRANT SELECT, INSERT, DELETE ON public.forum_reactions TO authenticated;
GRANT ALL ON public.forum_reactions TO service_role;
ALTER TABLE public.forum_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions_public_read" ON public.forum_reactions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "reactions_insert_own" ON public.forum_reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reactions_delete_own" ON public.forum_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.forum_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('spam','harassment','medical-advice','personal-info','other')),
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((post_id IS NULL) <> (comment_id IS NULL))
);
GRANT SELECT, INSERT, UPDATE ON public.forum_reports TO authenticated;
GRANT ALL ON public.forum_reports TO service_role;
ALTER TABLE public.forum_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_insert_own" ON public.forum_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports_read_own_or_mod" ON public.forum_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.is_forum_moderator());
CREATE POLICY "reports_update_moderator" ON public.forum_reports FOR UPDATE TO authenticated
  USING (public.is_forum_moderator()) WITH CHECK (public.is_forum_moderator());

CREATE TABLE public.forum_blocks (
  blocker_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.forum_blocks TO authenticated;
GRANT ALL ON public.forum_blocks TO service_role;
ALTER TABLE public.forum_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks_read_own" ON public.forum_blocks FOR SELECT TO authenticated USING (blocker_id = auth.uid());
CREATE POLICY "blocks_insert_own" ON public.forum_blocks FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "blocks_delete_own" ON public.forum_blocks FOR DELETE TO authenticated USING (blocker_id = auth.uid());

CREATE TABLE public.forum_moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('hide_post','restore_post','hide_comment','restore_comment','resolve_report','dismiss_report')),
  post_id uuid REFERENCES public.forum_posts(id) ON DELETE SET NULL,
  comment_id uuid REFERENCES public.forum_comments(id) ON DELETE SET NULL,
  report_id uuid REFERENCES public.forum_reports(id) ON DELETE SET NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.forum_moderation_actions TO authenticated;
GRANT ALL ON public.forum_moderation_actions TO service_role;
ALTER TABLE public.forum_moderation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mod_actions_read_mod" ON public.forum_moderation_actions FOR SELECT TO authenticated USING (public.is_forum_moderator());
CREATE POLICY "mod_actions_insert_mod" ON public.forum_moderation_actions FOR INSERT TO authenticated WITH CHECK (moderator_id = auth.uid() AND public.is_forum_moderator());

CREATE TABLE public.forum_request_limits (key text PRIMARY KEY, window_start timestamptz NOT NULL DEFAULT now(), count integer NOT NULL DEFAULT 1);
GRANT ALL ON public.forum_request_limits TO service_role;
ALTER TABLE public.forum_request_limits ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.forum_consume_limit(k text, max_requests integer, seconds integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE n integer; BEGIN INSERT INTO public.forum_request_limits(key) VALUES(k) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN forum_request_limits.window_start < now()-make_interval(secs=>seconds) THEN 1 ELSE forum_request_limits.count+1 END, window_start=CASE WHEN forum_request_limits.window_start < now()-make_interval(secs=>seconds) THEN now() ELSE forum_request_limits.window_start END RETURNING count INTO n; RETURN n<=max_requests; END $$;
REVOKE ALL ON FUNCTION public.forum_consume_limit(text,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.forum_consume_limit(text,integer,integer) TO authenticated, service_role;