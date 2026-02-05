-- 1. Criar função search_mutual_connections que retorna apenas conexões mútuas
-- Exclui perfis sem nome E sem username
CREATE OR REPLACE FUNCTION public.search_mutual_connections(
  p_search text DEFAULT ''::text,
  p_limit integer DEFAULT 30
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  username text,
  avatar_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH me AS (
    SELECT auth.uid() AS uid
  ), params AS (
    SELECT
      btrim(COALESCE(p_search, '')) AS q,
      CASE
        WHEN btrim(COALESCE(p_search, '')) = '' THEN ''
        WHEN left(btrim(COALESCE(p_search, '')), 1) = '@' THEN lower(btrim(COALESCE(p_search, '')))
        ELSE lower('@' || btrim(COALESCE(p_search, '')))
      END AS q_at
  ),
  mutual_ids AS (
    -- Pessoas que EU sigo E que ME seguem de volta
    SELECT f1.following_id AS mutual_user_id
    FROM public.follows f1
    JOIN me ON f1.follower_id = me.uid
    WHERE EXISTS (
      SELECT 1 FROM public.follows f2
      WHERE f2.follower_id = f1.following_id
        AND f2.following_id = me.uid
    )
  )
  SELECT
    p.user_id,
    COALESCE(NULLIF(p.display_name, ''), 'Membro') AS display_name,
    p.username,
    p.avatar_url
  FROM public.profiles p
  CROSS JOIN me
  CROSS JOIN params
  JOIN mutual_ids m ON m.mutual_user_id = p.user_id
  WHERE me.uid IS NOT NULL
    AND p.access_status = 'approved'
    -- Excluir perfis sem nome E sem username (o "Membro fantasma")
    AND (
      (p.display_name IS NOT NULL AND btrim(p.display_name) <> '')
      OR (p.username IS NOT NULL AND btrim(p.username) <> '')
    )
    AND (
      params.q = ''
      OR COALESCE(p.display_name, '') ILIKE ('%' || params.q || '%')
      OR (p.username IS NOT NULL AND lower(p.username) ILIKE ('%' || params.q_at || '%'))
    )
  ORDER BY p.updated_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$function$;

-- 2. Atualizar create_conversation para:
--    - Limpar hidden_at ao re-descobrir conversa DM
--    - Marcar todas mensagens antigas como deleted_for do usuário (começar do zero)
CREATE OR REPLACE FUNCTION public.create_conversation(
  p_type conversation_type,
  p_member_ids uuid[],
  p_group_name text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_me UUID;
  v_conversation_id UUID;
  v_other UUID;
  v_cnt INT;
  v_my_hidden_at TIMESTAMPTZ;
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

    -- Buscar conversa existente
    SELECT c.id INTO v_conversation_id
    FROM public.conversations c
    WHERE c.type = 'direct'
      AND EXISTS (SELECT 1 FROM public.conversation_members cm1 WHERE cm1.conversation_id = c.id AND cm1.user_id = v_me)
      AND EXISTS (SELECT 1 FROM public.conversation_members cm2 WHERE cm2.conversation_id = c.id AND cm2.user_id = v_other)
    LIMIT 1;

    IF v_conversation_id IS NOT NULL THEN
      -- Verificar se EU tinha ocultado essa conversa
      SELECT cm.hidden_at INTO v_my_hidden_at
      FROM public.conversation_members cm
      WHERE cm.conversation_id = v_conversation_id
        AND cm.user_id = v_me;

      IF v_my_hidden_at IS NOT NULL THEN
        -- Limpar hidden_at (reativar conversa)
        UPDATE public.conversation_members
        SET hidden_at = NULL
        WHERE conversation_id = v_conversation_id
          AND user_id = v_me;

        -- Marcar TODAS mensagens antigas como deleted_for mim (começar do zero)
        UPDATE public.messages
        SET deleted_for = array_append(COALESCE(deleted_for, ARRAY[]::uuid[]), v_me)
        WHERE conversation_id = v_conversation_id
          AND NOT (v_me = ANY(COALESCE(deleted_for, ARRAY[]::uuid[])));
      END IF;

      RETURN v_conversation_id;
    END IF;
  END IF;

  INSERT INTO public.conversations(type, group_name, created_by)
  VALUES (p_type, CASE WHEN p_type='group' THEN p_group_name ELSE NULL END, v_me)
  RETURNING id INTO v_conversation_id;

  -- Cast 'inbox' to conversation_folder enum
  INSERT INTO public.conversation_members(conversation_id, user_id, folder, accepted_at)
  VALUES (v_conversation_id, v_me, 'inbox'::public.conversation_folder, now());

  -- Cast folder values to conversation_folder enum
  INSERT INTO public.conversation_members(conversation_id, user_id, folder, accepted_at)
  SELECT
    v_conversation_id,
    u,
    CASE WHEN public.is_mutual_follow(v_me, u) THEN 'inbox'::public.conversation_folder ELSE 'requests'::public.conversation_folder END,
    CASE WHEN public.is_mutual_follow(v_me, u) THEN now() ELSE NULL END
  FROM unnest(p_member_ids) AS u
  WHERE u <> v_me;

  RETURN v_conversation_id;
END;
$function$;