

# Simplificar pagina de Pontos + Vincular pontos do Reconhecimento

## Resumo

Duas mudancas principais:
1. **Layout da pagina `/pontos`**: Remover o header "Ola, {nome}" e deixar apenas a barra de saldo compacta no topo, seguida dos premios em lista vertical (scroll natural para ver todos).
2. **Vinculo com Reconhecimento**: Quando o membro atinge uma graduacao (Invictus, Bronze, Silver, etc.), os pontos daquele nivel sao creditados automaticamente no saldo de `point_balances`.

## O que muda

### 1. Layout simplificado da pagina Pontos

- Remover o bloco `<header>` com "Ola," e o nome do usuario
- Manter apenas o `PointsBalanceCard` no topo (barra compacta com icone Gift + saldo)
- Abaixo, a lista de premios em vertical com scroll natural - o usuario desce para ver mais
- Sem paginacao, todos os premios carregam de uma vez (sao poucos)

### 2. Pontos do Reconhecimento somam no saldo

Quando um membro conquista uma graduacao no sistema de reconhecimento, os pontos correspondentes (ex: Invictus = 50 pts, Bronze = 100 pts, Gold = 1000 pts) devem ser creditados na tabela `point_balances`, somando ao saldo existente.

Isso sera feito via uma funcao no banco de dados que pode ser chamada pelo admin ao aprovar/conceder uma graduacao. Os pontos se acumulam - se o membro ja tem pontos de outra fonte, eles somam; se nao tem nenhum, o saldo e criado com esses pontos.

## Detalhes tecnicos

### Arquivo: `src/pages/Pontos.tsx`

- Remover import de `useMyProfile`
- Remover as variaveis `profile` e `displayName`
- Remover o bloco `<header className="invictus-page-header">` inteiro (linhas 87-90)
- Manter o resto: `PointsBalanceCard`, lista de `RewardCard`, e `RedeemConfirmDialog`

### Banco de dados: RPC `grant_recognition_points`

Nova funcao `SECURITY DEFINER` que recebe `p_user_id` e `p_level_id` (ex: "bronze"), verifica a tabela de niveis (ou um mapeamento interno), e faz `INSERT ... ON CONFLICT` no `point_balances` somando os pontos correspondentes. Somente admins podem chamar.

Mapeamento de pontos por nivel (mesmo do `recognitionLevels.ts`):
- invictus: 50
- bronze: 100
- silver: 500
- gold: 1000
- black: 2500
- elite: 5000
- diamond: 12000

Essa funcao sera chamada futuramente quando o fluxo de aprovacao de graduacao for implementado. Por enquanto, fica disponivel para uso manual pelo admin.
