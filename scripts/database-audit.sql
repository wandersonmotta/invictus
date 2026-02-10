-- ========================================
-- AUDITORIA FORENSE DO BANCO DE DADOS
-- Data: 2026-02-09
-- Objetivo: Identificar dados perdidos
-- ========================================

-- FASE 1: INVENTÁRIO COMPLETO DE TABELAS
-- ========================================

-- 1.1 Listar TODAS as tabelas do schema public
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 1.2 Contagem de registros em CADA tabela (crítico!)
DO $$
DECLARE
  r RECORD;
  row_count INTEGER;
BEGIN
  FOR r IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM public.%I', r.table_name) INTO row_count;
    RAISE NOTICE 'Tabela: % | Registros: %', r.table_name, row_count;
  END LOOP;
END $$;

-- FASE 2: INVESTIGAÇÃO DE DADOS ESPECÍFICOS
-- ========================================

-- 2.1 SERVIÇOS - Verificar tabela de serviços
-- (Procurar por qualquer tabela que possa conter serviços)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%service%' OR
    table_name LIKE '%servico%' OR
    table_name LIKE '%produto%' OR
    table_name LIKE '%product%' OR
    table_name LIKE '%offering%'
  );

-- 2.2 MEMBROS - Verificar usuários e profiles
SELECT 
  COUNT(*) as total_auth_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
  COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) as users_with_login
FROM auth.users;

SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN access_status = 'approved' THEN 1 END) as approved_profiles,
  COUNT(CASE WHEN access_status = 'pending' THEN 1 END) as pending_profiles,
  COUNT(CASE WHEN access_status = 'rejected' THEN 1 END) as rejected_profiles
FROM public.profiles;

-- 2.3 ROLES - Verificar administradores
SELECT 
  role,
  COUNT(*) as count
FROM public.user_roles
GROUP BY role
ORDER BY role;

-- FASE 3: ANÁLISE DE MIGRATIONS
-- ========================================

-- 3.1 Listar histórico de migrations
SELECT 
  version,
  name,
  executed_at
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 20;

-- 3.2 Procurar migrations perigosas (DROP, DELETE, TRUNCATE)
-- NOTA: Isto requer acesso aos arquivos de migration

-- FASE 4: DADOS DETALHADOS
-- ========================================

-- 4.1 Listar TODOS os usuários existentes
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  u.last_sign_in_at,
  p.display_name,
  p.access_status,
  array_agg(ur.role) as roles
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
GROUP BY u.id, u.email, u.created_at, u.email_confirmed_at, u.last_sign_in_at, p.display_name, p.access_status
ORDER BY u.created_at DESC;

-- 4.2 Verificar dados em tabelas relacionadas a serviços
-- (Executar se encontrarmos tabelas de serviços)

-- FASE 5: EXPORTAÇÃO PARA BACKUP
-- ========================================

-- 5.1 Exportar estrutura completa
-- Execute no terminal: pg_dump --schema-only > schema_backup.sql

-- 5.2 Exportar dados
-- Execute no terminal: pg_dump --data-only > data_backup.sql

-- FIM DA AUDITORIA
-- ========================================
-- PRÓXIMO PASSO: Analisar os resultados e identificar o que foi perdido
