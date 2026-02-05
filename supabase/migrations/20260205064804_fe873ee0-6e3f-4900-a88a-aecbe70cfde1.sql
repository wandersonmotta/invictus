
-- =============================================
-- MIGRAÇÃO PARTE 1: ADICIONAR ROLE FINANCEIRO
-- =============================================
-- Esta migração adiciona apenas o novo valor ao enum.
-- As funções que usam este valor serão criadas na próxima migração.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'financeiro';
