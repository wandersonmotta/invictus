
# Carteira de Bonus -- Visao Consolidada para o Financeiro

## Objetivo

Criar uma nova pagina "Carteira" no painel financeiro que exibe o total de bonus disponivel de todos os membros, permitindo que a equipe financeira saiba exatamente quanto dinheiro precisa estar em caixa para cobrir possiveis saques.

---

## O que sera construido

### Nova pagina: Carteira de Bonus

Uma pagina com:

1. **Card principal** -- Total consolidado de bonus disponivel em toda a plataforma (soma dos saldos de todos os membros)
2. **Lista de membros** -- Tabela com cada membro que possui saldo, mostrando:
   - Avatar, nome, username
   - Saldo disponivel
   - Ultimo credito recebido (data)
3. **Busca** -- Campo para filtrar membros por nome/username
4. **Ordenacao** -- Por saldo (maior primeiro, padrao) ou por nome

---

## Implementacao tecnica

### 1. Nova RPC: `list_all_member_balances`

Como nao existe FK direta entre `wallet_transactions` e `profiles`, e precisamos agregar saldos de todos os membros, vamos criar uma funcao RPC com `SECURITY DEFINER` protegida por `is_financeiro()`.

```sql
CREATE OR REPLACE FUNCTION public.list_all_member_balances()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  balance numeric,
  last_credit_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    wt.user_id,
    p.display_name,
    p.username,
    p.avatar_url,
    SUM(CASE WHEN wt.type = 'credit' THEN wt.amount ELSE -wt.amount END) AS balance,
    MAX(CASE WHEN wt.type = 'credit' THEN wt.created_at END) AS last_credit_at
  FROM wallet_transactions wt
  JOIN profiles p ON p.user_id = wt.user_id
  WHERE is_financeiro()
  GROUP BY wt.user_id, p.display_name, p.username, p.avatar_url
  HAVING SUM(CASE WHEN wt.type = 'credit' THEN wt.amount ELSE -wt.amount END) > 0
  ORDER BY balance DESC;
$$;
```

Essa funcao:
- Calcula o saldo real de cada membro (creditos - debitos)
- Filtra apenas membros com saldo positivo
- Retorna dados do perfil para exibicao
- So executa se o usuario logado tem role `financeiro`

### 2. Nova pagina: `src/pages/financeiro/FinanceiroCarteira.tsx`

- KPI card no topo com o total consolidado (soma de todos os saldos)
- Quantidade de membros com saldo
- Campo de busca para filtrar por nome/username
- Tabela com Avatar, Nome, Username, Saldo, Ultimo Credito
- Botao de atualizar
- Segue o mesmo padrao visual das paginas Historico e Relatorios

### 3. Atualizar navegacao (4 arquivos)

- **`src/components/financeiro/FinanceiroLayout.tsx`** -- Adicionar item "Carteira" na sidebar com icone `Wallet`
- **`src/components/financeiro/FinanceiroBottomNav.tsx`** -- Adicionar item "Carteira" na barra inferior mobile
- **`src/components/financeiro/FinanceiroMenuSheet.tsx`** -- Adicionar item "Carteira" no menu mobile
- **`src/routing/HostRouter.tsx`** -- Adicionar rota `/financeiro/carteira` (preview) e `/carteira` (producao) com os guards `RequireFinanceiroAuth` e `RequireFinanceiro`

### 4. Arquivos afetados

| Arquivo | Acao |
|---|---|
| Nova migracao SQL | Criar RPC `list_all_member_balances` |
| `src/pages/financeiro/FinanceiroCarteira.tsx` | Criar pagina |
| `src/components/financeiro/FinanceiroLayout.tsx` | Adicionar nav item |
| `src/components/financeiro/FinanceiroBottomNav.tsx` | Adicionar nav item |
| `src/components/financeiro/FinanceiroMenuSheet.tsx` | Adicionar nav item |
| `src/routing/HostRouter.tsx` | Adicionar rotas |
