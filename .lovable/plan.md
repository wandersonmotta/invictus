

# Gestao de Resgates de Premios no Admin

## Resumo

Adicionar uma nova aba **"Resgates"** no painel Admin (`/admin`) para que o administrador possa visualizar e gerenciar todos os premios solicitados pelos membros. A aba mostrara uma tabela com: foto do perfil do usuario, nome, qual premio foi resgatado, quantidade de pontos gastos, data do resgate, e status atual (pendente, aprovado, rejeitado, entregue).

## O que muda

### 1. Nova aba "Resgates" na pagina Admin

A pagina Admin atualmente tem 6 abas. Sera adicionada uma 7a aba chamada **"Resgates"**, que exibira:

- Tabela com as colunas:
  - **Avatar + Nome** do membro (foto do perfil e display_name)
  - **Premio** resgatado (nome do premio)
  - **Pontos** gastos
  - **Data** do resgate
  - **Status** (pendente / aprovado / rejeitado / entregue)
  - **Acoes** (botoes para aprovar, rejeitar ou marcar como entregue)

- Os dados virao de uma query que cruza `point_redemptions` com `profiles` (para avatar e nome) e `point_rewards` (para nome do premio)

### 2. Banco de dados

As tabelas `point_balances`, `point_rewards` e `point_redemptions` serao criadas junto com o restante do sistema de pontos (conforme plano anterior aprovado). Para o admin, sera necessario:

- RLS na `point_redemptions` permitindo SELECT para admins
- RLS na `point_rewards` permitindo ALL para admins (gerenciar catalogo)
- Uma RPC (ou query direta) que retorne os resgates com dados do perfil e do premio juntos

### 3. Fluxo de gestao

O admin podera:
1. Ver todos os resgates pendentes no topo da lista
2. Clicar em "Aprovar" para marcar como aprovado
3. Clicar em "Rejeitar" para recusar o resgate (pontos devolvidos ao membro)
4. Clicar em "Entregue" apos enviar o premio fisico

## Detalhes tecnicos

### Arquivo: `src/pages/Admin.tsx`

- Adicionar nova tab "Resgates" no `TabsList` (grid passara de 6 para 7 colunas)
- Novo `TabsContent value="redemptions"` com:
  - Query `point_redemptions` via RPC que retorna dados enriquecidos (avatar_url, display_name, reward_name, points_spent, requested_at, status)
  - Tabela usando os componentes Table existentes
  - Avatar do membro usando componente `Avatar` + `AvatarImage` + `AvatarFallback`
  - Badge colorido para status (amarelo = pendente, verde = aprovado, vermelho = rejeitado, azul = entregue)
  - Botoes de acao condicionais baseados no status atual

### Banco de dados - RPC `admin_list_redemptions`

Funcao `SECURITY DEFINER` que retorna os resgates com JOIN em profiles e point_rewards:

```text
SELECT
  r.id, r.user_id, r.points_spent, r.status, r.requested_at, r.reviewed_at,
  p.display_name, p.avatar_url,
  pw.name as reward_name
FROM point_redemptions r
JOIN profiles p ON p.user_id = r.user_id
JOIN point_rewards pw ON pw.id = r.reward_id
ORDER BY r.requested_at DESC
```

### Banco de dados - RPC `admin_update_redemption_status`

Funcao `SECURITY DEFINER` que:
1. Verifica se o caller e admin
2. Atualiza o status do resgate
3. Se rejeitado, devolve os pontos ao `point_balances` do membro
4. Registra `reviewed_at` com timestamp atual

### RLS adicional

- `point_redemptions`: admin pode SELECT todos os registros
- `point_rewards`: admin pode ALL (criar, editar, remover premios)

