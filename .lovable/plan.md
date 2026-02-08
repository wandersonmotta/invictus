

## Pagamentos no Painel Financeiro

### Objetivo
Criar uma nova seção "Pagamentos" no back-office financeiro que exiba, em tempo real, todos os pagamentos de serviços (tabela `service_payments`) de todos os usuarios -- tanto pendentes quanto aprovados.

---

### O que sera feito

**1. Banco de Dados -- Politica RLS para acesso financeiro**

Atualmente, a tabela `service_payments` so permite que cada usuario veja seus proprios registros. Precisamos adicionar uma politica SELECT que permita usuarios com role `financeiro` visualizar todos os pagamentos.

```sql
CREATE POLICY "Financeiro can view all payments"
  ON public.service_payments FOR SELECT
  USING (is_financeiro());
```

Tambem habilitaremos Realtime na tabela para atualizacoes em tempo real:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_payments;
```

**2. Nova pagina: `FinanceiroPagamentos`**

Arquivo: `src/pages/financeiro/FinanceiroPagamentos.tsx`

- Consulta todos os registros de `service_payments` com join no `profiles` (via RPC ou query direta) para exibir o nome do membro
- Abas/filtro: "Todos", "Pendentes", "Aprovados", "Expirados"
- KPIs no topo: Total Pendente, Total Aprovado, Quantidade de cada
- Lista de cards com: nome do membro, tipo de servico, valor, status, data
- Subscription Realtime via `supabase.channel()` para receber INSERT/UPDATE automaticamente
- Layout responsivo (tabela no desktop, cards empilhados no mobile) seguindo o padrao do `FinanceiroRelatorios`

**3. Rota no Router**

Adicionar rota `/financeiro/pagamentos` (e `/pagamentos` no subdominio financeiro) nos tres blocos de roteamento do `HostRouter.tsx`, protegida por `RequireFinanceiroAuth` + `RequireFinanceiro` + `FinanceiroLayout`.

**4. Navegacao -- Sidebar, BottomNav e MenuSheet**

- `FinanceiroLayout.tsx` (sidebar desktop): adicionar item "Pagamentos" com icone `CreditCard` entre "Relatorios" e "Carteira"
- `FinanceiroBottomNav.tsx`: adicionar item "Pagamentos" na barra inferior mobile
- `FinanceiroMenuSheet.tsx`: adicionar item "Pagamentos" no menu drawer mobile

**5. RPC opcional para dados enriquecidos**

Criar uma funcao `list_all_service_payments` (SECURITY DEFINER) que faca JOIN com `profiles` para retornar `display_name`, `username` e `avatar_url` junto com os dados do pagamento, evitando multiplas queries no frontend.

```sql
CREATE OR REPLACE FUNCTION list_all_service_payments(p_limit int DEFAULT 100)
RETURNS TABLE (
  payment_id uuid,
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  service_type text,
  status text,
  amount_cents int,
  item_count int,
  payment_provider text,
  created_at timestamptz,
  paid_at timestamptz,
  expires_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    sp.id, sp.user_id,
    p.display_name, p.username, p.avatar_url,
    sp.service_type, sp.status, sp.amount_cents, sp.item_count,
    sp.payment_provider, sp.created_at, sp.paid_at, sp.expires_at
  FROM service_payments sp
  LEFT JOIN profiles p ON p.user_id = sp.user_id
  ORDER BY sp.created_at DESC
  LIMIT p_limit;
$$;
```

---

### Secao Tecnica -- Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| Migracao SQL | RLS policy + RPC + Realtime |
| `src/pages/financeiro/FinanceiroPagamentos.tsx` | Criar pagina |
| `src/routing/HostRouter.tsx` | Adicionar rota (3 blocos) |
| `src/components/financeiro/FinanceiroLayout.tsx` | Adicionar nav item sidebar |
| `src/components/financeiro/FinanceiroBottomNav.tsx` | Adicionar nav item mobile |
| `src/components/financeiro/FinanceiroMenuSheet.tsx` | Adicionar nav item menu |

