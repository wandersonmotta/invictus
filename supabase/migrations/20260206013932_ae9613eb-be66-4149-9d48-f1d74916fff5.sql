
CREATE OR REPLACE FUNCTION public.list_all_member_balances()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  balance numeric,
  last_credit_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    wt.user_id,
    p.display_name,
    p.username,
    p.avatar_url,
    SUM(CASE WHEN wt.type = 'credit' THEN wt.amount ELSE -wt.amount END) AS balance,
    MAX(CASE WHEN wt.type = 'credit' THEN wt.created_at END) AS last_credit_at
  FROM wallet_transactions wt
  JOIN profiles p ON p.user_id = wt.user_id
  WHERE is_financeiro()
  GROUP BY wt.user_id, p.display_name, p.username, p.avatar_url
  HAVING SUM(CASE WHEN wt.type = 'credit' THEN wt.amount ELSE -wt.amount END) > 0
  ORDER BY balance DESC;
$$;
