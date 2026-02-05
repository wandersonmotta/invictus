
## Plano de Correção: Autenticação do Painel Financeiro

Identifiquei dois problemas na página `/financeiro/auth`:

### Problema 1: Botão "Entrar" cortado em algumas resoluções

**Causa**: O card do formulário não se ajusta corretamente em telas menores, cortando o botão na parte inferior.

**Solução**: Ajustar o padding e garantir que o formulário tenha scroll interno ou que o container seja flexível.

### Problema 2: Redirecionamento incorreto

**Causa**: O componente `RequireFinanceiro` redireciona para `/auth` (rota do app principal) quando deveria redirecionar para a rota de login do financeiro:
- No subdomínio `financeiro.`: redirecionar para `/auth`
- No ambiente preview Lovable: redirecionar para `/financeiro/auth`

---

## Alteracoes Propostas

### 1. Corrigir o layout do `FinanceiroAuth.tsx`
- Adicionar margem inferior no card para garantir espaço para o botao
- Garantir que o container permita scroll se necessario

### 2. Corrigir o redirecionamento no `RequireFinanceiro.tsx`
- Verificar se estamos no ambiente Lovable preview
- Se sim, redirecionar para `/financeiro/auth`
- Se nao (subdominio real), redirecionar para `/auth`

### 3. Corrigir o `RequireAuth` para o contexto financeiro
- No contexto financeiro, nao deve verificar profile approval
- Usuarios financeiros sao externos e nao precisam de aprovacao de membro

---

## Detalhes Tecnicos

```text
Arquivo: src/auth/RequireFinanceiro.tsx
---------------------------------------
Mudanca:
- Importar isLovableHost de @/lib/appOrigin
- Se isLovableHost, redirecionar para /financeiro/auth
- Caso contrario, redirecionar para /auth

Arquivo: src/pages/financeiro/FinanceiroAuth.tsx  
-------------------------------------------------
Mudanca:
- Adicionar padding-bottom no container do form
- Garantir overflow-y-auto no card se necessario
```

---

## Resultado Esperado

1. O botao "Entrar" ficara sempre visivel em todas as resolucoes
2. Usuarios nao autorizados serao redirecionados corretamente para a tela de login do financeiro
3. O fluxo de login do financeiro ficara independente do fluxo de membros
