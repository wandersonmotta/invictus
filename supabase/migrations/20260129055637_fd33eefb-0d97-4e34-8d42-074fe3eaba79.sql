-- 1) Add username/@ handle to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username text;

-- 2) Enforce username format (saved WITH @)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_username_format'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_username_format
      CHECK (
        username IS NULL
        OR username ~ '^@[a-z0-9._]{3,20}$'
      );
  END IF;
END $$;

-- 3) Unique case-insensitive username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- 4) Helpful lookup index
CREATE INDEX IF NOT EXISTS profiles_username_idx
  ON public.profiles (username);

-- 5) Update search_approved_members to also search/return username
DROP FUNCTION IF EXISTS public.search_approved_members(text, integer);

CREATE OR REPLACE FUNCTION public.search_approved_members(
  p_search text DEFAULT ''::text,
  p_limit integer DEFAULT 30
)
RETURNS TABLE(user_id uuid, display_name text, username text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH me AS (
    SELECT auth.uid() AS uid
  ), params AS (
    SELECT
      btrim(COALESCE(p_search, '')) AS q,
      CASE
        WHEN btrim(COALESCE(p_search, '')) = '' THEN ''
        WHEN left(btrim(COALESCE(p_search, '')), 1) = '@' THEN lower(btrim(COALESCE(p_search, '')))
        ELSE lower('@' || btrim(COALESCE(p_search, '')))
      END AS q_at
  )
  SELECT
    p.user_id,
    COALESCE(NULLIF(p.display_name, ''), 'Membro') AS display_name,
    p.username,
    p.avatar_url
  FROM public.profiles p
  CROSS JOIN me
  CROSS JOIN params
  WHERE me.uid IS NOT NULL
    AND p.access_status = 'approved'
    AND (
      params.q = ''
      OR COALESCE(p.display_name, '') ILIKE ('%' || params.q || '%')
      OR (p.username IS NOT NULL AND lower(p.username) ILIKE ('%' || params.q_at || '%'))
    )
  ORDER BY p.updated_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$function$;

-- 6) Exact lookup for /buscar (only by username)
DROP FUNCTION IF EXISTS public.find_approved_member_by_username(text);

CREATE OR REPLACE FUNCTION public.find_approved_member_by_username(
  p_username text
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  bio text,
  city text,
  state text,
  region text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH me AS (
    SELECT auth.uid() AS uid
  ), params AS (
    SELECT
      CASE
        WHEN p_username IS NULL THEN ''
        WHEN btrim(p_username) = '' THEN ''
        WHEN left(btrim(p_username), 1) = '@' THEN lower(btrim(p_username))
        ELSE lower('@' || btrim(p_username))
      END AS u
  )
  SELECT
    p.user_id,
    COALESCE(NULLIF(p.display_name, ''), 'Membro') AS display_name,
    p.username,
    p.avatar_url,
    p.bio,
    p.city,
    p.state,
    p.region
  FROM public.profiles p
  CROSS JOIN me
  CROSS JOIN params
  WHERE me.uid IS NOT NULL
    AND params.u <> ''
    AND p.access_status = 'approved'
    AND p.username IS NOT NULL
    AND lower(p.username) = params.u
  LIMIT 1;
$function$;