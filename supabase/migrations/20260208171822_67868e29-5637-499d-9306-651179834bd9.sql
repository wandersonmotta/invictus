-- Trigger automated deployment
-- Empty migration or comment addition
-- Add financeiro_gerente to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'financeiro_gerente';