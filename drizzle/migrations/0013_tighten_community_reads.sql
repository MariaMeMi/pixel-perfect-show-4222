DROP POLICY IF EXISTS profiles_public_read ON public.community_profiles;
CREATE POLICY profiles_public_read ON public.community_profiles FOR SELECT TO anon, authenticated
USING (
  user_id = auth.uid()
  OR public.is_forum_moderator()
  OR EXISTS (SELECT 1 FROM public.forum_posts p WHERE p.author_id = community_profiles.user_id AND p.status = 'visible')
  OR EXISTS (SELECT 1 FROM public.forum_comments c WHERE c.author_id = community_profiles.user_id AND c.status = 'visible')
);

DROP POLICY IF EXISTS reactions_public_read ON public.forum_reactions;
CREATE POLICY reactions_public_read ON public.forum_reactions FOR SELECT TO anon, authenticated
USING (
  user_id = auth.uid()
  OR public.is_forum_moderator()
  OR (post_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.forum_posts p WHERE p.id = forum_reactions.post_id AND p.status = 'visible'))
  OR (comment_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.forum_comments c WHERE c.id = forum_reactions.comment_id AND c.status = 'visible'))
);

DROP POLICY IF EXISTS community_media_read ON storage.objects;
CREATE POLICY community_media_read ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'community-media' AND (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    OR public.is_forum_moderator()
    OR EXISTS (SELECT 1 FROM public.forum_posts p WHERE p.image_path = objects.name AND p.status = 'visible')
  )
);