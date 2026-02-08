
-- Add AI summary column to support_tickets
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS ai_summary text;

-- Create ratings table
CREATE TABLE public.support_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL UNIQUE REFERENCES public.support_tickets(id),
  user_id uuid NOT NULL,
  agent_id uuid,
  rating_resolved smallint NOT NULL,
  rating_agent smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own rating"
  ON public.support_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own rating"
  ON public.support_ratings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all ratings"
  ON public.support_ratings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "No update ratings"
  ON public.support_ratings FOR UPDATE USING (false);

CREATE POLICY "No delete ratings"
  ON public.support_ratings FOR DELETE USING (false);
