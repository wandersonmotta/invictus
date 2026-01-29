-- Allow authors to edit their Feed comments anytime
-- 1) Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.feed_post_comments ENABLE ROW LEVEL SECURITY;

-- 2) UPDATE policy for authors (no time limit)
CREATE POLICY "Feed comments updatable"
ON public.feed_post_comments
FOR UPDATE
TO public
USING (
  is_approved()
  AND auth.uid() IS NOT NULL
  AND author_id = auth.uid()
  AND can_view_post(post_id)
)
WITH CHECK (
  is_approved()
  AND auth.uid() IS NOT NULL
  AND author_id = auth.uid()
  AND can_view_post(post_id)
);

-- 3) RPC to edit comment body with server-side validation
CREATE OR REPLACE FUNCTION public.edit_feed_post_comment(
  p_comment_id uuid,
  p_body text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_body text;
  v_id uuid;
BEGIN
  v_body := btrim(coalesce(p_body, ''));

  IF v_body = '' THEN
    RAISE EXCEPTION 'Comentário vazio';
  END IF;

  IF length(v_body) > 1000 THEN
    RAISE EXCEPTION 'Comentário muito longo';
  END IF;

  UPDATE public.feed_post_comments
  SET body = v_body
  WHERE id = p_comment_id
    AND author_id = auth.uid()
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Comentário não encontrado ou sem permissão';
  END IF;

  RETURN v_id;
END;
$$;

-- 4) Ensure delete RPC has no time restriction (author anytime; admin also allowed)
CREATE OR REPLACE FUNCTION public.delete_feed_post_comment(
  p_comment_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_deleted int;
BEGIN
  DELETE FROM public.feed_post_comments
  WHERE id = p_comment_id
    AND (
      author_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$;