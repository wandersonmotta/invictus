
# Plano: Bloquear acesso de Financeiro/Suporte ao App de membros

## Problema atual

Os usuarios criados nas equipes "Financeiro" e "Suporte" conseguem acessar `app.invictusfraternidade.com.br` porque o guard `RequireAuth` verifica apenas se existe uma sessao ativa e um perfil -- nao verifica se o usuario tem uma role restrita (`financeiro` ou `suporte`).

## Solucao

Adicionar uma verificacao de role dentro do `RequireAuth`. Se o usuario logado possuir APENAS a role `financeiro` ou `suporte` (sem ser admin ou membro regular), ele sera redirecionado para a pagina inicial do seu respectivo painel.

## O que sera feito

### 1. Criar hook `useUserRoles`

Um novo hook que retorna todas as roles do usuario logado, consultando a tabela `user_roles`:

- Retorna array de roles (ex: `['financeiro']`, `['suporte']`, `['admin']`, ou `[]` para membros normais)
- Usa RPC `has_role` para checar `financeiro` e `suporte`

### 2. Modificar `RequireAuth`

Apos confirmar que existe sessao, verificar se o usuario tem role `financeiro` ou `suporte`:

- Se tem role `financeiro` (e nao e admin): redirecionar para `/financeiro/dashboard` (preview) ou o dominio `financeiro.` (producao)
- Se tem role `suporte` (e nao e admin): redirecionar para `/suporte-backoffice/dashboard` (preview) ou o dominio `suporte.` (producao)
- Se nao tem nenhuma dessas roles (membro normal ou admin): continua o fluxo atual normalmente

### 3. Modificar `RequireFinanceiro` e `RequireSuporte`

Garantir que esses guards tambem bloqueiem acesso cruzado:

- `RequireFinanceiro`: se o usuario tem role `suporte` mas nao `financeiro`, redirecionar para area de suporte
- `RequireSuporte`: se o usuario tem role `financeiro` mas nao `suporte`, redirecionar para area financeira

## Detalhes Tecnicos

### Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/auth/RequireAuth.tsx` | Adicionar verificacao de roles `financeiro`/`suporte` e redirecionar para area correta |
| `src/hooks/useIsFinanceiro.ts` | Reutilizado (ja existe) |
| `src/hooks/useIsSuporte.ts` | Reutilizado (ja existe) |

### Logica no RequireAuth

```text
1. Sessao existe? Nao -> /auth
2. Usuario tem role 'financeiro' (e nao admin)?
   -> Redirecionar para /financeiro/dashboard (preview) ou financeiro.dominio (producao)
3. Usuario tem role 'suporte' (e nao admin)?
   -> Redirecionar para /suporte-backoffice/dashboard (preview) ou suporte.dominio (producao)
4. Continuar fluxo normal (perfil, aprovacao, etc.)
```

### Tratamento por ambiente

- **Preview (lovable.app)**: Redireciona internamente para `/financeiro/dashboard` ou `/suporte-backoffice/dashboard`
- **Producao (dominio custom)**: Redireciona para `financeiro.invictusfraternidade.com.br` ou `suporte.invictusfraternidade.com.br`

### Ordem de execucao

1. Modificar `RequireAuth.tsx` para incluir verificacao de roles e redirecionamento
