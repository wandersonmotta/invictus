
# Plano: Criar Página de Carteira

## Visão Geral

Criar a página de Carteira seguindo o design da referência HC Club, adaptado para a identidade visual dark premium da Invictus. A página exibirá o saldo de bônus do usuário, botão de saque, e histórico de movimentações com filtros.

## Elementos do Design (Referência)

Baseado na imagem de referência:

```text
┌──────────────────────────────────────────────┐
│ Olá, [Nome do Usuário]                       │
├──────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐   │
│ │ Bônus atual                        💳  │   │
│ │ R$ 249,90                              │   │
│ └────────────────────────────────────────┘   │
│                                              │
│           ┌──────────────────┐               │
│           │   Sacar ↗        │               │
│           └──────────────────┘               │
│                                              │
│ ↔ Histórico de movimentações                 │
│                                              │
│  [Entradas ↑] [Saídas ↓] [Pendente 🕐]       │
│                                              │
│ ┌────────────────────────────────────────┐   │
│ │ 08/12/2025 às 16:29          aprovado  │   │
│ │ Cred Gawa                    R$ 30,00  │   │
│ └────────────────────────────────────────┘   │
│ ┌────────────────────────────────────────┐   │
│ │ 08/12/2025 às 15:43          aprovado  │   │
│ │ Cred Gawa                    R$ 60,00  │   │
│ └────────────────────────────────────────┘   │
│ ...                                          │
└──────────────────────────────────────────────┘
```

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/Carteira.tsx` | **Criar** | Página principal da carteira |
| `src/components/carteira/WalletBalanceCard.tsx` | **Criar** | Card do saldo atual com botão de sacar |
| `src/components/carteira/TransactionHistory.tsx` | **Criar** | Histórico de movimentações com filtros |
| `src/components/carteira/TransactionRow.tsx` | **Criar** | Linha individual de transação |
| `src/routing/HostRouter.tsx` | **Modificar** | Adicionar rota `/carteira` |
| `src/App.tsx` | **Modificar** | Adicionar preloader da página |
| `src/components/AppSidebar.tsx` | **Modificar** | Remover `placeholder: true` do item Carteira |
| `src/components/mobile/MobileMenuSheet.tsx` | **Modificar** | Remover `placeholder: true` do item Carteira |
| `src/components/mobile/MobileBottomNav.tsx` | **Modificar** | Atualizar para navegar para `/carteira` |

## Estrutura do Componente

### 1. Carteira.tsx (Página Principal)

```tsx
// Layout mobile-first com header e seções
<main className="invictus-page">
  <header className="invictus-page-header">
    <p className="text-muted-foreground">Olá,</p>
    <h1 className="invictus-h1">{displayName}</h1>
  </header>

  <WalletBalanceCard balance={249.90} />
  
  <TransactionHistory transactions={mockTransactions} />
</main>
```

### 2. WalletBalanceCard.tsx

Card dark premium com:
- Ícone de carteira/cartão no canto superior direito
- Label "Bônus atual" em texto muted
- Valor grande e destacado (R$ X,XX)
- Botão "Sacar" abaixo do card (estilo outline com ícone)

### 3. TransactionHistory.tsx

- Título "Histórico de movimentações" com ícone
- Filtros em chips/toggle: "Entradas", "Saídas", "Pendente"
- Lista de TransactionRow

### 4. TransactionRow.tsx

Cada linha mostra:
- Data e hora (ex: "08/12/2025 às 16:29")
- Descrição da transação (ex: "Cred Gawa")
- Status (aprovado, pendente, rejeitado)
- Valor formatado em reais

## Dados Mock (Fase Inicial)

Por enquanto, a página usará dados mockados para demonstrar o layout:

```tsx
const mockTransactions = [
  { id: "1", date: "2025-12-08T16:29:00", description: "Cred Gawa", type: "entrada", status: "aprovado", amount: 30.00 },
  { id: "2", date: "2025-12-08T15:43:00", description: "Cred Gawa", type: "entrada", status: "aprovado", amount: 60.00 },
  { id: "3", date: "2025-12-08T13:56:00", description: "Cred Gawa", type: "entrada", status: "aprovado", amount: 60.00 },
  { id: "4", date: "2025-12-08T08:08:00", description: "Saque PIX", type: "saida", status: "pendente", amount: 100.00 },
  { id: "5", date: "2025-12-06T13:31:00", description: "Comissão Direto", type: "entrada", status: "aprovado", amount: 45.00 },
];
```

## Estilização

- Usar classes `invictus-surface` e `invictus-frame` para cards
- Card do saldo: background mais escuro/destacado (similar ao da referência)
- Cores: 
  - Verde para entradas/aprovado
  - Vermelho para saídas
  - Amarelo/âmbar para pendente
- Tipografia consistente com o resto do app

## Responsividade

- Layout single-column funciona bem em todas as telas
- Em desktop, limitar largura máxima (`max-w-md` ou `max-w-lg`)
- Centralizar conteúdo em telas maiores

## Próximos Passos (Futuro)

1. Criar tabela `wallet_transactions` no banco de dados
2. Integrar com dados reais via Supabase
3. Implementar funcionalidade de saque real
4. Adicionar notificações de novas transações

## Seção Técnica

### Rota no HostRouter

```tsx
const Carteira = React.lazy(() => import("@/pages/Carteira"));

// Dentro das Routes (em ambos os blocos)
<Route
  path="/carteira"
  element={
    <RequireAuth>
      <AppLayout>
        <Carteira />
      </AppLayout>
    </RequireAuth>
  }
/>
```

### Atualização do Bottom Nav

```tsx
// Em MobileBottomNav.tsx
const navItems: NavItem[] = [
  { id: "inicio", label: "Início", icon: Home, action: "navigate", url: "/app" },
  { id: "carteira", label: "Carteira", icon: Wallet, action: "navigate", url: "/carteira" }, // Atualizado
  // ...
];
```

### Tipo Transaction

```tsx
type TransactionType = "entrada" | "saida";
type TransactionStatus = "aprovado" | "pendente" | "rejeitado";

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
}
```
