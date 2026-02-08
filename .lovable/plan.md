

# Restrição de Acesso no Painel Financeiro por Cargo

## Objetivo
Implementar controle de acesso granular no painel financeiro, onde:
- **Auditor**: acesso SOMENTE a "Fila de Auditoria" (e detalhe da auditoria)
- **Gerente Financeiro / Admin**: acesso completo (Fila de Auditoria, Historico, Relatorios, Pagamentos, Carteira, Equipe)

## O que muda

| Funcionalidade | Auditor | Gerente / Admin |
|---|---|---|
| Fila de Auditoria | Sim | Sim |
| Detalhe da Auditoria (aprovar/recusar) | Sim | Sim |
| Historico | Nao | Sim |
| Relatorios | Nao | Sim |
| Pagamentos | Nao | Sim |
| Carteira | Nao | Sim |
| Equipe | Nao | Sim |

## Detalhes Tecnicos

### 1. Criar hook `useFinanceiroRole`
Um hook centralizado que retorna o cargo do usuario logado no contexto financeiro: `auditor`, `gerente`, ou `admin`. Combina os hooks `useIsAdmin` e `useIsFinanceiroGerente` ja existentes.

Logica:
- Se tem role `admin` -> acesso total
- Se tem role `financeiro_gerente` -> acesso total
- Se tem role `financeiro` (sem gerente) -> apenas auditor

### 2. Atualizar `FinanceiroLayout.tsx` (sidebar desktop)
- Usar o hook para condicionar a exibicao dos itens de navegacao
- Auditor ve apenas "Fila de Auditoria" na sidebar
- Gerente/Admin ve todos os itens

### 3. Atualizar `FinanceiroBottomNav.tsx` (navegacao mobile)
- Auditor ve apenas o botao "Auditoria" (sem Historico, Pagamentos, Menu)
- Gerente/Admin mantem navegacao completa

### 4. Atualizar `FinanceiroMenuSheet.tsx` (menu mobile)
- Filtrar itens do menu baseado no cargo
- Auditor ve apenas "Fila de Auditoria"

### 5. Proteger rotas no `HostRouter.tsx`
- Adicionar um guard nos componentes de rota para Historico, Relatorios, Pagamentos, Carteira e Equipe
- Se um auditor tentar acessar diretamente via URL, sera redirecionado para o dashboard (fila de auditoria)

### 6. Criar componente `RequireFinanceiroManager`
Um guard de rota que verifica se o usuario e gerente ou admin. Caso contrario, redireciona para o dashboard financeiro. Sera usado para envolver as rotas restritas (historico, relatorios, pagamentos, carteira, equipe).

### Arquivos que serao criados
- `src/hooks/useFinanceiroRole.ts` - Hook centralizado de cargo financeiro

### Arquivos que serao modificados
- `src/auth/RequireFinanceiroManager.tsx` - Novo guard de rota (criacao)
- `src/components/financeiro/FinanceiroLayout.tsx` - Condicionar sidebar
- `src/components/financeiro/FinanceiroBottomNav.tsx` - Condicionar nav mobile
- `src/components/financeiro/FinanceiroMenuSheet.tsx` - Condicionar menu
- `src/routing/HostRouter.tsx` - Adicionar guard nas rotas restritas

### Nenhuma alteracao no banco de dados
A estrutura de roles ja esta pronta (`financeiro`, `financeiro_gerente`, `admin`). As alteracoes sao puramente de frontend.

