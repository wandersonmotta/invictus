-- Fix create_conversation function to cast text to conversation_folder enum
CREATE OR REPLACE FUNCTION public.create_conversation(
  p_type public.conversation_type,
  p_member_ids UUID[],
  p_group_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
$$;