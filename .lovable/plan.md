
# Sistema de Auditoria Financeira - Back Office Separado

## Visao Geral

Vamos criar um sistema de auditoria financeira completamente isolado no subdominio `financeiro.invictusfraternidade.com.br`, com autenticacao propria e interface dedicada para o time financeiro auditar saques antes do pagamento.

```text
+-------------------------------+     +--------------------------------+
|   app.invictusfraternidade    |     | financeiro.invictusfraternidade|
|        (Membros)              |     |     (Time Financeiro)          |
+-------------------------------+     +--------------------------------+
|                               |     |                                |
|  /carteira                    |     |  /auth (login financeiro)      |
|   - Ver saldo                 |     |  /dashboard                    |
|   - Solicitar saque           |     |   - Fila de auditoria          |
|   - Historico                 |     |   - Detalhe do membro          |
|                               |     |   - Aprovar/Recusar            |
+-------------------------------+     +--------------------------------+
             |                                     |
             v                                     v
    +--------------------------------------------------+
    |              BANCO DE DADOS                      |
    |  wallet_transactions | withdrawal_requests       |
    |  withdrawal_audits   | commission_sources        |
    +--------------------------------------------------+
```

---

## Fase 1: Infraestrutura de Roles e Seguranca

### 1.1 Nova Role `financeiro`

Adicionar a role `financeiro` ao enum existente `app_role`:

```sql
ALTER TYPE public.app_role ADD VALUE 'financeiro';
```

### 1.2 Funcao de Verificacao

Criar funcao `has_financeiro_role()` seguindo o padrao existente:

```sql
CREATE OR REPLACE FUNCTION public.is_financeiro()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'financeiro'::app_role)
$$;
```

---

## Fase 2: Estrutura do Banco de Dados

### 2.1 Tabela `wallet_transactions` (Ledger de Movimentacoes)

Armazena TODAS as movimentacoes de cada membro:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| user_id | uuid | Membro dono da carteira |
| type | enum | 'credit' ou 'debit' |
| amount | numeric(12,2) | Valor da movimentacao |
| description | text | Ex: "Comissao Produto X" |
| source_type | text | 'commission', 'bonus', 'withdrawal' |
| source_id | uuid | FK para tabela de origem |
| created_at | timestamptz | Data da movimentacao |
| metadata | jsonb | Dados adicionais (produto, rede, etc) |

### 2.2 Tabela `withdrawal_requests` (Solicitacoes de Saque)

Fila de auditoria para o time financeiro:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| user_id | uuid | Membro que solicitou |
| gross_amount | numeric(12,2) | Valor bruto solicitado |
| fee_amount | numeric(12,2) | Taxa calculada (4.99%) |
| net_amount | numeric(12,2) | Valor liquido |
| pix_key | text | Chave PIX informada |
| status | enum | 'pending', 'approved', 'rejected' |
| requested_at | timestamptz | Data da solicitacao |
| reviewed_at | timestamptz | Data da auditoria |
| reviewed_by | uuid | Financeiro que auditou |
| rejection_reason | text | Motivo (se recusado) |

### 2.3 Tabela `withdrawal_audits` (Log Imutavel de Auditoria)

Registro permanente de cada acao do financeiro:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| withdrawal_id | uuid | FK para withdrawal_requests |
| action | text | 'approved', 'rejected', 'viewed' |
| performed_by | uuid | Financeiro |
| performed_at | timestamptz | Timestamp da acao |
| notes | text | Observacoes do auditor |
| snapshot | jsonb | Estado do membro no momento |

### 2.4 Tabela `commission_sources` (Origem das Comissoes)

Para rastreabilidade completa:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| transaction_id | uuid | FK wallet_transactions |
| product_name | text | Nome do produto |
| product_sku | text | Codigo do produto |
| sale_amount | numeric | Valor da venda |
| commission_rate | numeric | % de comissao |
| referral_user_id | uuid | Quem indicou (rede) |
| level | int | Nivel na rede (1=direto) |
| created_at | timestamptz | Data |

