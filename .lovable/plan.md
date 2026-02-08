

# Subcategorias + Filtros de Triagem na Fila de Tickets

## O que muda

A tela "Fila de Tickets" vai ganhar duas melhorias visuais e funcionais:

### 1. Abas: Pendentes e Resolvidos
- Duas abas no topo da pagina: **Pendentes** e **Resolvidos**
- **Pendentes**: tickets com status "escalated" (Aguardando) e "assigned" (Em atendimento)
- **Resolvidos**: tickets com status "resolved"
- Cada aba mostra um contador com a quantidade de tickets

### 2. Chips de filtro por classificacao de triagem
- Abaixo das abas, uma barra horizontal com chips clicaveis: **Todos**, **Urgente**, **Moderado**, **Baixo**
- Cada chip mostra a cor correspondente (vermelho, amarelo, verde) e a quantidade
- Ao clicar num chip, filtra apenas tickets daquela prioridade
- "Todos" mostra todos, ordenados automaticamente por prioridade (urgente primeiro)
- Os chips aparecem tanto na aba Pendentes quanto na aba Resolvidos

### Ordenacao automatica (mantida)
- Dentro de cada filtro, os tickets continuam ordenados por prioridade (urgente > moderado > baixo) e por data dentro de cada nivel
- Isso garante que os mais urgentes sempre aparecem primeiro, mesmo sem filtro manual

## Detalhes tecnicos

### Arquivo modificado
`src/pages/suporte-backoffice/SuporteDashboard.tsx`

### Mudancas
1. Adicionar estado local `activeTab` ("pending" | "resolved") e `priorityFilter` ("all" | "urgente" | "moderado" | "baixo")
2. Usar o componente `Tabs` do Radix UI (ja disponivel no projeto) para as abas Pendentes/Resolvidos
3. Criar uma barra de chips de filtro com contadores usando botoes estilizados com as cores do PRIORITY_MAP
4. Separar `sortedTickets` em dois arrays: `pendingTickets` (status escalated/assigned) e `resolvedTickets` (status resolved)
5. Aplicar o filtro de prioridade em cima do array ativo
6. A query ja busca tickets com status "escalated", "assigned" e "resolved" - nao precisa mudar
7. Layout totalmente responsivo para mobile (chips em scroll horizontal se necessario)

### Estrutura visual

```text
+------------------------------------------+
|  Fila de Tickets                         |
|  Tickets escalados                       |
+------------------------------------------+
|  [Pendentes (7)]  |  [Resolvidos (3)]    |   <-- Abas
+------------------------------------------+
|  [Todos] [Urgente 2] [Moderado 3] [Baixo 2] |  <-- Chips filtro
+------------------------------------------+
|  Ticket 1 - Urgente - Em atendimento     |
|  Ticket 2 - Urgente - Aguardando         |
|  Ticket 3 - Moderado - Em atendimento    |
|  ...                                     |
+------------------------------------------+
```

### Componentes utilizados (ja existem no projeto)
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` de `@/components/ui/tabs`
- `Badge` de `@/components/ui/badge` (para contadores nos chips)
- Nenhuma dependencia nova necessaria
