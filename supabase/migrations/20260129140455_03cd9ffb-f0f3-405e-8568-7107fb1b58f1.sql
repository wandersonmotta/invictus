-- Allow authenticated users to view profiles of approved members
-- NOTE: This exposes all columns in public.profiles for approved users.
-- If you need to hide sensitive fields later, move them to a private table or expose via a security-invoker view.

DO $$
BEGIN
  -- Drop policy if it exists (idempotent migration)
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

CREATE POLICY "Authenticated can view approved profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  access_status = 'approved'::access_status
);
