-- Direct (Mensagens) - schema inicial (v4 realtime sem EXCEPTION)

-- 1) Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_type' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.conversation_type AS ENUM ('direct', 'group');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_folder' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.conversation_folder AS ENUM ('inbox', 'requests');
  END IF;
END $$;

-- 2) Tables
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT follows_not_self CHECK (follower_id <> following_id),
  CONSTRAINT follows_unique UNIQUE (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.conversation_type NOT NULL,
  group_name TEXT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  folder public.conversation_folder NOT NULL DEFAULT 'inbox',
  accepted_at TIMESTAMPTZ NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ NULL,
  member_role TEXT NOT NULL DEFAULT 'member',
  CONSTRAINT conversation_members_pk PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  storage_bucket TEXT NOT NULL DEFAULT 'dm-attachments',
  storage_path TEXT NOT NULL,
  file_name TEXT NULL,
  content_type TEXT NULL,
  size_bytes BIGINT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.member_status (
  user_id UUID PRIMARY KEY,
  status_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

-- 3) RLS enable
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_status ENABLE ROW LEVEL SECURITY;

-- 4) Policies
DO $$ BEGIN
  -- follows
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='follows' AND policyname='Users can view own follows') THEN
    EXECUTE 'CREATE POLICY "Users can view own follows" ON public.follows FOR SELECT USING (auth.uid() = follower_id)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='follows' AND policyname='Users can follow') THEN
    EXECUTE 'CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='follows' AND policyname='Users can unfollow') THEN
    EXECUTE 'CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id)';
  END IF;

  -- conversations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversations' AND policyname='Members can view conversations') THEN
    EXECUTE $sql$
      CREATE POLICY "Members can view conversations"
      ON public.conversations
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.conversation_members cm
          WHERE cm.conversation_id = conversations.id
            AND cm.user_id = auth.uid()
        )
      )
    $sql$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversations' AND policyname='No direct insert conversations') THEN
    EXECUTE 'CREATE POLICY "No direct insert conversations" ON public.conversations FOR INSERT WITH CHECK (false)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversations' AND policyname='No direct update conversations') THEN
    EXECUTE 'CREATE POLICY "No direct update conversations" ON public.conversations FOR UPDATE USING (false) WITH CHECK (false)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversations' AND policyname='No direct delete conversations') THEN
    EXECUTE 'CREATE POLICY "No direct delete conversations" ON public.conversations FOR DELETE USING (false)';
  END IF;

  -- conversation_members
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversation_members' AND policyname='Users can view their memberships') THEN
    EXECUTE 'CREATE POLICY "Users can view their memberships" ON public.conversation_members FOR SELECT USING (auth.uid() = user_id)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversation_members' AND policyname='Users can update their membership') THEN
    EXECUTE 'CREATE POLICY "Users can update their membership" ON public.conversation_members FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversation_members' AND policyname='No direct insert conversation_members') THEN
    EXECUTE 'CREATE POLICY "No direct insert conversation_members" ON public.conversation_members FOR INSERT WITH CHECK (false)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversation_members' AND policyname='No direct delete conversation_members') THEN
    EXECUTE 'CREATE POLICY "No direct delete conversation_members" ON public.conversation_members FOR DELETE USING (false)';
  END IF;

  -- messages
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Members can view messages') THEN
    EXECUTE $sql$
      CREATE POLICY "Members can view messages"
      ON public.messages
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.conversation_members cm
          WHERE cm.conversation_id = messages.conversation_id
            AND cm.user_id = auth.uid()
        )
      )
    $sql$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Members can send messages') THEN
    EXECUTE $sql$
      CREATE POLICY "Members can send messages"
      ON public.messages
      FOR INSERT
      WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
          SELECT 1
          FROM public.conversation_members cm
          WHERE cm.conversation_id = messages.conversation_id
            AND cm.user_id = auth.uid()
        )
      )
    $sql$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='No update messages') THEN
    EXECUTE 'CREATE POLICY "No update messages" ON public.messages FOR UPDATE USING (false) WITH CHECK (false)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='No delete messages') THEN
    EXECUTE 'CREATE POLICY "No delete messages" ON public.messages FOR DELETE USING (false)';
  END IF;

  -- attachments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='message_attachments' AND policyname='Members can view attachments') THEN
    EXECUTE $sql$
      CREATE POLICY "Members can view attachments"
      ON public.message_attachments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.messages m
          JOIN public.conversation_members cm
            ON cm.conversation_id = m.conversation_id
          WHERE m.id = message_attachments.message_id
            AND cm.user_id = auth.uid()
        )
      )
    $sql$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='message_attachments' AND policyname='Sender can add attachments') THEN
    EXECUTE $sql$
      CREATE POLICY "Sender can add attachments"
      ON public.message_attachments
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.messages m
          WHERE m.id = message_attachments.message_id
            AND m.sender_id = auth.uid()
        )
      )
    $sql$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='message_attachments' AND policyname='No update attachments') THEN
    EXECUTE 'CREATE POLICY "No update attachments" ON public.message_attachments FOR UPDATE USING (false) WITH CHECK (false)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='message_attachments' AND policyname='No delete attachments') THEN
    EXECUTE 'CREATE POLICY "No delete attachments" ON public.message_attachments FOR DELETE USING (false)';
  END IF;

  -- status
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='member_status' AND policyname='Authenticated can view statuses') THEN
    EXECUTE 'CREATE POLICY "Authenticated can view statuses" ON public.member_status FOR SELECT USING (auth.uid() IS NOT NULL)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='member_status' AND policyname='Users can upsert own status') THEN
    EXECUTE 'CREATE POLICY "Users can upsert own status" ON public.member_status FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='member_status' AND policyname='Users can update own status') THEN
    EXECUTE 'CREATE POLICY "Users can update own status" ON public.member_status FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='member_status' AND policyname='Users can delete own status') THEN
    EXECUTE 'CREATE POLICY "Users can delete own status" ON public.member_status FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

