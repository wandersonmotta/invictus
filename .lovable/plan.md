
# Implementar Historico e Relatorios do Painel Financeiro

## Contexto

As paginas "Historico" e "Relatorios" do painel financeiro estao com placeholders "Em breve". Todos os dados necessarios ja existem no banco: `withdrawal_requests`, `withdrawal_audits` e `wallet_transactions`. Vamos construir as duas paginas com dados reais.

---

## 1. Historico de Auditorias

Exibira a lista completa de saques ja processados (aprovados e recusados), com filtros e detalhes.

**Dados**: Consulta direta na tabela `withdrawal_requests` filtrando `status IN ('approved', 'rejected')`, com JOIN no `profiles` para exibir nome/avatar do membro. A RLS ja permite leitura para usuarios com role `financeiro` via `is_financeiro()`.

**Funcionalidades**:
- Lista de saques processados com avatar, nome, username, valor bruto/liquido, status (Aprovado/Recusado), data de revisao
- Filtro por status: Todos / Aprovados / Recusados
- Cada card clicavel, levando ao detalhe da auditoria (`AuditoriaDetalhe`)
- Badge de cor por status (verde = aprovado, vermelho = recusado)
- Motivo da recusa visivel inline para saques rejeitados
- Botao de atualizar
- Estado vazio quando nao ha registros

---

## 2. Relatorios Financeiros

Dashboard com KPIs e resumo das movimentacoes financeiras.

**Dados**: Consultas agregadas em `withdrawal_requests` e `wallet_transactions`.

**Funcionalidades**:
- KPIs no topo:
  - Total de saques aprovados (soma de `gross_amount` onde `status = 'approved'`)
  - Total de taxas arrecadadas (soma de `fee_amount` onde `status = 'approved'`)
  - Total de saques recusados (contagem)
  - Saques pendentes (contagem e valor total)
- Tabela recente com os ultimos 20 saques processados (todas as statuses)
- Botao de atualizar

---

## Detalhes Tecnicos

### Arquivo: `src/pages/financeiro/FinanceiroHistorico.tsx`
- Substituir placeholder por componente funcional
- Usar `supabase.from("withdrawal_requests").select("*, profiles!inner(display_name, username, avatar_url)").in("status", ["approved", "rejected"]).order("reviewed_at", { ascending: false })` para buscar dados
- Filtros com botoes toggle (Todos / Aprovados / Recusados)
- Reutilizar padroes visuais do `FinanceiroDashboard` (Avatar, Badge, Card, etc.)
- Navegacao para detalhe usando o mesmo `auditPath` pattern

### Arquivo: `src/pages/financeiro/FinanceiroRelatorios.tsx`
- Substituir placeholder por dashboard com KPIs
- Consultas agregadas: uma para `withdrawal_requests` (todos os status), outra para totais
- 4 cards de KPI no topo com icones e valores formatados
- Tabela dos ultimos saques com colunas: Membro, Valor Bruto, Liquido, Status, Data
- Usar `formatCurrency` consistente com o resto do painel

### Nenhuma migracao necessaria
Todas as tabelas e politicas RLS ja existem e permitem leitura para `is_financeiro()`.
