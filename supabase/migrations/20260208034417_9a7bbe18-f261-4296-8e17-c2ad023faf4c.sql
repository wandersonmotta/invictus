
-- Enum for subscription status
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'past_due');

-- Enum for invoice status
CREATE TYPE public.invoice_status AS ENUM ('pending', 'paid', 'overdue');

-- ============================================================
-- 1. subscription_plans (catalog)
-- ============================================================
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_cents integer NOT NULL,
  interval_days integer NOT NULL DEFAULT 30,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (auth.uid() IS NOT NULL AND active = true);

CREATE POLICY "Admins manage plans"
  ON public.subscription_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 2. plan_features (benefits per plan)
-- ============================================================
CREATE TABLE public.plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  label text NOT NULL,
  included boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view plan features"
  ON public.plan_features FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage plan features"
  ON public.plan_features FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 3. member_subscriptions
-- ============================================================
CREATE TABLE public.member_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status public.subscription_status NOT NULL DEFAULT 'active',
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.member_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.member_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "No direct insert subscriptions"
  ON public.member_subscriptions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct update subscriptions"
  ON public.member_subscriptions FOR UPDATE
  USING (false);

CREATE POLICY "No direct delete subscriptions"
  ON public.member_subscriptions FOR DELETE
  USING (false);

CREATE POLICY "Admins manage subscriptions"
  ON public.member_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Financeiro can view all subscriptions"
  ON public.member_subscriptions FOR SELECT
  USING (is_financeiro());

-- ============================================================
-- 4. subscription_invoices
-- ============================================================
CREATE TABLE public.subscription_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.member_subscriptions(id),
  user_id uuid NOT NULL,
  amount_cents integer NOT NULL,
  status public.invoice_status NOT NULL DEFAULT 'pending',
  due_date date NOT NULL,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices"
  ON public.subscription_invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "No direct insert invoices"
  ON public.subscription_invoices FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct update invoices"
  ON public.subscription_invoices FOR UPDATE
  USING (false);

CREATE POLICY "No direct delete invoices"
  ON public.subscription_invoices FOR DELETE
  USING (false);

CREATE POLICY "Admins manage invoices"
  ON public.subscription_invoices FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Financeiro can view all invoices"
  ON public.subscription_invoices FOR SELECT
  USING (is_financeiro());

-- ============================================================
-- SEED: Plano Inicial + features
-- ============================================================
INSERT INTO public.subscription_plans (id, name, price_cents, interval_days, sort_order)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Inicial', 9990, 30, 1);

INSERT INTO public.plan_features (plan_id, label, included, sort_order) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Acesso a todos os produtos e serviços da Invictus', true, 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Class Invictus — cursos e treinamentos', true, 2);
