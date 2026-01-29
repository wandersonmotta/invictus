-- Live (opt-in) approximate location sharing for "Perto de mim" (retry with correct is_mutual_follow signature)

-- 1) Table to store temporary, approximate device locations
CREATE TABLE IF NOT EXISTS public.member_live_locations (
  user_id UUID NOT NULL PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  approx_decimals SMALLINT NOT NULL DEFAULT 2,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.member_live_locations ENABLE ROW LEVEL SECURITY;

-- Only the owner can write their own live location row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'member_live_locations' AND policyname = 'Users can upsert their own live location'
  ) THEN
    CREATE POLICY "Users can upsert their own live location"
    ON public.member_live_locations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'member_live_locations' AND policyname = 'Users can update their own live location'
  ) THEN
    CREATE POLICY "Users can update their own live location"
    ON public.member_live_locations
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'member_live_locations' AND policyname = 'Users can delete their own live location'
  ) THEN
    CREATE POLICY "Users can delete their own live location"
    ON public.member_live_locations
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END$$;

-- No SELECT policy on purpose: read access only via RPC below.

-- 2) Generic updated_at trigger helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_member_live_locations_updated_at'
  ) THEN
    CREATE TRIGGER update_member_live_locations_updated_at
    BEFORE UPDATE ON public.member_live_locations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- 3) Lightweight haversine distance in KM
CREATE OR REPLACE FUNCTION public.haversine_km(lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION, lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION)
RETURNS DOUBLE PRECISION
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 6371 * 2 * asin(
    sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lon2 - lon1) / 2), 2)
    )
  );
$$;

-- 4) Upsert the caller's approximate live location (expires by default in 5 minutes)
CREATE OR REPLACE FUNCTION public.upsert_my_live_location(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_approx_decimals SMALLINT DEFAULT 2,
  p_expires_in_seconds INTEGER DEFAULT 300
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Only approved members can share
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = v_user_id AND p.access_status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Not approved';
  END IF;

  v_expires_at := now() + make_interval(secs => GREATEST(30, LEAST(3600, p_expires_in_seconds)));

  INSERT INTO public.member_live_locations (user_id, lat, lng, approx_decimals, expires_at)
  VALUES (v_user_id, p_lat, p_lng, COALESCE(p_approx_decimals, 2), v_expires_at)
  ON CONFLICT (user_id)
  DO UPDATE SET
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    approx_decimals = EXCLUDED.approx_decimals,
    expires_at = EXCLUDED.expires_at,
    updated_at = now();

  RETURN TRUE;
END;
$$;

-- 5) Return nearby pins based on live location, respecting profile_visibility
CREATE OR REPLACE FUNCTION public.get_nearby_member_pins(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION,
  p_limit INTEGER DEFAULT 200
)
RETURNS TABLE (
  user_id UUID,
  city TEXT,
  state TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  avatar_url TEXT,
  display_name TEXT,
  distance_km DOUBLE PRECISION
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT auth.uid() AS uid
  ),
  visible_profiles AS (
    SELECT p.user_id, p.city, p.state, p.avatar_url, p.display_name, p.profile_visibility
    FROM public.profiles p
    CROSS JOIN me
    WHERE p.access_status = 'approved'
      AND (
        p.profile_visibility = 'members'
        OR (p.profile_visibility = 'mutuals' AND public.is_mutual_follow(me.uid, p.user_id))
        OR (p.profile_visibility = 'private' AND p.user_id = me.uid)
      )
  )
  SELECT
    v.user_id,
    v.city,
    v.state,
    l.lat,
    l.lng,
    v.avatar_url,
    v.display_name,
    public.haversine_km(p_lat, p_lng, l.lat, l.lng) AS distance_km
  FROM public.member_live_locations l
  JOIN visible_profiles v ON v.user_id = l.user_id
  CROSS JOIN me
  WHERE l.expires_at > now()
    AND public.haversine_km(p_lat, p_lng, l.lat, l.lng) <= GREATEST(1, p_radius_km)
  ORDER BY distance_km ASC
  LIMIT LEAST(1000, GREATEST(1, p_limit));
$$;