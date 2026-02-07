
-- Create service_payments table
CREATE TABLE public.service_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_type text NOT NULL DEFAULT 'limpa_nome',
  status text NOT NULL DEFAULT 'pending',
  amount_cents integer NOT NULL DEFAULT 0,
  item_count integer NOT NULL DEFAULT 0,
  items_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  payment_provider text NOT NULL DEFAULT 'stripe',
  payment_external_id text,
  pix_qr_code_url text,
  pix_code text,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_payments ENABLE ROW LEVEL SECURITY;

-- Users can view own payments
CREATE POLICY "Users can view own payments"
ON public.service_payments
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert own payments
CREATE POLICY "Users can insert own payments"
ON public.service_payments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own payments (status and paid_at only, enforced at app level)
CREATE POLICY "Users can update own payments"
ON public.service_payments
FOR UPDATE
USING (auth.uid() = user_id);
