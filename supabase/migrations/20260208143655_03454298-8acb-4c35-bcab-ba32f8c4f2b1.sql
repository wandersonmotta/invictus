
CREATE TABLE public.ai_training_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'geral',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.ai_training_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage training entries"
  ON public.ai_training_entries FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_ai_training_entries_updated_at
  BEFORE UPDATE ON public.ai_training_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
