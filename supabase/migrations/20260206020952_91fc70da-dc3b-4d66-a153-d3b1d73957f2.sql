
-- Enum for redemption status
CREATE TYPE public.redemption_status AS ENUM ('pending', 'approved', 'rejected', 'delivered');

-- Point balances per user
CREATE TABLE public.point_balances (
  user_id uuid PRIMARY KEY NOT NULL,
  balance integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.point_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own balance" ON public.point_balances
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all balances" ON public.point_balances
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "No direct insert" ON public.point_balances
  FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct update" ON public.point_balances
  FOR UPDATE USING (false);
CREATE POLICY "No direct delete" ON public.point_balances
  FOR DELETE USING (false);

-- Rewards catalog
CREATE TABLE public.point_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  points_cost integer NOT NULL,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.point_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active rewards" ON public.point_rewards
  FOR SELECT USING (active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage rewards" ON public.point_rewards
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Redemptions history
CREATE TABLE public.point_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reward_id uuid NOT NULL REFERENCES public.point_rewards(id),
  points_spent integer NOT NULL,
  status public.redemption_status NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
ALTER TABLE public.point_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions" ON public.point_redemptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all redemptions" ON public.point_redemptions
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "No direct insert redemptions" ON public.point_redemptions
  FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct update redemptions" ON public.point_redemptions
  FOR UPDATE USING (false);
CREATE POLICY "No direct delete redemptions" ON public.point_redemptions
  FOR DELETE USING (false);

-- RPC: redeem_reward (atomic: check balance, deduct, create redemption)
CREATE OR REPLACE FUNCTION public.redeem_reward(p_reward_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_cost integer;
  v_balance integer;
  v_redemption_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get reward cost
  SELECT points_cost INTO v_cost
  FROM point_rewards
  WHERE id = p_reward_id AND active = true;

  IF v_cost IS NULL THEN
    RAISE EXCEPTION 'Reward not found or inactive';
  END IF;

  -- Get current balance
  SELECT balance INTO v_balance
  FROM point_balances
  WHERE user_id = v_user_id;

  IF v_balance IS NULL OR v_balance < v_cost THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;

  -- Deduct points
  UPDATE point_balances
  SET balance = balance - v_cost, updated_at = now()
  WHERE user_id = v_user_id;

  -- Create redemption
  INSERT INTO point_redemptions (user_id, reward_id, points_spent, status)
  VALUES (v_user_id, p_reward_id, v_cost, 'pending')
  RETURNING id INTO v_redemption_id;

  RETURN v_redemption_id;
END;
$$;

-- RPC: admin_list_redemptions
CREATE OR REPLACE FUNCTION public.admin_list_redemptions(p_limit integer DEFAULT 100)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  reward_name text,
  points_spent integer,
  status public.redemption_status,
  requested_at timestamptz,
  reviewed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    r.id, r.user_id,
    p.display_name, p.avatar_url,
    pw.name AS reward_name,
    r.points_spent, r.status, r.requested_at, r.reviewed_at
  FROM point_redemptions r
  JOIN profiles p ON p.user_id = r.user_id
  JOIN point_rewards pw ON pw.id = r.reward_id
  ORDER BY
    CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END,
    r.requested_at DESC
  LIMIT p_limit;
END;
$$;

-- RPC: admin_update_redemption_status
CREATE OR REPLACE FUNCTION public.admin_update_redemption_status(
  p_redemption_id uuid,
  p_status public.redemption_status
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_redemption record;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_redemption
  FROM point_redemptions
  WHERE id = p_redemption_id;

  IF v_redemption IS NULL THEN
    RAISE EXCEPTION 'Redemption not found';
  END IF;

  -- Update status
  UPDATE point_redemptions
  SET status = p_status, reviewed_at = now()
  WHERE id = p_redemption_id;

  -- If rejected, refund points
  IF p_status = 'rejected' THEN
    INSERT INTO point_balances (user_id, balance, updated_at)
    VALUES (v_redemption.user_id, v_redemption.points_spent, now())
    ON CONFLICT (user_id)
    DO UPDATE SET balance = point_balances.balance + v_redemption.points_spent, updated_at = now();
  END IF;

  RETURN true;
END;
$$;

-- RPC: get_my_points (simple helper)
CREATE OR REPLACE FUNCTION public.get_my_points()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT balance FROM point_balances WHERE user_id = auth.uid()), 0);
$$;
