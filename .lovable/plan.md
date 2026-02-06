
# Corrigir Historico de Auditorias e Exibir Auditor

## Problema

A pagina de Historico retorna erro 400 porque nao existe foreign key entre `withdrawal_requests` e `profiles`. O join `profiles!inner(...)` falha. Alem disso, o historico precisa mostrar quem aprovou ou recusou cada saque (campo `reviewed_by`).

## Solucao

### 1. Criar uma RPC dedicada: `list_processed_withdrawals`

Assim como o Dashboard usa a RPC `list_pending_withdrawals` para evitar o problema de FK, vamos criar uma RPC semelhante para saques processados. Essa RPC vai:

- Buscar saques com `status IN ('approved', 'rejected')`
- Fazer JOIN com `profiles` para dados do solicitante (via `user_id`)
- Fazer JOIN com `profiles` novamente para dados do auditor (via `reviewed_by`)
- Retornar tudo em uma estrutura plana (sem nested objects)
- Usar `SECURITY DEFINER` com verificacao `is_financeiro()` para manter a seguranca

**Migracao SQL:**
```sql
CREATE OR REPLACE FUNCTION public.list_processed_withdrawals(p_limit int DEFAULT 200)
RETURNS TABLE (
  withdrawal_id uuid,
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  gross_amount numeric,
  fee_amount numeric,
  net_amount numeric,
  pix_key text,
  status text,
  requested_at timestamptz,
  reviewed_at timestamptz,
  rejection_reason text,
  reviewer_display_name text,
  reviewer_username text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    wr.id,
    wr.user_id,
    p.display_name,
    p.username,
    p.avatar_url,
    wr.gross_amount,
    wr.fee_amount,
    wr.net_amount,
    wr.pix_key,
    wr.status::text,
    wr.requested_at,
    wr.reviewed_at,
    wr.rejection_reason,
    rp.display_name,
    rp.username
  FROM withdrawal_requests wr
  JOIN profiles p ON p.user_id = wr.user_id
  LEFT JOIN profiles rp ON rp.user_id = wr.reviewed_by
  WHERE wr.status IN ('approved', 'rejected')
    AND is_financeiro()
  ORDER BY wr.reviewed_at DESC NULLS LAST
  LIMIT p_limit;
$$;
```

### 2. Atualizar `FinanceiroHistorico.tsx`

- Trocar a query direta por `rpcUntyped("list_processed_withdrawals", { p_limit: 200 })`
- Atualizar a interface `ProcessedWithdrawal` para incluir `reviewer_display_name` e `reviewer_username`
- Exibir o nome do auditor em cada card (ex: "Aprovado por Fulano" ou "Recusado por Fulano")
- Manter filtros, badges, e navegacao

### 3. Atualizar `FinanceiroRelatorios.tsx`

- A query de Relatorios que tambem usa `profiles!inner(...)` tambem esta falhando (mesmo erro 400)
- Trocar para uma query simples sem join (os relatorios so precisam dos valores, nao dos nomes)
- Para a tabela de atividade recente, criar ou reutilizar a mesma RPC

## Resultado esperado

- Historico carrega corretamente com todos os saques processados
- Cada registro mostra quem aprovou/recusou (nome do auditor)
- Relatorios tambem funciona sem erro
- Seguranca mantida via `is_financeiro()` dentro da RPC
