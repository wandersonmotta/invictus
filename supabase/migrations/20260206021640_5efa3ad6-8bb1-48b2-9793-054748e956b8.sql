
CREATE OR REPLACE FUNCTION public.grant_recognition_points(p_user_id uuid, p_level_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points integer;
BEGIN
  -- Only admins can call this
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Map level to points
  v_points := CASE p_level_id
    WHEN 'invictus' THEN 50
    WHEN 'bronze'   THEN 100
    WHEN 'silver'   THEN 500
    WHEN 'gold'     THEN 1000
    WHEN 'black'    THEN 2500
    WHEN 'elite'    THEN 5000
    WHEN 'diamond'  THEN 12000
    ELSE NULL
  END;

  IF v_points IS NULL THEN
    RAISE EXCEPTION 'Unknown level: %', p_level_id;
  END IF;

  INSERT INTO point_balances (user_id, balance, updated_at)
  VALUES (p_user_id, v_points, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = point_balances.balance + v_points,
    updated_at = now();
END;
$$;
