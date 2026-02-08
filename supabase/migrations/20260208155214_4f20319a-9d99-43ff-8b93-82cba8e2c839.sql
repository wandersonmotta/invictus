
-- Add auto_assigned status
ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'auto_assigned';

-- Add priority column to support_tickets
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'baixo';

-- Add check constraint via trigger (immutable-safe)
CREATE OR REPLACE FUNCTION public.validate_ticket_priority()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.priority NOT IN ('urgente', 'moderado', 'baixo') THEN
    RAISE EXCEPTION 'Invalid priority value: %', NEW.priority;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_ticket_priority
  BEFORE INSERT OR UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ticket_priority();

-- Agent presence table
CREATE TABLE public.support_agent_presence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'online',
  last_heartbeat timestamptz NOT NULL DEFAULT now(),
  active_ticket_count int NOT NULL DEFAULT 0
);

-- Validate presence status via trigger
CREATE OR REPLACE FUNCTION public.validate_presence_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('online', 'offline') THEN
    RAISE EXCEPTION 'Invalid presence status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_presence_status
  BEFORE INSERT OR UPDATE ON public.support_agent_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_presence_status();

ALTER TABLE public.support_agent_presence ENABLE ROW LEVEL SECURITY;

-- Suporte and admin can view presence
CREATE POLICY "Suporte can view presence"
  ON public.support_agent_presence FOR SELECT
  USING (
    has_role(auth.uid(), 'suporte'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'suporte_gerente'::app_role)
  );

-- Agents can manage own presence
CREATE POLICY "Agents can upsert own presence"
  ON public.support_agent_presence FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_agent_presence;
