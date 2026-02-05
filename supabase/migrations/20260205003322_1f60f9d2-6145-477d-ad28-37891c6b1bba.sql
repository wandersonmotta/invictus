-- List followers: returns who follows the specified user
CREATE OR REPLACE FUNCTION public.list_followers(
  p_user_id uuid,
  p_search text DEFAULT ''::text,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  is_following boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_viewer uuid;
  v_q text;
  v_q_at text;
BEGIN
  v_viewer := auth.uid();
  IF v_viewer IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_approved() THEN
    RAISE EXCEPTION 'Not approved';
  END IF;

  v_q := btrim(COALESCE(p_search, ''));
  v_q_at := CASE
    WHEN v_q = '' THEN ''
    WHEN left(v_q, 1) = '@' THEN lower(v_q)
    ELSE lower('@' || v_q)
  END;

  RETURN QUERY
  SELECT
    p.user_id,
    COALESCE(NULLIF(p.display_name, ''), 'Membro') AS display_name,
    p.username,
    p.avatar_url,
    EXISTS(
      SELECT 1 FROM public.follows f2
      WHERE f2.follower_id = v_viewer
        AND f2.following_id = p.user_id
    ) AS is_following
  FROM public.follows f
  JOIN public.profiles p ON p.user_id = f.follower_id
  WHERE f.following_id = p_user_id
    AND p.access_status = 'approved'::public.access_status
    AND (
      v_q = ''
      OR COALESCE(p.display_name, '') ILIKE ('%' || v_q || '%')
      OR COALESCE(p.first_name, '') ILIKE ('%' || v_q || '%')
      OR COALESCE(p.last_name, '') ILIKE ('%' || v_q || '%')
      OR (p.username IS NOT NULL AND lower(p.username) ILIKE ('%' || v_q_at || '%'))
    )
  ORDER BY f.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
END;
$$;

-- List following: returns who the specified user follows
CREATE OR REPLACE FUNCTION public.list_following(
  p_user_id uuid,
  p_search text DEFAULT ''::text,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  is_following boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_viewer uuid;
  v_q text;
  v_q_at text;
BEGIN
  v_viewer := auth.uid();
  IF v_viewer IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_approved() THEN
    RAISE EXCEPTION 'Not approved';
  END IF;

  v_q := btrim(COALESCE(p_search, ''));
  v_q_at := CASE
    WHEN v_q = '' THEN ''
    WHEN left(v_q, 1) = '@' THEN lower(v_q)
    ELSE lower('@' || v_q)
  END;

  RETURN QUERY
  SELECT
    p.user_id,
    COALESCE(NULLIF(p.display_name, ''), 'Membro') AS display_name,
    p.username,
    p.avatar_url,
    EXISTS(
      SELECT 1 FROM public.follows f2
      WHERE f2.follower_id = v_viewer
        AND f2.following_id = p.user_id
    ) AS is_following
  FROM public.follows f
  JOIN public.profiles p ON p.user_id = f.following_id
  WHERE f.follower_id = p_user_id
    AND p.access_status = 'approved'::public.access_status
    AND (
      v_q = ''
      OR COALESCE(p.display_name, '') ILIKE ('%' || v_q || '%')
      OR COALESCE(p.first_name, '') ILIKE ('%' || v_q || '%')
      OR COALESCE(p.last_name, '') ILIKE ('%' || v_q || '%')
      OR (p.username IS NOT NULL AND lower(p.username) ILIKE ('%' || v_q_at || '%'))
    )
  ORDER BY f.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
END;
$$;

-- Remove follower: allows profile owner to remove a follower
CREATE OR REPLACE FUNCTION public.remove_follower(p_follower_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_deleted int;
BEGIN
  v_me := auth.uid();
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_approved() THEN
    RAISE EXCEPTION 'Not approved';
  END IF;

  IF p_follower_id IS NULL OR p_follower_id = v_me THEN
    RAISE EXCEPTION 'Invalid follower';
  END IF;

  -- Delete the follow where p_follower_id follows ME
  DELETE FROM public.follows
  WHERE follower_id = p_follower_id
    AND following_id = v_me;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$;