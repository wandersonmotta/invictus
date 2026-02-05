-- Function to delete a feed post (author only)
CREATE OR REPLACE FUNCTION public.delete_feed_post(p_post_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_author uuid;
BEGIN
  -- Verify authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Verify approved status
  IF NOT public.is_approved() THEN
    RAISE EXCEPTION 'Not approved';
  END IF;
  
  -- Get author and verify exists
  SELECT author_id INTO v_author
  FROM public.feed_posts
  WHERE id = p_post_id;
  
  IF v_author IS NULL THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
  
  -- Verify caller is the author
  IF v_author <> auth.uid() THEN
    RAISE EXCEPTION 'Not the author';
  END IF;
  
  -- Delete the post (cascade handles media, likes, comments)
  DELETE FROM public.feed_posts WHERE id = p_post_id;
  
  RETURN true;
END;
$$;