

# Plano: Ajustar Fluxo de Saque com Validação e Atualização Imediata do Histórico

## Visão Geral

Implementar as regras de negócio para o fluxo de saque:
- Bloquear o botão "Sacar" se saldo < R$100
- Quando o saque é solicitado, adicionar imediatamente ao histórico como "pendente" com valor líquido
- Garantir que transações pendentes de saída aparecem em "Todos", "Saídas" e "Pendente"

---

## Regras de Negócio

| Regra | Comportamento |
|-------|---------------|
| Saldo < R$100 | Botão "Sacar" desabilitado |
| Saldo >= R$100 | Botão "Sacar" habilitado |
| Ao solicitar saque | Transação aparece imediatamente como "pendente" |
| Filtro "Pendente" | Mostra todas transações com status "pendente" |
| Filtro "Saídas" | Mostra todas transações tipo "saida" (independente do status) |
| Após aprovação | Status muda de "pendente" para "aprovado" |

---

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/carteira/WalletBalanceCard.tsx` | **Modificar** | Desabilitar botão se saldo < R$100 |
| `src/pages/Carteira.tsx` | **Modificar** | Gerenciar estado das transações e adicionar pendente ao solicitar |

---

## 1. WalletBalanceCard - Desabilitar Botão

Adicionar prop `canWithdraw` e desabilitar o botão quando `false`:

```tsx
interface WalletBalanceCardProps {
  balance: number;
  canWithdraw: boolean;  // NOVO
  onWithdraw?: () => void;
}

// No botão:
<Button
  variant="goldOutline"
  className="gap-2"
  onClick={onWithdraw}
  disabled={!canWithdraw}  // NOVO
>
  Sacar
  <ExternalLink className="size-4" />
</Button>
```

---

## 2. Carteira - Gerenciar Estado de Transações

Transformar mock em estado local e adicionar transação pendente ao solicitar:

```tsx
export default function Carteira() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile(user?.id);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  
  // Transações agora são estado local (mock inicial)
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  
  // Calcular saldo baseado nas transações (futuro: vir do backend)
  const balance = mockBalance; // Por enquanto mock
  
  const canWithdraw = balance >= MIN_WITHDRAW;

  const handleWithdrawSubmit = (grossAmount: number, netAmount: number, pixKey: string) => {
    // Criar nova transação pendente
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      description: "Saque PIX",
      type: "saida",
      status: "pendente",
      amount: netAmount,        // Valor líquido (exibido)
      grossAmount: grossAmount, // Valor bruto (interno)
    };
    
    // Adicionar ao topo da lista
    setTransactions((prev) => [newTransaction, ...prev]);
    
    toast.success("Saque solicitado!", {
      description: `Valor líquido: R$ ${netAmount.toFixed(2).replace(".", ",")}`,
    });
    
    setWithdrawOpen(false);
  };

  return (
    <main className="invictus-page mx-auto w-full max-w-md px-4 py-6 sm:px-6">
      {/* ... */}
      
      <WalletBalanceCard 
        balance={balance} 
        canWithdraw={canWithdraw}  // NOVO
        onWithdraw={() => setWithdrawOpen(true)} 
      />

      <TransactionHistory transactions={transactions} />
      
      {/* ... */}
    </main>
  );
}
```

---

## 3. Verificar Lógica de Filtros (Já Correta)

O `TransactionHistory` já implementa a lógica correta:

```tsx
const filteredTransactions = transactions.filter((t) => {
  if (activeFilter === "todos") return true;                    // ✅ Mostra tudo
  if (activeFilter === "pendente") return t.status === "pendente"; // ✅ Mostra pendentes
  return t.type === activeFilter;                               // ✅ Saídas inclui pendentes
});
```

**Resultado**:
- **Todos**: Mostra todas as transações (inclui pendentes)
- **Saídas**: Mostra todas com `type === "saida"` (inclui aprovadas E pendentes)
- **Pendente**: Mostra todas com `status === "pendente"`

---

## Seção Técnica

### Fluxo Completo

```text
┌─────────────────────────────────────────────────────────────┐
│ USUÁRIO                                                     │
├─────────────────────────────────────────────────────────────┤
│ 1. Acessa /carteira                                         │
│    → Vê saldo e histórico                                   │
│    → Botão "Sacar" habilitado se saldo >= R$100             │
│                                                             │
│ 2. Clica em "Sacar"                                         │
│    → Dialog abre com slider (R$100 até saldo)               │
│                                                             │
│ 3. Seleciona valor e confirma                               │
│    → Se não tem PIX: pede CPF                               │
│    → Submete o saque                                        │
│                                                             │
│ 4. Transação adicionada ao histórico                        │
│    → Status: "pendente"                                     │
│    → Valor: líquido (já com taxa descontada)                │
│    → Aparece em: Todos, Saídas, Pendente                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ADMIN (futuro)                                              │
├─────────────────────────────────────────────────────────────┤
│ 5. Aprova o pagamento                                       │
│    → Status muda de "pendente" para "aprovado"              │
│    → Continua aparecendo em: Todos, Saídas                  │
│    → Remove de: Pendente                                    │
└─────────────────────────────────────────────────────────────┘
```

### Constantes Utilizadas

```typescript
// types.ts (já existem)
export const WITHDRAW_FEE_RATE = 0.0499; // 4.99%
export const MIN_WITHDRAW = 100;         // R$100,00
```

### Cálculo do Valor Líquido

```typescript
// Exemplo: grossAmount = 100
// netAmount = 100 * (1 - 0.0499) = 95.01
```

---

## Resultado Esperado

1. **Botão desabilitado** quando saldo < R$100
2. **Ao solicitar saque**:
   - Transação aparece imediatamente no histórico
   - Status: "pendente"
   - Valor exibido: líquido (já descontado 4.99%)
3. **Filtros funcionando**:
   - Saída pendente aparece em "Todos", "Saídas" e "Pendente"
4. **Toast de confirmação** com valor líquido

