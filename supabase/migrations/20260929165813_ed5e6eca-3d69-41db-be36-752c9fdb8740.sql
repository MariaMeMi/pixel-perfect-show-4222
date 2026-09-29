CREATE TABLE public.rosie_conversations (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(messages) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rosie_conversations TO authenticated;
GRANT ALL ON public.rosie_conversations TO service_role;
ALTER TABLE public.rosie_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "People can view their Rosie conversation"
  ON public.rosie_conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "People can create their Rosie conversation"
  ON public.rosie_conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "People can update their Rosie conversation"
  ON public.rosie_conversations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "People can delete their Rosie conversation"
  ON public.rosie_conversations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.set_rosie_conversation_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_rosie_conversation_updated_at
BEFORE UPDATE ON public.rosie_conversations
FOR EACH ROW EXECUTE FUNCTION public.set_rosie_conversation_updated_at();