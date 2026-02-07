
ALTER TABLE public.limpa_nome_requests
  ADD COLUMN whatsapp text;

CREATE TABLE public.limpa_nome_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.limpa_nome_requests(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  storage_path text NOT NULL,
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.limpa_nome_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own docs"
  ON public.limpa_nome_documents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM limpa_nome_requests r
    WHERE r.id = request_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own docs"
  ON public.limpa_nome_documents FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM limpa_nome_requests r
    WHERE r.id = request_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Admins manage all docs"
  ON public.limpa_nome_documents FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO storage.buckets (id, name, public)
VALUES ('limpa-nome-docs', 'limpa-nome-docs', false);

CREATE POLICY "Users upload own docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'limpa-nome-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'limpa-nome-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
