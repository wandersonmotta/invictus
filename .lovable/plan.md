
# Plano: Refatorar Carteira + Dialog de Saque com Slider

## Visão Geral

Implementar o fluxo de saque seguindo fielmente a referência enviada, com:
- Botão "Sacar" reposicionado (fora do card, alinhado à direita)
- Dialog de saque com slider arrastável
- Taxa de 4.99% e saque mínimo de R$100
- Lógica de exibição: **Entradas = Bruto**, **Saídas/Pendentes = Líquido** (já com taxa descontada)
- Campo de chave PIX (CPF) no perfil e no dialog

---

## Regra de Negócio Principal

| Tipo de Transação | Valor Exibido |
|-------------------|---------------|
| **Entrada** | Valor BRUTO (total recebido) |
| **Saída (aprovado)** | Valor LÍQUIDO (já descontado 4.99%) |
| **Saída (pendente)** | Valor LÍQUIDO (já descontado 4.99%) |

**Exemplo:**
- Usuário solicita saque de R$100,00
- Taxa: R$100 × 4.99% = R$4,99
- Valor líquido: R$95,01
- No histórico de **Saídas** aparece: **R$95,01** (não R$100)

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/carteira/WalletBalanceCard.tsx` | **Modificar** | Botão "Sacar" fora do card, alinhado à direita |
| `src/components/carteira/WithdrawDialog.tsx` | **Criar** | Dialog de saque com slider, input, taxa e PIX |
| `src/components/carteira/types.ts` | **Modificar** | Adicionar campos para valor bruto/líquido |
| `src/pages/Carteira.tsx` | **Modificar** | Integrar dialog + responsividade mobile |
| `src/components/carteira/PixKeyCard.tsx` | **Criar** | Card para editar chave PIX no perfil |
| `src/pages/Perfil.tsx` | **Modificar** | Adicionar seção de chave PIX |
| `src/hooks/useMyProfile.ts` | **Modificar** | Incluir campo `pix_key` |
| `src/lib/cpf.ts` | **Criar** | Formatação e validação de CPF |

### Migração de Banco

```sql
ALTER TABLE profiles ADD COLUMN pix_key text;
```

---

## 1. Layout Corrigido (Conforme Referência)

```text
┌─────────────────────────────────────────┐
│  Bônus atual                       💳   │
│  R$ 249,90                              │
└─────────────────────────────────────────┘
                      ┌────────────────┐
                      │   Sacar ↗      │  ← Botão FORA do card
                      └────────────────┘

↔ Histórico de movimentações

 [Todos] [Entradas ↑] [Saídas ↓] [Pendente]

┌─────────────────────────────────────────┐
│ 08/12/2025 às 16:29            aprovado │
│ Cred Gawa                  + R$ 30,00   │  ← BRUTO (entrada)
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ 08/12/2025 às 08:08            pendente │
│ Saque PIX                  - R$ 95,01   │  ← LÍQUIDO (saída)
└─────────────────────────────────────────┘
```

---

## 2. Dialog de Saque (Seguindo Referência)

```text
┌──────────────────────────────────────────────┐
│                     ✕                        │
│           Solicitar Saque                    │
│                                              │
│  Saldo disponível: R$ 249,90                 │
│                                              │
│  Valor do saque:                             │
│  ┌────────────────────────────────────┐      │
│  │  R$ 100,00                         │      │
│  └────────────────────────────────────┘      │
│                                              │
│  ●────────────────────────────────○          │
│  R$ 100              (slider)     R$ 249    │
│                                              │
│  ┌────────────────────────────────────┐      │
│  │ Saque mínimo: R$ 100,00            │      │
│  │ Taxa de saque: 4.99%               │      │
│  │ Valor líquido: R$ 95,01            │      │
│  └────────────────────────────────────┘      │
│                                              │
│  Chave PIX (CPF):                            │
│  ┌────────────────────────────────────┐      │
│  │  123.456.789-00                    │      │
│  └────────────────────────────────────┘      │
│  ⓘ Usamos seu CPF como chave padrão          │
│                                              │
│  ┌────────────────────────────────────┐      │
│  │         Solicitar Saque            │      │
│  └────────────────────────────────────┘      │
└──────────────────────────────────────────────┘
```

### Comportamento do Slider

- **Mínimo**: R$100 (saque mínimo)
- **Máximo**: Saldo disponível do usuário
- **Sincronizado** com o input numérico (editar um atualiza o outro)
- **Cálculo em tempo real**: Taxa e valor líquido atualizados ao mover

---

## 3. Seção PIX no Perfil

Nova seção adicionada na página de Perfil:

```text
┌────────────────────────────────────────────┐
│ Chave PIX para saques                      │
│                                            │
│ Sua chave PIX será usada para receber      │
│ seus saques. Usamos CPF como padrão.       │
│                                            │
│ Chave PIX (CPF):                           │
│ ┌────────────────────────────────────┐     │
│ │  123.456.789-00                    │     │
│ └────────────────────────────────────┘     │
│                                            │
│           [ Salvar chave PIX ]             │
└────────────────────────────────────────────┘
```

---

## Seção Técnica

### Estrutura de Tipos Atualizada

```typescript
// types.ts
export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;       // Valor exibido (bruto para entrada, líquido para saída)
  grossAmount?: number; // Valor bruto original (para saídas, usado internamente)
}
```

### Constantes de Negócio

```typescript
const WITHDRAW_FEE_RATE = 0.0499; // 4.99%
const MIN_WITHDRAW = 100;         // R$100,00

