
-- Restaurar Categorias e Serviços Originais
-- Baseado na solicitação do usuário: "Serviços -> Reabilitação de Crédito -> Limpa Nome"

-- 1. Limpar serviços genéricos criados anteriormente (opcional, para evitar duplicatas confusas, mas seguro manter IDs se existirem)
-- DELETE FROM service_items WHERE name = 'Limpa Nome';
-- DELETE FROM service_categories WHERE name = 'Reabilitação de Crédito';

-- 2. Garantir Categoria "Reabilitação de Crédito"
INSERT INTO service_categories (id, name, description, icon_name, sort_order)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- ID fixo para referência
  'Reabilitação de Crédito',
  'Soluções para regularizar sua situação financeira',
  'CreditCard',
  1
)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;

-- 3. Inserir Serviço "Limpa Nome"
INSERT INTO service_items (id, category_id, name, description, price, price_label, image_url, contact_info, icon_name, sort_order)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Limpa Nome',
  'Serviço completo de reabilitação de crédito e limpeza de restrições.',
  0,
  'Sob Consulta',
  NULL,
  'Entre em contato pelo WhatsApp',
  'ShieldCheck',
  1
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id;
