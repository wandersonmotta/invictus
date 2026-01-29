-- 1) Extend profiles for CEP-based location
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS location_lat double precision,
  ADD COLUMN IF NOT EXISTS location_lng double precision,
  ADD COLUMN IF NOT EXISTS location_updated_at timestamp with time zone;

-- 2) Cache table for city geocoding
CREATE TABLE IF NOT EXISTS public.geo_city_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  city text NOT NULL,
  state text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  source text NOT NULL DEFAULT 'nominatim',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.geo_city_cache ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'geo_city_cache'
      AND policyname = 'No direct access to geo_city_cache'
  ) THEN
    CREATE POLICY "No direct access to geo_city_cache"
      ON public.geo_city_cache
      FOR ALL
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_geo_city_cache_updated_at'
  ) THEN
    CREATE TRIGGER update_geo_city_cache_updated_at
    BEFORE UPDATE ON public.geo_city_cache
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) RPC for map pins (approved only) with deterministic jitter
CREATE OR REPLACE FUNCTION public.get_approved_member_pins(
  p_limit integer DEFAULT 5000
)
RETURNS TABLE (
  user_id uuid,
  city text,
  state text,
  lat double precision,
  lng double precision
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT auth.uid() AS uid
  ), base AS (
    SELECT
      p.user_id,
      p.city,
      p.state,
      p.location_lat,
      p.location_lng,
      md5(p.user_id::text || 'invictus') AS h
    FROM public.profiles p, me
    WHERE me.uid IS NOT NULL
      AND p.access_status = 'approved'
      AND p.location_lat IS NOT NULL
      AND p.location_lng IS NOT NULL
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
    (j.location_lng + (j.amp * sin(j.theta))) AS lng
  FROM jitter j;
$$;

GRANT EXECUTE ON FUNCTION public.get_approved_member_pins(integer) TO authenticated;