// Cálculo do valor líquido
const netAmount = grossAmount * (1 - WITHDRAW_FEE_RATE);
// Ex: 100 * 0.9501 = 95.01
```

### Funções de CPF

```typescript
// src/lib/cpf.ts
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  // Validação dos dígitos verificadores...
}
```

### WithdrawDialog Props

```typescript
interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: number;
  pixKey: string | null;
  onSubmit: (amount: number, netAmount: number, pixKey: string) => void;
}
```

### Responsividade Mobile

```tsx
// Carteira.tsx - Container
<main className="invictus-page mx-auto w-full max-w-md px-4 py-6 sm:px-6">

// WalletBalanceCard - Layout com botão fora
<div className="flex flex-col gap-4">
  <div className="invictus-surface rounded-2xl p-5">
    {/* Card do saldo */}
  </div>
  <div className="flex justify-end">
    <Button variant="goldOutline" onClick={onOpenWithdraw}>
      Sacar <ExternalLink />
    </Button>
  </div>
</div>

// Dialog - Slider touch-friendly
<Slider 
  className="touch-manipulation" 
  min={100} 
  max={balance} 
  step={0.01}
/>
```

### Mock Data Atualizado

```typescript
// Saídas agora mostram o valor LÍQUIDO
const mockTransactions: Transaction[] = [
  { id: "1", date: "2025-12-08T16:29:00", description: "Cred Gawa", type: "entrada", status: "aprovado", amount: 30.0 },
  { id: "2", date: "2025-12-08T08:08:00", description: "Saque PIX", type: "saida", status: "pendente", amount: 95.01, grossAmount: 100 },
  { id: "3", date: "2025-12-05T10:15:00", description: "Saque PIX", type: "saida", status: "aprovado", amount: 47.51, grossAmount: 50 },
];
```

### Hook useMyProfile Atualizado

```typescript
export type MyProfile = {
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  pix_key: string | null; // NOVO
};

// Query:
.select("first_name, last_name, display_name, avatar_url, pix_key")
```

---

## Fluxo do Usuário

1. Usuário acessa `/carteira`
2. Vê o saldo e histórico de transações
3. Clica em "Sacar"
4. Dialog abre com slider (mínimo R$100, máximo = saldo)
5. Move slider ou digita valor
6. Vê taxa (4.99%) e valor líquido em tempo real
7. Se não tem PIX cadastrado, insere CPF
8. Clica "Solicitar Saque"
9. Transação aparece no histórico como **pendente** com **valor líquido**
10. Após aprovação, status muda para **aprovado**

---

## Resultado Esperado

- Layout idêntico à referência enviada
- Botão "Sacar" posicionado corretamente (fora do card)
- Responsivo para mobile/tablet/desktop
- Slider funcional e sincronizado com input
- Cálculo correto de taxa e valor líquido
- Histórico exibe valores conforme a regra (bruto/líquido)
- Chave PIX gerenciável no perfil
