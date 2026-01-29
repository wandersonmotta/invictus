-- Restrict what approved users can see about other members.
-- We remove the broad SELECT policy on public.profiles and expose a safe, field-limited API via a SECURITY DEFINER function.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Authenticated can view approved profiles'
  ) THEN
    EXECUTE 'DROP POLICY "Authenticated can view approved profiles" ON public.profiles';
  END IF;
END $$;

-- Public, safe profile projection for approved members
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
SET search_path = public
AS $$
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
  LIMIT 1;
$$;
