
# Minhas Faturas -- Planos e Mensalidades

## Resumo

Criar a pagina "Minhas Faturas" (`/faturas`) com sistema completo de planos e assinaturas mensais. O primeiro plano sera o **Inicial** a **R$99,90/mes** com ciclo de 30 dias. A interface segue o estilo da referencia enviada: card de fatura com status de pagamento e vencimento, e cards de planos com lista de beneficios (icone verde = incluso, vermelho = nao incluso).

---

## O que o usuario vai ver

### 1. Card de Assinatura Atual (topo da pagina)
- Logo Invictus centralizada
- Nome do plano contratado (ex: "Plano **Inicial**")
- Status do pagamento com icone colorido:
  - Vermelho com X: "Pendente de pagamento"
  - Verde com check: "Pagamento aprovado"
- Data de vencimento formatada (dd/MM/yyyy)

### 2. Catalogo de Planos (abaixo)
- Card do plano **Inicial** com:
  - Icone/ilustracao estilizada (raio dourado no estilo Invictus)
  - Nome "Inicial" e valor "R$ 99,90"
  - Lista de beneficios com checkmarks verdes:
    - Acesso a todos os produtos e servicos da Invictus
    - Class Invictus (cursos e treinamentos)
  - Botao "Assinar" (ou "Plano Atual" se ja assinado)
- Preparado para adicionar mais planos futuramente (grid responsivo)

### 3. Historico de Faturas
- Lista das faturas anteriores com status e valores

---

## Detalhes Tecnicos

### Banco de Dados (4 tabelas novas)

**`subscription_plans`** -- Catalogo de planos
- `id` (uuid, PK)
- `name` (text) -- ex: "Inicial"
- `price_cents` (integer) -- 9990
- `interval_days` (integer, default 30)
- `active` (boolean, default true)
- `sort_order` (integer)
- `created_at` (timestamptz)

**`plan_features`** -- Beneficios de cada plano
- `id` (uuid, PK)
- `plan_id` (uuid, FK -> subscription_plans)
- `label` (text) -- ex: "Acesso a todos os produtos e servicos"
- `included` (boolean) -- true = check verde, false = X vermelho
- `sort_order` (integer)

**`member_subscriptions`** -- Assinatura ativa do membro
- `id` (uuid, PK)
- `user_id` (uuid, referencia ao perfil)
- `plan_id` (uuid, FK -> subscription_plans)
- `status` (text) -- 'active', 'cancelled', 'past_due'
- `current_period_start` (timestamptz)
- `current_period_end` (timestamptz)
- `created_at` (timestamptz)

**`subscription_invoices`** -- Faturas mensais
- `id` (uuid, PK)
- `subscription_id` (uuid, FK -> member_subscriptions)
- `user_id` (uuid)
- `amount_cents` (integer)
- `status` (text) -- 'pending', 'paid', 'overdue'
- `due_date` (date)
- `paid_at` (timestamptz, nullable)
- `created_at` (timestamptz)

**RLS**: Membros so veem seus proprios dados. Planos e features sao leitura publica (authenticated).

**Seed**: Inserir o plano "Inicial" com seus 2 beneficios iniciais.

### Arquivos Novos/Editados

1. **`src/pages/Faturas.tsx`** -- Pagina principal com:
   - Card de assinatura atual (status + vencimento)
   - Grid de planos disponiveis com features
   - Historico de faturas
   - Layout mobile-first (max-w-3xl, pb-24)
   - Header com seta de voltar (igual Carteira)

2. **`src/components/faturas/SubscriptionStatusCard.tsx`** -- Card superior com logo, plano, status e vencimento

3. **`src/components/faturas/PlanCard.tsx`** -- Card de plano com icone, preco e lista de beneficios (check verde / X vermelho)

4. **`src/components/faturas/InvoiceHistoryList.tsx`** -- Lista de faturas passadas

5. **`src/routing/HostRouter.tsx`** -- Registrar rota `/faturas` (3 blocos: lovable, app subdomain, producao)

6. **`src/components/AppSidebar.tsx`** -- Remover `placeholder: true` do item "Minhas Faturas"

### Migracao SQL

Uma unica migracao criando as 4 tabelas, policies RLS, seed do plano Inicial e seus beneficios.
