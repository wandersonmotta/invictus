-- Add profile privacy levels and enforce them via secure RPCs

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_visibility') THEN
    CREATE TYPE public.profile_visibility AS ENUM ('members', 'mutuals', 'private');
  END IF;
END $$;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_visibility public.profile_visibility NOT NULL DEFAULT 'members';

-- Backfill any NULLs (defensive)
UPDATE public.profiles
SET profile_visibility = 'members'
WHERE profile_visibility IS NULL;

-- IMPORTANT: Remove broad read policy to prevent leaking non-public columns.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Authenticated can view approved member profiles'
  ) THEN
    EXECUTE 'DROP POLICY "Authenticated can view approved member profiles" ON public.profiles';
  END IF;
END $$;

-- Update RPCs to respect profile_visibility

CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  first_name text,
  last_name text,
  display_name text,
  username text,
  avatar_url text,
  bio text,
  city text,
  state text,
  expertises text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH me AS (
    SELECT auth.uid() AS uid
  )
  SELECT
    p.user_id,
    p.first_name,
    p.last_name,
    p.display_name,
    p.username,
    p.avatar_url,
    p.bio,
    p.city,
    p.state,
    p.expertises
  FROM public.profiles p
  CROSS JOIN me
  WHERE me.uid IS NOT NULL
    AND p.user_id = p_user_id
    AND p.access_status = 'approved'::access_status
    AND (
      -- Always allow self and admins
      me.uid = p.user_id
      OR public.has_role(me.uid, 'admin'::app_role)
      -- Otherwise respect visibility
      OR (
        p.profile_visibility = 'members'::profile_visibility
        OR (p.profile_visibility = 'mutuals'::profile_visibility AND public.is_mutual_follow(me.uid, p.user_id))
      )
    )
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.search_approved_members(p_search text DEFAULT ''::text, p_limit integer DEFAULT 30)
RETURNS TABLE(user_id uuid, display_name text, username text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
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
      me.uid = p.user_id
      OR public.has_role(me.uid, 'admin'::app_role)
      OR (
        p.profile_visibility = 'members'::profile_visibility
        OR (p.profile_visibility = 'mutuals'::profile_visibility AND public.is_mutual_follow(me.uid, p.user_id))
      )
    )
    AND (
      params.q = ''
      OR COALESCE(p.display_name, '') ILIKE ('%' || params.q || '%')
      OR (p.username IS NOT NULL AND lower(p.username) ILIKE ('%' || params.q_at || '%'))
    )
  ORDER BY p.updated_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$function$;

CREATE OR REPLACE FUNCTION public.find_approved_member_by_username(p_username text)
RETURNS TABLE(user_id uuid, display_name text, username text, avatar_url text, bio text, city text, state text, region text)
LANGUAGE sql
STABLE
SECURITY DEFINER
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
    AND (
      me.uid = p.user_id
      OR public.has_role(me.uid, 'admin'::app_role)
      OR (
        p.profile_visibility = 'members'::profile_visibility
        OR (p.profile_visibility = 'mutuals'::profile_visibility AND public.is_mutual_follow(me.uid, p.user_id))
      )
    )
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_approved_member_pins(p_limit integer DEFAULT 5000)
RETURNS TABLE(user_id uuid, city text, state text, lat double precision, lng double precision, avatar_url text, display_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH me AS (
    SELECT auth.uid() AS uid
  ), base AS (
    SELECT
      p.user_id,
      p.city,
      p.state,
      p.display_name,
      p.avatar_url,
      p.location_lat,
      p.location_lng,
      md5(p.user_id::text || 'invictus') AS h
    FROM public.profiles p, me
    WHERE me.uid IS NOT NULL
      AND p.access_status = 'approved'
      AND (
        me.uid = p.user_id
        OR public.has_role(me.uid, 'admin'::app_role)
        OR (
          p.profile_visibility = 'members'::profile_visibility
          OR (p.profile_visibility = 'mutuals'::profile_visibility AND public.is_mutual_follow(me.uid, p.user_id))
        )
      )
      AND p.location_lat IS NOT NULL
      AND p.location_lng IS NOT NULL
      AND p.avatar_url IS NOT NULL
    ORDER BY p.updated_at DESC
    LIMIT LEAST(GREATEST(p_limit, 1), 5000)
  ), seeds AS (
    SELECT
      b.*,
      (('x' || substr(b.h, 1, 8))::bit(32))::int AS s1,
      (('x' || substr(b.h, 9, 8))::bit(32))::int AS s2
    FROM base b
  ), jitter AS (
    SELECT
      s.user_id,
      s.city,
      s.state,
      s.display_name,
      s.avatar_url,
      s.location_lat,
      s.location_lng,
      (0.005 + ((abs(s.s1) % 1000) / 999.0) * 0.015) AS amp,
      ((abs(s.s2) % 6283) / 1000.0) AS theta
    FROM seeds s
  )
  SELECT
    j.user_id,
    j.city,
    j.state,
    (j.location_lat + (j.amp * cos(j.theta))) AS lat,
    (j.location_lng + (j.amp * sin(j.theta))) AS lng,
    j.avatar_url,
    j.display_name
  FROM jitter j;
$function$;
