
CREATE TYPE limpa_nome_status AS ENUM ('aberto', 'em_andamento', 'finalizado');

CREATE TABLE public.limpa_nome_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  person_name text NOT NULL,
  document text,
  status limpa_nome_status NOT NULL DEFAULT 'aberto',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.limpa_nome_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests"
  ON public.limpa_nome_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests"
  ON public.limpa_nome_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all requests"
  ON public.limpa_nome_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
