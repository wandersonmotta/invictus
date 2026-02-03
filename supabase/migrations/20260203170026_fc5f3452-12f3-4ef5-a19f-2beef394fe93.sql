-- 1. Adicionar colunas em messages para edição e exclusão
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS edited_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_for uuid[] DEFAULT '{}';

-- 2. Adicionar coluna em conversation_members para ocultar chat
ALTER TABLE public.conversation_members
ADD COLUMN IF NOT EXISTS hidden_at timestamptz DEFAULT NULL;

-- 3. Atualizar RLS de messages para permitir UPDATE pelo remetente
DROP POLICY IF EXISTS "Sender can edit own messages" ON public.messages;
CREATE POLICY "Sender can edit own messages" ON public.messages
FOR UPDATE USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- 4. Atualizar RLS de member_status para filtrar por conexões mútuas
DROP POLICY IF EXISTS "Authenticated can view statuses" ON public.member_status;
DROP POLICY IF EXISTS "View own or mutual follows statuses" ON public.member_status;
CREATE POLICY "View own or mutual follows statuses" ON public.member_status
FOR SELECT USING (
  auth.uid() = user_id 
  OR (
    EXISTS (
      SELECT 1 FROM public.follows f1
      WHERE f1.follower_id = auth.uid() 
        AND f1.following_id = member_status.user_id
    )
    AND EXISTS (
      SELECT 1 FROM public.follows f2
      WHERE f2.follower_id = member_status.user_id 
        AND f2.following_id = auth.uid()
    )
  )
);

-- 5. Criar função RPC para buscar status de conexões mútuas
CREATE OR REPLACE FUNCTION public.get_mutual_statuses()
RETURNS TABLE(
  user_id uuid,
  status_text text,
  expires_at timestamptz,
  display_name text,
  avatar_url text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    ms.user_id,
    ms.status_text,
    ms.expires_at,
    COALESCE(NULLIF(p.display_name, ''), 'Membro') AS display_name,
    p.avatar_url
  FROM public.member_status ms
  JOIN public.profiles p ON p.user_id = ms.user_id
  WHERE ms.expires_at > now()
    AND p.access_status = 'approved'::public.access_status
    AND (
      ms.user_id = auth.uid()
      OR (
        EXISTS (SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = ms.user_id)
        AND EXISTS (SELECT 1 FROM public.follows WHERE follower_id = ms.user_id AND following_id = auth.uid())
      )
    )
  ORDER BY 
    CASE WHEN ms.user_id = auth.uid() THEN 0 ELSE 1 END,
    ms.created_at DESC
  LIMIT 30;
$$;

-- 6. Criar função RPC para excluir mensagem para mim
CREATE OR REPLACE FUNCTION public.delete_message_for_me(p_message_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_me uuid;
BEGIN
  v_me := auth.uid();
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verifica se é membro da conversa
  IF NOT EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
    WHERE m.id = p_message_id AND cm.user_id = v_me
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.messages
  SET deleted_for = array_append(deleted_for, v_me)
  WHERE id = p_message_id
    AND NOT (v_me = ANY(deleted_for));

  RETURN true;
END;
$$;

-- 7. Atualizar função get_my_threads para filtrar conversas ocultas
CREATE OR REPLACE FUNCTION public.get_my_threads(p_folder public.conversation_folder)
RETURNS TABLE(
  conversation_id uuid,
  type public.conversation_type,
  title text,
  avatar_urls text[],
  last_message_at timestamptz,
  accepted boolean
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  WITH me AS (
    SELECT auth.uid() AS uid
  ), my_memberships AS (
    SELECT cm.conversation_id, cm.accepted_at
    FROM public.conversation_members cm, me
    WHERE me.uid IS NOT NULL
      AND cm.user_id = me.uid
      AND cm.folder = p_folder
      AND cm.hidden_at IS NULL  -- Filtrar conversas ocultas
  ), others AS (
    SELECT
      cm.conversation_id,
      p.user_id,
      COALESCE(NULLIF(p.display_name, ''), 'Membro') AS display_name,
      p.avatar_url
    FROM public.conversation_members cm
    JOIN public.profiles p ON p.user_id = cm.user_id
    JOIN me ON true
    WHERE cm.user_id <> me.uid
  ), agg AS (
    SELECT
      mm.conversation_id,
      c.type,
      c.group_name,
      c.last_message_at,
      (mm.accepted_at IS NOT NULL) AS accepted,
      array_remove(array_agg(o.avatar_url ORDER BY o.display_name), NULL) AS avatar_urls,
      array_agg(o.display_name ORDER BY o.display_name) AS other_names
    FROM my_memberships mm
    JOIN public.conversations c ON c.id = mm.conversation_id
    LEFT JOIN others o ON o.conversation_id = mm.conversation_id
    GROUP BY mm.conversation_id, c.type, c.group_name, c.last_message_at, mm.accepted_at
  )
  SELECT
    a.conversation_id,
    a.type,
    CASE
      WHEN a.type = 'group' THEN COALESCE(NULLIF(a.group_name, ''), 'Grupo')
      ELSE COALESCE(a.other_names[1], 'Conversa')
    END AS title,
    CASE
      WHEN a.type = 'group' THEN a.avatar_urls
      ELSE CASE WHEN array_length(a.avatar_urls,1) >= 1 THEN ARRAY[a.avatar_urls[1]] ELSE ARRAY[]::text[] END
    END AS avatar_urls,
    a.last_message_at,
    a.accepted
  FROM agg a
  ORDER BY COALESCE(a.last_message_at, now()) DESC
  LIMIT 60;
$$;