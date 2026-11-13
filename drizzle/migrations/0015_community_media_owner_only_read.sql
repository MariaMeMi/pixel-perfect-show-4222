DROP POLICY IF EXISTS community_media_read ON storage.objects;
CREATE POLICY community_media_read ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'community-media' AND (((storage.foldername(name))[1] = (SELECT auth.uid()::text)) OR public.is_forum_moderator()));