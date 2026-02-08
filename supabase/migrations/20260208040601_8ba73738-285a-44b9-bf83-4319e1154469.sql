
-- 1. Create support_ticket_status enum
CREATE TYPE public.support_ticket_status AS ENUM ('open', 'ai_handling', 'escalated', 'assigned', 'resolved');

-- 2. Create support_sender_type enum
CREATE TYPE public.support_sender_type AS ENUM ('user', 'ai', 'agent');

-- 3. Create support_tickets table
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text,
  status support_ticket_status NOT NULL DEFAULT 'ai_handling',
  assigned_to uuid,
  escalated_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Suporte can view escalated tickets"
  ON public.support_tickets FOR SELECT
  USING (has_role(auth.uid(), 'suporte'::app_role) AND status IN ('escalated', 'assigned', 'resolved'));

CREATE POLICY "Suporte can update tickets"
  ON public.support_tickets FOR UPDATE
  USING (has_role(auth.uid(), 'suporte'::app_role));

CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all tickets"
  ON public.support_tickets FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "No delete tickets"
  ON public.support_tickets FOR DELETE
  USING (false);

-- 4. Create support_messages table
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type support_sender_type NOT NULL,
  sender_id uuid,
  body text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ticket messages"
  ON public.support_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_messages.ticket_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can send messages on own tickets"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    sender_type = 'user' AND
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Suporte can view ticket messages"
  ON public.support_messages FOR SELECT
  USING (
    has_role(auth.uid(), 'suporte'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id AND t.status IN ('escalated', 'assigned', 'resolved')
    )
  );

CREATE POLICY "Suporte can send agent messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'suporte'::app_role) AND
    sender_type = 'agent' AND
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id AND t.status IN ('escalated', 'assigned')
    )
  );

CREATE POLICY "Admins can view all messages"
  ON public.support_messages FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "No update messages"
  ON public.support_messages FOR UPDATE USING (false);

CREATE POLICY "No delete messages"
  ON public.support_messages FOR DELETE USING (false);

-- 5. Create support_message_attachments table
CREATE TABLE public.support_message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.support_messages(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'support-attachments',
  content_type text,
  file_name text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_message_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attachments"
  ON public.support_message_attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.support_messages m
    JOIN public.support_tickets t ON t.id = m.ticket_id
    WHERE m.id = support_message_attachments.message_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can add own attachments"
  ON public.support_message_attachments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_messages m
    WHERE m.id = support_message_attachments.message_id AND m.sender_id = auth.uid()
  ));

CREATE POLICY "Suporte can view attachments"
  ON public.support_message_attachments FOR SELECT
  USING (
    has_role(auth.uid(), 'suporte'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.support_messages m
      JOIN public.support_tickets t ON t.id = m.ticket_id
      WHERE m.id = support_message_attachments.message_id AND t.status IN ('escalated', 'assigned', 'resolved')
    )
  );

CREATE POLICY "Suporte can add attachments"
  ON public.support_message_attachments FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'suporte'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.support_messages m
      WHERE m.id = support_message_attachments.message_id AND m.sender_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all attachments"
  ON public.support_message_attachments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "No update attachments"
  ON public.support_message_attachments FOR UPDATE USING (false);

CREATE POLICY "No delete attachments"
  ON public.support_message_attachments FOR DELETE USING (false);

-- 6. Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('support-attachments', 'support-attachments', true);

CREATE POLICY "Authenticated users can upload support attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'support-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view support attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'support-attachments');

-- 7. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

-- 8. Updated_at trigger
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Helper function
CREATE OR REPLACE FUNCTION public.is_suporte()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'suporte'
  )
$$;
