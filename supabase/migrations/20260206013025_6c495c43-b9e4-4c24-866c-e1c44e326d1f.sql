CREATE OR REPLACE FUNCTION public.list_processed_withdrawals(p_limit int DEFAULT 200)
RETURNS TABLE (
  withdrawal_id uuid,
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  gross_amount numeric,
  fee_amount numeric,
  net_amount numeric,
  pix_key text,
  status text,
  requested_at timestamptz,
  reviewed_at timestamptz,
  rejection_reason text,
  reviewer_display_name text,
  reviewer_username text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    wr.id,
    wr.user_id,
    p.display_name,
    p.username,
    p.avatar_url,
    wr.gross_amount,
    wr.fee_amount,
    wr.net_amount,
    wr.pix_key,
    wr.status::text,
    wr.requested_at,
    wr.reviewed_at,
    wr.rejection_reason,
    rp.display_name,
    rp.username
  FROM withdrawal_requests wr
  JOIN profiles p ON p.user_id = wr.user_id
  LEFT JOIN profiles rp ON rp.user_id = wr.reviewed_by
  WHERE wr.status IN ('approved', 'rejected')
    AND is_financeiro()
  ORDER BY wr.reviewed_at DESC NULLS LAST
  LIMIT p_limit;
$$;