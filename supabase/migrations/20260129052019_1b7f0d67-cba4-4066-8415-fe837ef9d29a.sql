-- Messaging helpers: threads list with safe fields

CREATE OR REPLACE FUNCTION public.get_my_threads(p_folder public.conversation_folder)
RETURNS TABLE(
  conversation_id UUID,
  type public.conversation_type,
  title TEXT,
  avatar_urls TEXT[],
  last_message_at TIMESTAMPTZ,
  accepted BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH me AS (
    SELECT auth.uid() AS uid
  ), my_memberships AS (
    SELECT cm.conversation_id, cm.accepted_at
    FROM public.conversation_members cm, me
    WHERE me.uid IS NOT NULL
      AND cm.user_id = me.uid
      AND cm.folder = p_folder
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