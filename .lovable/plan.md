
# Plano: Cargo de Gerente de Suporte + Transferencia de Tickets

## Resumo

Duas funcionalidades combinadas: (1) ao cadastrar um membro na equipe de suporte, poder escolher entre "Atendente" e "Gerente de Suporte"; (2) gerentes e admins podem transferir tickets entre atendentes.

## Permissoes por cargo

| Funcionalidade | Atendente | Gerente | Admin |
|----------------|-----------|---------|-------|
| Ver propria fila de tickets | Sim | Sim | Sim |
| Ver TODOS os tickets | Nao | Sim | Sim |
| Transferir tickets | Nao | Sim | Sim |
| Ver avaliacoes | Nao | Sim | Sim |
| Gerenciar equipe (add/remove) | Nao | Sim | Sim |
| Treinamento da IA | Nao | Nao | Sim |

## Etapas

### 1. Migration SQL

Adicionar `suporte_gerente` ao enum `app_role` existente.

### 2. Criar hook `useIsSuporteGerente`

Hook simples que usa `has_role` com `suporte_gerente`, seguindo o mesmo padrao do `useIsAdmin`.

### 3. Atualizar Edge Function `manage-support-agents`

- Aceitar campo `position` ("atendente" ou "gerente") na acao `create`
- Se gerente: atribuir as duas roles (`suporte` + `suporte_gerente`)
- Na acao `remove`: remover ambas as roles
- Na acao `list`: retornar flag `is_gerente` para cada agente
- Permitir que `suporte_gerente` (alem de admin) execute acoes de gerenciamento

### 4. Atualizar tela de Equipe (`SuporteEquipe.tsx`)

- Adicionar seletor de cargo no formulario de cadastro ("Atendente" ou "Gerente de Suporte")
- Mostrar badge de cargo em cada card de agente
- Permitir acesso para quem tem `suporte_gerente` (nao so admin)

### 5. Atualizar Layout e Navegacao

Nos componentes `SuporteLayout.tsx` e `SuporteBottomNav.tsx`:
- Equipe e Avaliacoes ficam visiveis para admin OU gerente
- IA (treinamento) continua exclusivo para admin

### 6. Atualizar guards de acesso

- `useIsSuporte.ts`: aceitar `suporte_gerente` tambem como role valida para acessar o back-office
- `useRestrictedRole.ts`: incluir `suporte_gerente` na lista de roles restritas

### 7. Transferencia de tickets (`SuporteAtendimento.tsx`)

- Botao "Transferir" no header (visivel para admin e gerente)
- Dialog com lista de atendentes disponiveis (vem da Edge Function, acao `list`)
- Ao selecionar: atualiza `assigned_to` do ticket e muda status para `escalated`
- Toast de confirmacao

## Detalhes Tecnicos

### Migration

```text
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'suporte_gerente';
```

### Logica de acesso nos componentes

```text
const showManagerFeatures = isAdmin || isSuporteGerente;  // Equipe, Avaliacoes, Transferir
const showIAFeatures = isAdmin;                            // IA somente admin
```

### Edge Function - permissao do caller

Hoje so admin pode chamar. Sera atualizado para aceitar tambem quem tem `suporte_gerente`:

```text
const canManage = roles.includes("admin") || roles.includes("suporte_gerente");
```

### Transferencia - fluxo

1. Gerente/Admin clica "Transferir" no header do atendimento
2. Dialog lista atendentes (excluindo o atual assigned_to)
3. Ao confirmar: UPDATE support_tickets SET assigned_to = novo, status = 'escalated'
4. Toast: "Ticket transferido para [Nome]"

### Arquivos a serem criados/modificados

| Arquivo | Acao |
|---------|------|
| Migration SQL | Criar -- `suporte_gerente` no enum |
| `src/hooks/useIsSuporteGerente.ts` | Criar |
| `supabase/functions/manage-support-agents/index.ts` | Modificar |
| `src/pages/suporte-backoffice/SuporteEquipe.tsx` | Modificar |
| `src/components/suporte-backoffice/SuporteLayout.tsx` | Modificar |
| `src/components/suporte-backoffice/SuporteBottomNav.tsx` | Modificar |
| `src/pages/suporte-backoffice/SuporteAtendimento.tsx` | Modificar |
| `src/hooks/useIsSuporte.ts` | Modificar |
| `src/hooks/useRestrictedRole.ts` | Modificar |
