-- Allow messages with NULL body (for audio-only or attachment-only messages)
-- The send_message RPC already returns UUID, we just need to ensure body can be null

-- Create a new RPC that explicitly allows null body
CREATE OR REPLACE FUNCTION public.send_message_with_attachments(
  p_conversation_id UUID,
  p_body TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message_id UUID;
  v_sender_id UUID := auth.uid();
BEGIN
  -- Verify user is a member of the conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = p_conversation_id
    AND user_id = v_sender_id
  ) THEN
    RAISE EXCEPTION 'Not a member of this conversation';
  END IF;

  -- Insert message (body can be null for audio/attachment-only messages)
  INSERT INTO messages (conversation_id, sender_id, body)
  VALUES (p_conversation_id, v_sender_id, p_body)
  RETURNING id INTO v_message_id;

  -- Update conversation last_message_at
  UPDATE conversations
  SET last_message_at = now(), updated_at = now()
  WHERE id = p_conversation_id;

  -- Unhide conversation for sender if it was hidden
  UPDATE conversation_members
  SET hidden_at = NULL
  WHERE conversation_id = p_conversation_id
  AND user_id = v_sender_id
  AND hidden_at IS NOT NULL;

  -- Unhide conversation for all other members too
  UPDATE conversation_members
  SET hidden_at = NULL
  WHERE conversation_id = p_conversation_id
  AND hidden_at IS NOT NULL;

  RETURN v_message_id;
END;
$$;