---

## Fase 3: Politicas RLS (Seguranca)

### 3.1 `wallet_transactions`
- **SELECT**: Membro ve apenas suas transacoes OU financeiro ve todas
- **INSERT**: Apenas via RPCs internas (SECURITY DEFINER)
- **UPDATE/DELETE**: Bloqueado (ledger imutavel)

### 3.2 `withdrawal_requests`
- **SELECT**: Membro ve apenas suas solicitacoes OU financeiro ve todas
- **INSERT**: Membro cria apenas para si mesmo
- **UPDATE**: Apenas financeiro pode atualizar status

### 3.3 `withdrawal_audits`
- **SELECT**: Apenas financeiro
- **INSERT**: Apenas via RPC (SECURITY DEFINER)
- **UPDATE/DELETE**: Bloqueado (imutavel)

---

## Fase 4: Roteamento por Subdominio

### 4.1 Atualizar `src/lib/appOrigin.ts`

Adicionar deteccao do subdominio `financeiro.`:

```typescript
export function isFinanceiroHost(hostname: string) {
  return isCustomDomain(hostname) && hostname.startsWith("financeiro.");
}

export function getFinanceiroOrigin(...) {
  // Construir URL para financeiro.invictusfraternidade.com.br
}
```

### 4.2 Atualizar `src/routing/HostRouter.tsx`

Adicionar branch para `financeiro.*`:

```typescript
if (isFinanceiroHost(hostname)) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={<FinanceiroAuthPage />} />
      <Route path="/dashboard" element={
        <RequireAuth>
          <RequireFinanceiro>
            <FinanceiroLayout>
              <FinanceiroDashboard />
            </FinanceiroLayout>
          </RequireFinanceiro>
        </RequireAuth>
      } />
      <Route path="/auditoria/:withdrawalId" element={...} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
```

---

## Fase 5: Interface do Back Office Financeiro

### 5.1 Pagina de Login (`/auth`)

- Visual identico ao app principal (branding Invictus)
- Titulo: "Acesso Financeiro"
- Apenas email/senha (sem convites)
- Apos login, valida role `financeiro`

### 5.2 Dashboard Principal (`/dashboard`)

Layout com sidebar minimalista:

```text
+------------------------------------------+
|  INVICTUS FINANCEIRO     [Usuario] [Sair]|
+----------+-------------------------------+
|          |  Fila de Auditoria            |
| Fila (5) |  +-------------------------+  |
|          |  | Maria S. | R$500 | Pend.|  |
| Historico|  | Joao M.  | R$200 | Pend.|  |
|          |  | ...                     |  |
| Relatorio|  +-------------------------+  |
+----------+-------------------------------+
```

### 5.3 Tela de Auditoria Detalhada

Quando clicar em uma solicitacao:

```text
+------------------------------------------+
| < Voltar          AUDITORIA #12345       |
+------------------------------------------+
| MEMBRO: Maria Silva (@maria)             |
| CPF (PIX): 123.456.789-00                |
+------------------------------------------+
| SOLICITACAO                              |
| Valor Bruto: R$ 500,00                   |
| Taxa (4.99%): R$ 24,95                   |
| Valor Liquido: R$ 475,05                 |
| Solicitado em: 05/02/2026 14:30          |
+------------------------------------------+
| HISTORICO COMPLETO DO MEMBRO             |
| +------+-------------+----------+------+ |
| | Data | Descricao   | Tipo     | Valor| |
| +------+-------------+----------+------+ |
| | 04/02| Comissao X  | Entrada  | +100 | |
| | 03/02| Saque       | Saida    | -50  | |
| | 01/02| Bonus Rede  | Entrada  | +200 | |
| +------+-------------+----------+------+ |
| Saldo Atual: R$ 500,00                   |
+------------------------------------------+
| MATEMATICA DE VERIFICACAO                |
| Total Entradas: R$ 1.500,00              |
| Total Saidas: R$ 1.000,00                |
| Saldo Esperado: R$ 500,00 [OK]           |
+------------------------------------------+
| ORIGEM DAS COMISSOES                     |
| - Produto Alpha (Venda #123): R$ 100     |
| - Bonus Rede Nivel 1 (Joao): R$ 50       |
| - ...                                    |
+------------------------------------------+
|                                          |
| [RECUSAR]              [APROVAR E PAGAR] |
+------------------------------------------+
```

