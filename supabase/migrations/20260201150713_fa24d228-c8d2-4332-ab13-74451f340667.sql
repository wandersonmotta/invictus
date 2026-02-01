-- Root cause fix: this RPC writes to audit logs, so it cannot be STABLE (read-only transaction).
-- Keep the exact return signature/column order to avoid breaking clients.

CREATE OR REPLACE FUNCTION public.admin_log(p_action text, p_target_user_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'not an admin' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.admin_audit_logs (admin_user_id, action, target_user_id)
  VALUES (auth.uid(), p_action, p_target_user_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_list_pending_profiles_logged(p_limit integer DEFAULT 200)
RETURNS TABLE(id uuid, user_id uuid, display_name text, created_at timestamp with time zone, access_status access_status)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- This performs an INSERT (audit log) so it must be VOLATILE.
  PERFORM public.admin_log('list_pending_profiles', NULL);
  RETURN QUERY
  SELECT * FROM public.admin_list_pending_profiles(p_limit);
END;
$function$;

-- Force volatility change without modifying definition formatting differences.
ALTER FUNCTION public.admin_list_pending_profiles_logged(integer) VOLATILE;
