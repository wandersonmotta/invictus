
# Plano: Equipe Financeira (mesmo padrao do Suporte)

## Resumo

Criar a secao "Equipe" no painel financeiro, seguindo exatamente o mesmo padrao ja implementado no back-office de suporte. Apenas o admin pode visualizar e gerenciar membros da equipe financeira. Novos membros precisam completar um setup de perfil obrigatorio (nome, sobrenome, foto) no primeiro acesso.

---

## O que sera feito

### 1. Edge Function: `manage-financeiro-agents`

Copia do `manage-support-agents`, mas operando com a role `financeiro` em vez de `suporte`:

- **create**: Cria usuario via admin API, cria perfil com `access_status = 'approved'`, atribui role `financeiro`
- **remove**: Remove role `financeiro` do usuario
- **list**: Lista usuarios com role `financeiro`, excluindo admins, retornando perfil + email

### 2. Pagina: `FinanceiroEquipe.tsx`

Copia do `SuporteEquipe.tsx` adaptada para o contexto financeiro:

- Titulo: "Equipe Financeira"
- Usa `useIsAdmin` para restringir acesso
- Chama `manage-financeiro-agents` em vez de `manage-support-agents`
- Formulario para cadastrar novo membro (nome, email, senha)
- Lista de membros com avatar, nome, email e botao de remover
- Redireciona nao-admins para `/financeiro/dashboard` (ou `/dashboard` em producao)

### 3. Setup de Perfil Obrigatorio

Reutilizar o `SuporteProfileSetup` existente (ou criar `FinanceiroProfileSetup` identico) no `FinanceiroLayout`:

- Ao carregar o layout, verificar se o usuario logado tem `first_name`, `last_name` e `avatar_url`
- Se faltar algum, exibir tela de setup obrigatoria antes de mostrar o conteudo
- Apos salvar, a tela some permanentemente

### 4. Navegacao

Adicionar link "Equipe" na sidebar e bottom nav, visivel apenas para admin:

- **Sidebar** (`FinanceiroLayout.tsx`): Novo `NavItem` com icone `Users` apos "Carteira", condicional ao admin
- **Bottom Nav** (`FinanceiroBottomNav.tsx`): Nao adicionar item direto (ja tem Menu); incluir no `FinanceiroMenuSheet` como item admin-only
- **Rota** (`HostRouter.tsx`): Adicionar rota `/equipe` no bloco financeiro (preview e producao)

---

## Detalhes Tecnicos

### Arquivos a criar

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/manage-financeiro-agents/index.ts` | Edge function para CRUD de membros financeiros |
| `src/pages/financeiro/FinanceiroEquipe.tsx` | Pagina de gestao da equipe |

### Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `supabase/config.toml` | Adicionar config `manage-financeiro-agents` |
| `src/components/financeiro/FinanceiroLayout.tsx` | Verificar perfil incompleto (setup obrigatorio) + link "Equipe" admin-only na sidebar |
| `src/components/financeiro/FinanceiroMenuSheet.tsx` | Adicionar item "Equipe" admin-only no menu mobile |
| `src/routing/HostRouter.tsx` | Adicionar rota `/equipe` nos blocos financeiro (preview + producao) |

### Ordem de execucao

1. Criar edge function `manage-financeiro-agents` + config.toml + deploy
2. Criar `FinanceiroEquipe.tsx`
3. Modificar `FinanceiroLayout.tsx` (setup obrigatorio + link Equipe)
4. Modificar `FinanceiroMenuSheet.tsx` (item Equipe admin)
5. Adicionar rota em `HostRouter.tsx`
