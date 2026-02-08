
-- Fix search path on validate_presence_status (already set but re-applying to satisfy linter)
CREATE OR REPLACE FUNCTION public.validate_presence_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('online', 'offline') THEN
    RAISE EXCEPTION 'Invalid presence status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_ticket_priority()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.priority NOT IN ('urgente', 'moderado', 'baixo') THEN
    RAISE EXCEPTION 'Invalid priority value: %', NEW.priority;
  END IF;
  RETURN NEW;
END;
$$;
