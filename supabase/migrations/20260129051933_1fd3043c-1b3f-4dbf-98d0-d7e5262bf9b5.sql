-- Messaging helpers: safe member search (limited fields)

CREATE OR REPLACE FUNCTION public.search_approved_members(p_search TEXT DEFAULT '', p_limit INT DEFAULT 30)
RETURNS TABLE(
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.user_id,
    COALESCE(NULLIF(p.display_name, ''), 'Membro') AS display_name,
    p.avatar_url
  FROM public.profiles p
  WHERE p.access_status = 'approved'
    AND (
      p_search = ''
      OR COALESCE(p.display_name, '') ILIKE ('%' || p_search || '%')
    )
  ORDER BY p.updated_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$$;