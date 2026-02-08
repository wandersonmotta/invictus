
-- 1. RLS policy: financeiro can view all service_payments
CREATE POLICY "Financeiro can view all payments"
  ON public.service_payments FOR SELECT
  USING (is_financeiro());

-- 2. Enable Realtime on service_payments
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_payments;

-- 3. RPC to list all payments with profile info
CREATE OR REPLACE FUNCTION public.list_all_service_payments(p_limit int DEFAULT 100)
RETURNS TABLE (
  payment_id uuid,
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  service_type text,
  status text,
  amount_cents int,
  item_count int,
  payment_provider text,
  created_at timestamptz,
  paid_at timestamptz,
  expires_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    sp.id, sp.user_id,
    p.display_name, p.username, p.avatar_url,
    sp.service_type, sp.status, sp.amount_cents, sp.item_count,
    sp.payment_provider, sp.created_at, sp.paid_at, sp.expires_at
  FROM service_payments sp
  LEFT JOIN profiles p ON p.user_id = sp.user_id
  ORDER BY sp.created_at DESC
  LIMIT p_limit;
$$;
