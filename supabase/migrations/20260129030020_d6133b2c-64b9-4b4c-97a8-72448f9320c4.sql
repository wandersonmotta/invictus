-- ERROR previously: cannot change return type of existing function. We must drop + recreate.
DROP FUNCTION IF EXISTS public.get_approved_member_pins(integer);

CREATE FUNCTION public.get_approved_member_pins(p_limit integer DEFAULT 5000)
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