### 5.4 Fluxo de Aprovacao

1. Financeiro clica em "Aprovar e Pagar"
2. Sistema registra em `withdrawal_audits`
3. Atualiza status para `approved` em `withdrawal_requests`
4. Cria transacao de debito em `wallet_transactions`
5. Membro ve status atualizado na carteira

### 5.5 Fluxo de Recusa

1. Financeiro clica em "Recusar"
2. Modal pede motivo obrigatorio
3. Sistema registra em `withdrawal_audits` com motivo
4. Atualiza status para `rejected`
5. Valor volta ao saldo disponivel do membro

---

## Fase 6: Arquivos a Criar

### Novos Arquivos

```text
src/
  auth/
    RequireFinanceiro.tsx          # Guard de acesso
  hooks/
    useIsFinanceiro.ts             # Hook de verificacao
  pages/
    financeiro/
      FinanceiroAuth.tsx           # Login financeiro
      FinanceiroDashboard.tsx      # Dashboard principal
      AuditoriaDetalhe.tsx         # Tela de auditoria
  components/
    financeiro/
      FinanceiroLayout.tsx         # Layout do back office
      FinanceiroSidebar.tsx        # Menu lateral
      WithdrawalQueue.tsx          # Lista de pendentes
      MemberAuditCard.tsx          # Card de historico
      AuditMathVerification.tsx    # Verificacao matematica
```

### Arquivos a Modificar

```text
src/lib/appOrigin.ts               # Adicionar isFinanceiroHost
src/routing/HostRouter.tsx         # Branch para financeiro.*
src/pages/Carteira.tsx             # Integrar com banco real
src/components/carteira/types.ts   # Sincronizar com DB
```

---

## Fase 7: Sequencia de Implementacao

1. **Banco de Dados** (Migracao SQL)
   - Adicionar role `financeiro`
   - Criar 4 tabelas com RLS
   - Criar RPCs de auditoria

2. **Roteamento** (Frontend)
   - Atualizar appOrigin.ts
   - Atualizar HostRouter.tsx
   - Criar RequireFinanceiro

3. **Interface Financeiro** (Frontend)
   - Layout e autenticacao
   - Dashboard com fila
   - Tela de auditoria detalhada

4. **Integracao Carteira** (Frontend + Backend)
   - Conectar Carteira.tsx ao banco real
   - Criar solicitacoes reais
   - Exibir status atualizado

5. **Criar Usuario Financeiro**
   - Criar conta via Supabase
   - Atribuir role `financeiro`
   - Testar fluxo completo

---

## Consideracoes de Seguranca

1. **Isolamento Total**: Subdominio separado impede acesso acidental
2. **Role Dedicada**: `financeiro` e diferente de `admin`
3. **Audit Trail**: Toda acao e registrada imutavelmente
4. **Verificacao Matematica**: Sistema calcula e compara saldos
5. **RLS Restritivo**: Financeiro so ve o necessario
6. **Snapshot**: Estado do membro e salvo no momento da auditoria

---

## Tecnologias Utilizadas

- **Frontend**: React + TypeScript + Tailwind (mesmo stack do app)
- **Backend**: Supabase (RLS + RPCs + Realtime)
- **Autenticacao**: Supabase Auth (mesmo sistema, role diferente)
- **Auditoria**: Tabelas imutaveis com logs detalhados

