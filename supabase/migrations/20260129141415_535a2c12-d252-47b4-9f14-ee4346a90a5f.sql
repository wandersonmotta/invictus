-- Allow authenticated users to view other approved members' profiles (RLS)
-- WARNING: This makes ALL columns in public.profiles readable for approved rows.
-- If you need field-level privacy, keep this policy OFF and use a view/RPC that returns only safe fields.

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

CREATE POLICY "Authenticated can view approved member profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  access_status = 'approved'::access_status
);
