-- Messaging helpers: send message (updates last_message_at)

CREATE OR REPLACE FUNCTION public.send_message(p_conversation_id UUID, p_body TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me UUID;
  v_msg_id UUID;
BEGIN
  v_me := auth.uid();
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = p_conversation_id
      AND cm.user_id = v_me
  ) THEN
    RAISE EXCEPTION 'Not a member';
  END IF;

  IF p_body IS NULL OR length(btrim(p_body)) = 0 THEN
    RAISE EXCEPTION 'Empty message';
  END IF;

  INSERT INTO public.messages(conversation_id, sender_id, body)
  VALUES (p_conversation_id, v_me, p_body)
  RETURNING id INTO v_msg_id;

  UPDATE public.conversations
  SET last_message_at = now(), updated_at = now()
  WHERE id = p_conversation_id;

  RETURN v_msg_id;
END;
$$;