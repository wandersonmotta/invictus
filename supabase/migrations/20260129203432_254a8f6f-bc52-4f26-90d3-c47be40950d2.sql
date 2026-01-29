-- Feed: likes em comentários (retry com SQL simples)

-- 0) Recriar a função de listagem com retorno novo
DROP FUNCTION IF EXISTS public.list_feed_post_comments(uuid, integer);

-- 1) Tabela
CREATE TABLE IF NOT EXISTS public.feed_comment_likes (
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT feed_comment_likes_pkey PRIMARY KEY (comment_id, user_id),
  CONSTRAINT feed_comment_likes_comment_id_fkey FOREIGN KEY (comment_id)
    REFERENCES public.feed_post_comments(id)
    ON DELETE CASCADE
);

ALTER TABLE public.feed_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_feed_comment_likes_user_id ON public.feed_comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_comment_likes_comment_id ON public.feed_comment_likes(comment_id);

-- 2) Políticas (recria)
DROP POLICY IF EXISTS "Feed comment likes selectable" ON public.feed_comment_likes;
DROP POLICY IF EXISTS "Feed comment likes insertable" ON public.feed_comment_likes;
DROP POLICY IF EXISTS "Feed comment likes deletable" ON public.feed_comment_likes;

CREATE POLICY "Feed comment likes selectable"
ON public.feed_comment_likes
FOR SELECT
USING (
  is_approved()
  AND EXISTS (
    SELECT 1
    FROM public.feed_post_comments c
    WHERE c.id = feed_comment_likes.comment_id
      AND can_view_post(c.post_id)
  )
);

CREATE POLICY "Feed comment likes insertable"
ON public.feed_comment_likes
FOR INSERT
WITH CHECK (
  is_approved()
  AND auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.feed_post_comments c
    WHERE c.id = feed_comment_likes.comment_id
      AND can_view_post(c.post_id)
  )
);

CREATE POLICY "Feed comment likes deletable"
ON public.feed_comment_likes
FOR DELETE
USING (
  is_approved()
  AND auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.feed_post_comments c
    WHERE c.id = feed_comment_likes.comment_id
      AND can_view_post(c.post_id)
  )
);

-- 3) RPC toggle
CREATE OR REPLACE FUNCTION public.toggle_feed_comment_like(p_comment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_post_id uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT is_approved() THEN
    RAISE EXCEPTION 'Not approved';
  END IF;

  SELECT c.post_id INTO v_post_id
  FROM public.feed_post_comments c
  WHERE c.id = p_comment_id;

  IF v_post_id IS NULL THEN
    RAISE EXCEPTION 'Comment not found';
  END IF;

  IF NOT can_view_post(v_post_id) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.feed_comment_likes l
    WHERE l.comment_id = p_comment_id AND l.user_id = v_uid
  ) THEN
    DELETE FROM public.feed_comment_likes l
    WHERE l.comment_id = p_comment_id AND l.user_id = v_uid;
    RETURN false;
  ELSE
    INSERT INTO public.feed_comment_likes(comment_id, user_id)
    VALUES (p_comment_id, v_uid)
    ON CONFLICT DO NOTHING;
    RETURN true;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_feed_comment_like(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_feed_comment_like(uuid) TO authenticated;

-- 4) Função de listagem (agora inclui likes)
CREATE OR REPLACE FUNCTION public.list_feed_post_comments(p_post_id uuid, p_limit integer DEFAULT 200)
RETURNS TABLE(
  comment_id uuid,
  created_at timestamptz,
  body text,
  author_user_id uuid,
  author_display_name text,
  author_username text,
  author_avatar_url text,
  like_count integer,
  liked_by_me boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_viewer uuid;
BEGIN
  v_viewer := auth.uid();
  IF v_viewer IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_approved() THEN
    RAISE EXCEPTION 'Not approved';
  END IF;

  IF NOT public.can_view_post(p_post_id) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    c.id AS comment_id,
    c.created_at,
    c.body,
    c.author_id AS author_user_id,
    COALESCE(NULLIF(pr.display_name, ''), 'Membro') AS author_display_name,
    pr.username AS author_username,
    pr.avatar_url AS author_avatar_url,
    COALESCE(COUNT(l.user_id), 0)::int AS like_count,
    COALESCE(BOOL_OR(l.user_id = v_viewer), false) AS liked_by_me
  FROM public.feed_post_comments c
  JOIN public.profiles pr ON pr.user_id = c.author_id
  LEFT JOIN public.feed_comment_likes l ON l.comment_id = c.id
  WHERE c.post_id = p_post_id
  GROUP BY
    c.id,
    c.created_at,
    c.body,
    c.author_id,
    pr.display_name,
    pr.username,
    pr.avatar_url
  ORDER BY c.created_at ASC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 200), 200));
END;
$$;

REVOKE ALL ON FUNCTION public.list_feed_post_comments(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_feed_post_comments(uuid, integer) TO authenticated;
