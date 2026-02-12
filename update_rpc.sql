
-- Modificando o RPC para permitir que ADMINS apareçam na lista de membros mesmo que tenham roles de staff
CREATE OR REPLACE FUNCTION public.admin_search_members(p_search text DEFAULT '', p_limit integer DEFAULT 50)
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
      -- Se for admin, ignora o filtro de staff
      public.has_role(p.user_id, 'admin'::public.app_role)
      OR
      NOT EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = p.user_id
          AND ur.role IN ('financeiro', 'suporte')
      )
    )
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
