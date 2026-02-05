-- Update get_my_threads function to hide conversations without messages
CREATE OR REPLACE FUNCTION public.get_my_threads(p_folder conversation_folder)
RETURNS TABLE(
  conversation_id uuid,
  type conversation_type,
  title text,
  avatar_urls text[],
  last_message_at timestamptz,
  accepted boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH me AS (
    SELECT auth.uid() AS uid
  ),
  agg AS (
    SELECT
      c.id AS conversation_id,
      c.type,
      c.last_message_at,
      (cm.accepted_at IS NOT NULL) AS accepted,
      -- Build title from other members' display names
      COALESCE(
        c.group_name,
        (
          SELECT string_agg(p.display_name, ', ' ORDER BY p.display_name)
          FROM conversation_members om
          JOIN profiles p ON p.user_id = om.user_id
          WHERE om.conversation_id = c.id
            AND om.user_id <> me.uid
        )
      ) AS title,
      -- Get avatar URLs from other members
      (
        SELECT array_agg(p.avatar_url ORDER BY p.display_name)
        FROM conversation_members om
        JOIN profiles p ON p.user_id = om.user_id
        WHERE om.conversation_id = c.id
          AND om.user_id <> me.uid
      ) AS avatar_urls
    FROM me
    JOIN conversation_members cm ON cm.user_id = me.uid
    JOIN conversations c ON c.id = cm.conversation_id
    WHERE me.uid IS NOT NULL
      AND cm.user_id = me.uid
      AND cm.folder = p_folder
      AND cm.hidden_at IS NULL
      AND c.last_message_at IS NOT NULL  -- Only show conversations with at least one message
  )
  SELECT
    agg.conversation_id,
    agg.type,
    agg.title,
    agg.avatar_urls,
    agg.last_message_at,
    agg.accepted
  FROM agg
  ORDER BY agg.last_message_at DESC NULLS LAST;
$$;