-- 5) Indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows (following_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations (last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user_folder ON public.conversation_members (user_id, folder);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation ON public.conversation_members (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON public.message_attachments (message_id);
CREATE INDEX IF NOT EXISTS idx_member_status_expires_at ON public.member_status (expires_at DESC);

-- 6) Functions
CREATE OR REPLACE FUNCTION public.is_mutual_follow(a UUID, b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.follows f1
    WHERE f1.follower_id = a AND f1.following_id = b
  ) AND EXISTS(
    SELECT 1 FROM public.follows f2
    WHERE f2.follower_id = b AND f2.following_id = a
  );
$$;

CREATE OR REPLACE FUNCTION public.create_conversation(
  p_type public.conversation_type,
  p_member_ids UUID[],
  p_group_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me UUID;
  v_conversation_id UUID;
  v_other UUID;
  v_cnt INT;
BEGIN
  v_me := auth.uid();
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_cnt := COALESCE(array_length(p_member_ids, 1), 0);
  IF v_cnt < 2 THEN
    RAISE EXCEPTION 'At least 2 members required';
  END IF;

  IF NOT (v_me = ANY(p_member_ids)) THEN
    RAISE EXCEPTION 'Creator must be included in members';
  END IF;

  IF p_type = 'direct' THEN
    IF v_cnt <> 2 THEN
      RAISE EXCEPTION 'Direct conversation must have exactly 2 members';
    END IF;

    SELECT u INTO v_other
    FROM unnest(p_member_ids) AS u
    WHERE u <> v_me
    LIMIT 1;

    SELECT c.id INTO v_conversation_id
    FROM public.conversations c
    WHERE c.type = 'direct'
      AND EXISTS (SELECT 1 FROM public.conversation_members cm1 WHERE cm1.conversation_id = c.id AND cm1.user_id = v_me)
      AND EXISTS (SELECT 1 FROM public.conversation_members cm2 WHERE cm2.conversation_id = c.id AND cm2.user_id = v_other)
    LIMIT 1;

    IF v_conversation_id IS NOT NULL THEN
      RETURN v_conversation_id;
    END IF;
  END IF;

  INSERT INTO public.conversations(type, group_name, created_by)
  VALUES (p_type, CASE WHEN p_type='group' THEN p_group_name ELSE NULL END, v_me)
  RETURNING id INTO v_conversation_id;

  INSERT INTO public.conversation_members(conversation_id, user_id, folder, accepted_at)
  VALUES (v_conversation_id, v_me, 'inbox', now());

  INSERT INTO public.conversation_members(conversation_id, user_id, folder, accepted_at)
  SELECT
    v_conversation_id,
    u,
    CASE WHEN public.is_mutual_follow(v_me, u) THEN 'inbox' ELSE 'requests' END,
    CASE WHEN public.is_mutual_follow(v_me, u) THEN now() ELSE NULL END
  FROM unnest(p_member_ids) AS u
  WHERE u <> v_me;

  RETURN v_conversation_id;
END;
$$;

-- 7) Realtime (idempotente)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
END $$;

-- 8) Storage bucket + policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('dm-attachments', 'dm-attachments', false)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='DM members can read attachments') THEN
    EXECUTE $sql$
      CREATE POLICY "DM members can read attachments"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'dm-attachments'
        AND EXISTS (
          SELECT 1
          FROM public.conversation_members cm
          WHERE cm.conversation_id = (storage.foldername(name))[1]::uuid
            AND cm.user_id = auth.uid()
        )
      )
    $sql$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='DM members can upload attachments') THEN
    EXECUTE $sql$
      CREATE POLICY "DM members can upload attachments"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'dm-attachments'
        AND EXISTS (
          SELECT 1
          FROM public.conversation_members cm
          WHERE cm.conversation_id = (storage.foldername(name))[1]::uuid
            AND cm.user_id = auth.uid()
        )
      )
    $sql$;
  END IF;
END $$;
