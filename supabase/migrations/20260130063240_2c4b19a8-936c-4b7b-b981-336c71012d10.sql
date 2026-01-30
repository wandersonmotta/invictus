-- 1) Audit log for admin reads
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID NULL
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can read audit logs"
ON public.admin_audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- No direct writes/changes to logs
DROP POLICY IF EXISTS "No insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "No insert audit logs"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "No update audit logs" ON public.admin_audit_logs;
CREATE POLICY "No update audit logs"
ON public.admin_audit_logs
FOR UPDATE
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "No delete audit logs" ON public.admin_audit_logs;
CREATE POLICY "No delete audit logs"
ON public.admin_audit_logs
FOR DELETE
USING (false);

-- 2) Security definer helper to insert audit logs
CREATE OR REPLACE FUNCTION public.admin_log(p_action TEXT, p_target_user_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'not an admin';
  END IF;

  INSERT INTO public.admin_audit_logs (admin_user_id, action, target_user_id)
  VALUES (auth.uid(), p_action, p_target_user_id);
END;
$$;

-- 3) Admin-only listing for pending approvals (limited fields)
CREATE OR REPLACE FUNCTION public.admin_list_pending_profiles(p_limit INT DEFAULT 200)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name TEXT,
  created_at TIMESTAMPTZ,
  access_status public.access_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.user_id, p.display_name, p.created_at, p.access_status
  FROM public.profiles p
  WHERE p.access_status = 'pending'::public.access_status
  ORDER BY p.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 500);
$$;

-- Log each list call (wrap sql function with plpgsql so we can write)
CREATE OR REPLACE FUNCTION public.admin_list_pending_profiles_logged(p_limit INT DEFAULT 200)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name TEXT,
  created_at TIMESTAMPTZ,
  access_status public.access_status
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_log('list_pending_profiles', NULL);
  RETURN QUERY
  SELECT * FROM public.admin_list_pending_profiles(p_limit);
END;
$$;

-- 4) Remove broad admin SELECT access from profiles table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Admins can view all profiles'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can view all profiles" ON public.profiles';
  END IF;
END$$;

-- Note: keep existing UPDATE policy for admins (needed for approvals).