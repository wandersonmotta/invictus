-- Admin: review pending profile details
CREATE OR REPLACE FUNCTION public.admin_get_pending_profile_for_review(p_profile_id uuid)
RETURNS TABLE(
  profile_id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  display_name text,
  username text,
  avatar_url text,
  bio text,
  city text,
  state text,
  region text,
  expertises text[],
  created_at timestamptz,
  access_status public.access_status
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid;
BEGIN
  v_me := auth.uid();
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_role(v_me, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    p.id AS profile_id,
    p.user_id,
    p.first_name,
    p.last_name,
    COALESCE(NULLIF(p.display_name, ''), 'Membro') AS display_name,
    p.username,
    p.avatar_url,
    p.bio,
    p.city,
    p.state,
    p.region,
    p.expertises,
    p.created_at,
    p.access_status
  FROM public.profiles p
  WHERE p.id = p_profile_id
    AND p.access_status = 'pending'::public.access_status
  LIMIT 1;
END;
$$;

-- Admin: set status (approve/reject) with audit log
CREATE OR REPLACE FUNCTION public.admin_set_profile_status(
  p_profile_id uuid,
  p_next public.access_status
)
RETURNS TABLE(
  profile_id uuid,
  user_id uuid,
  access_status public.access_status,
  approved_at timestamptz,
  approved_by uuid
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid;
  v_user_id uuid;
  v_action text;
BEGIN
  v_me := auth.uid();
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_role(v_me, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_profile_id IS NULL THEN
    RAISE EXCEPTION 'profile_id_required';
  END IF;

  IF p_next NOT IN ('approved'::public.access_status, 'rejected'::public.access_status) THEN
    RAISE EXCEPTION 'invalid_next_status';
  END IF;

  SELECT p.user_id INTO v_user_id
  FROM public.profiles p
  WHERE p.id = p_profile_id
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Update
  IF p_next = 'approved'::public.access_status THEN
    UPDATE public.profiles
    SET access_status = p_next,
        approved_at = now(),
        approved_by = v_me
    WHERE id = p_profile_id;
    v_action := 'approve_profile';
  ELSE
    UPDATE public.profiles
    SET access_status = p_next,
        approved_at = NULL,
        approved_by = NULL
    WHERE id = p_profile_id;
    v_action := 'reject_profile';
  END IF;

  -- Audit
  PERFORM public.admin_log(v_action, v_user_id);

  RETURN QUERY
  SELECT p.id, p.user_id, p.access_status, p.approved_at, p.approved_by
  FROM public.profiles p
  WHERE p.id = p_profile_id
  LIMIT 1;
END;
$$;

-- Admin: search approved members for the Members tab
CREATE OR REPLACE FUNCTION public.admin_search_members(
  p_search text DEFAULT ''::text,
  p_limit int DEFAULT 50
)
RETURNS TABLE(
  profile_id uuid,
  user_id uuid,
  display_name text,
  username text,
  city text,
  state text,
  approved_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid;
  v_q text;
  v_q_at text;
  v_q_uuid uuid;
BEGIN
  v_me := auth.uid();
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_role(v_me, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_q := btrim(COALESCE(p_search, ''));
  v_q_at := CASE
    WHEN v_q = '' THEN ''
    WHEN left(v_q, 1) = '@' THEN lower(v_q)
    ELSE lower('@' || v_q)
  END;

  BEGIN
    v_q_uuid := v_q::uuid;
  EXCEPTION WHEN others THEN
    v_q_uuid := NULL;
  END;

  RETURN QUERY
  SELECT
    p.id as profile_id,
    p.user_id,
    COALESCE(NULLIF(p.display_name, ''), 'Membro') as display_name,
    p.username,
    p.city,
    p.state,
    p.approved_at,
    p.created_at
  FROM public.profiles p
  WHERE p.access_status = 'approved'::public.access_status
    AND (
      v_q = ''
      OR COALESCE(p.display_name, '') ILIKE ('%' || v_q || '%')
      OR COALESCE(p.first_name, '') ILIKE ('%' || v_q || '%')
      OR COALESCE(p.last_name, '') ILIKE ('%' || v_q || '%')
      OR (p.username IS NOT NULL AND lower(p.username) ILIKE ('%' || v_q_at || '%'))
      OR (v_q_uuid IS NOT NULL AND p.user_id = v_q_uuid)
    )
  ORDER BY COALESCE(p.approved_at, p.created_at) DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
END;
$$;
