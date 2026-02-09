-- ========================================
-- RESTAURAÇÃO DE DADOS: SERVIÇOS
-- ========================================
-- Data: 2026-02-09
-- Objetivo: Popular tabelas de serviços com dados iniciais
-- Inclui: Limpa Nome e outros serviços da Invictus

-- 1. Categorias de Serviços
-- ========================================

INSERT INTO public.service_categories (id, name, description, icon_name, sort_order, active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 
   'Regularização Financeira', 
   'Serviços de regularização e limpeza de nome', 
   'DollarSign', 
   1, 
   true),
  ('22222222-2222-2222-2222-222222222222', 
   'Consultoria', 
   'Consultoria especializada para membros', 
   'Briefcase', 
   2, 
   true),
  ('33333333-3333-3333-3333-333333333333', 
   'Benefícios Exclusivos', 
   'Benefícios e vantagens para membros Invictus', 
   'Star', 
   3, 
   true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

-- 2. Itens de Serviço
-- ========================================

-- 2.1 LIMPA NOME (Serviço Principal)
INSERT INTO public.service_items (
  id,
  category_id, 
  name, 
  description, 
  price, 
  price_label, 
  image_url, 
  contact_info, 
  active, 
  sort_order,
  icon_name
)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '11111111-1111-1111-1111-111111111111',
   'Limpa Nome',
   'Serviço completo de regularização financeira e limpeza de nome. Negociação de dívidas, remoção de restrições e recuperação do CPF.',
   NULL,
   'Sob consulta',
   NULL,
   'suporte@invictusfraternidade.com.br',
   true,
   1,
   'FileText'),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '11111111-1111-1111-1111-111111111111',
   'Negociação de Dívidas',
   'Assessoria especializada para negociação de dívidas bancárias, cartões de crédito e financiamentos.',
   NULL,
   'A partir de R$ 500',
   NULL,
   'suporte@invictusfraternidade.com.br',
   true,
   2,
   'CreditCard'),

  ('cccccccc-cccc-cccc-cccc-cccccccccccc',
   '22222222-2222-2222-2222-222222222222',
   'Consultoria Financeira',
   'Planejamento financeiro pessoal, análise de investimentos e orientação para crescimento patrimonial.',
   NULL,
   'R$ 1.000/sessão',
   NULL,
   'consultoria@invictusfraternidade.com.br',
   true,
   1,
   'TrendingUp'),

  ('dddddddd-dddd-dddd-dddd-dddddddddddd',
   '22222222-2222-2222-2222-222222222222',
   'Mentoria de Negócios',
   'Mentoria individualizada para empreendedores. Estratégia, gestão e crescimento de negócios.',
   NULL,
   'R$ 2.500/mês',
   NULL,
   'consultoria@invictusfraternidade.com.br',
   true,
   2,
   'Users'),

  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
   '33333333-3333-3333-3333-333333333333',
   'Acesso Exclusivo - Eventos',
   'Acesso prioritário a eventos, workshops e encontros da fraternidade.',
   NULL,
   'Exclusivo para membros',
   NULL,
   'eventos@invictusfraternidade.com.br',
   true,
   1,
   'Calendar'),

  ('ffffffff-ffff-ffff-ffff-ffffffffffff',
   '33333333-3333-3333-3333-333333333333',
   'Rede de Contatos VIP',
   'Acesso à rede exclusiva de contatos, parceiros e oportunidades de negócios.',
   NULL,
   'Exclusivo para membros',
   NULL,
   'networking@invictusfraternidade.com.br',
   true,
   2,
   'Network')

ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  price_label = EXCLUDED.price_label,
  image_url = EXCLUDED.image_url,
  contact_info = EXCLUDED.contact_info,
  active = EXCLUDED.active,
  sort_order = EXCLUDED.sort_order,
  icon_name = EXCLUDED.icon_name;

-- 3. Verificação Final
-- ========================================

SELECT 
  'service_categories' as tabela,
  COUNT(*) as total_registros
FROM public.service_categories
UNION ALL
SELECT 
  'service_items' as tabela,
  COUNT(*) as total_registros
FROM public.service_items
ORDER BY tabela;

-- Listar serviços criados
SELECT 
  sc.name as categoria,
  si.name as servico,
  si.price_label as preco,
  si.active as ativo
FROM public.service_items si
JOIN public.service_categories sc ON sc.id = si.category_id
ORDER BY sc.sort_order, si.sort_order;
