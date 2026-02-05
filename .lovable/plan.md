
# Plano: Corrigir Dialog de Saque conforme Referência HC Club

## Visão Geral

Refatorar o `WithdrawDialog` para seguir exatamente o layout da referência:

```text
┌─────────────────────────────────────────┐
│  Solicite o saque                   ✕   │
│                                         │
│          R$ 249,90                      │  ← Valor grande, centralizado
│                                         │
│     Qual valor deseja retirar?          │  ← Subtítulo
│                                         │
│  ●─────────────────────────────────○    │  ← Slider
│                                         │
│     Arraste para indicar o valor        │  ← Instrução abaixo do slider
│                                         │
│  ┌───────────────────────────────────┐  │
│  │        Sacar R$ 249,90            │  │  ← Botão com valor dinâmico
│  └───────────────────────────────────┘  │
│                                         │
│        Saque mínimo: R$ 100             │  ← Texto simples
│                                         │
│   Será aplicada uma taxa de 4,99%       │  ← Descrição da taxa
│   sobre o valor do saque referente      │
│   aos custos operacionais.              │
│                                         │
└─────────────────────────────────────────┘
```

## Diferenças Identificadas

| Atual | Referência |
|-------|------------|
| Título: "Solicitar Saque" | "Solicite o saque" |
| Input editável do valor | Apenas exibe o valor selecionado |
| Valores min/max abaixo do slider | "Arraste para indicar o valor" |
| Box com informações de taxa | Texto simples abaixo do botão |
| Botão: "Solicitar Saque" | "Sacar R$ X.XXX,XX" (valor dinâmico) |
| Campo de PIX no dialog | Não aparece (solicitar apenas se necessário) |

## Arquivo a Modificar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/carteira/WithdrawDialog.tsx` | Refatorar layout completo |

---

## Novo Layout do Componente

### Estrutura Simplificada

1. **Título**: "Solicite o saque" (alinhado à esquerda)
2. **Valor grande**: O valor selecionado (sincronizado com slider)
3. **Pergunta**: "Qual valor deseja retirar?"
4. **Slider**: De R$100 até o saldo disponível
5. **Instrução**: "Arraste para indicar o valor"
6. **Botão**: "Sacar R$ X.XXX,XX" (mostra o valor selecionado)
7. **Info taxa**: "Saque mínimo: R$ 100"
8. **Descrição**: "Será aplicada uma taxa de 4,99%..."

### Fluxo do PIX

Para manter a validação de PIX mas não poluir o dialog principal:
- **Se o usuário já tem PIX cadastrado**: Usa automaticamente
- **Se não tem PIX**: Após clicar "Sacar", abre uma etapa secundária para cadastrar o CPF

---

## Seção Técnica

### Código Refatorado

```tsx
export function WithdrawDialog({
  open,
  onOpenChange,
  balance,
  pixKey,
  onSubmit,
}: WithdrawDialogProps) {
  const [amount, setAmount] = useState(balance);
  const [step, setStep] = useState<"amount" | "pix">("amount");
  const [localPixKey, setLocalPixKey] = useState(pixKey ?? "");
  const [pixError, setPixError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setAmount(Math.max(MIN_WITHDRAW, balance));
      setStep("amount");
      setLocalPixKey(pixKey ?? "");
      setPixError(null);
    }
  }, [open, pixKey, balance]);

  const netAmount = useMemo(() => calculateNetAmount(amount), [amount]);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleSliderChange = (values: number[]) => {
    setAmount(values[0]);
  };

  const handleNext = () => {
    if (!pixKey && !isValidCPF(localPixKey)) {
      setStep("pix");
      return;
    }
    const key = pixKey || localPixKey.replace(/\D/g, "");
    onSubmit(amount, netAmount, key);
  };

  const canWithdraw = balance >= MIN_WITHDRAW;

  // Step 1: Amount selection (layout da referência)
  if (step === "amount") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-left text-lg font-medium">
              Solicite o saque
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {!canWithdraw ? (
              <div className="text-center py-8">
                <p className="text-sm text-destructive">
                  Saldo insuficiente para saque.
                </p>
              </div>
            ) : (
              <>
                {/* Large Amount Display */}
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-foreground">
                    {formatCurrency(amount)}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Qual valor deseja retirar?
                  </p>
                </div>

                {/* Slider */}
                <div className="space-y-3 px-2">
                  <Slider
                    value={[amount]}
                    onValueChange={handleSliderChange}
                    min={MIN_WITHDRAW}
                    max={balance}
                    step={1}
                    className="touch-manipulation"
                  />
                  <p className="text-center text-xs text-muted-foreground">
                    Arraste para indicar o valor
                  </p>
                </div>

                {/* Submit Button with dynamic value */}
                <Button
                  className="w-full h-12 text-base font-semibold"
                  onClick={handleNext}
                >
                  Sacar {formatCurrency(amount)}
                </Button>

                {/* Fee Info (simple text) */}
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Saque mínimo: {formatCurrency(MIN_WITHDRAW)}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Será aplicada uma taxa de 4,99% sobre o valor do saque 
                    referente aos custos operacionais.
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Step 2: PIX key input (only if not registered)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-left text-lg font-medium">
            Informe sua chave PIX
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-sm text-muted-foreground">
            Para receber seu saque de {formatCurrency(netAmount)}, 
            precisamos da sua chave PIX (CPF).
          </p>

          <div className="space-y-2">
            <Label htmlFor="pix-key">Chave PIX (CPF)</Label>
            <Input
              id="pix-key"
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={localPixKey}
              onChange={(e) => {
                setLocalPixKey(formatCPF(e.target.value));
                setPixError(null);
              }}
              className={pixError ? "border-destructive" : ""}
            />
            {pixError && (
              <p className="text-xs text-destructive">{pixError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep("amount")}
            >
              Voltar
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                if (!isValidCPF(localPixKey)) {
                  setPixError("CPF inválido");
                  return;
                }
                onSubmit(amount, netAmount, localPixKey.replace(/\D/g, ""));
              }}
            >
              Confirmar Saque
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Estilização do Slider

O slider na referência tem uma cor sólida (roxo no HC Club, usaremos o gold/primary da Invictus). O slider atual já usa a cor `--primary`, então estará correto.

### Inicialização do Valor

Na referência, o slider começa no **máximo** (saldo total). Atualizaremos o `useState` e `useEffect` para inicializar com `balance` em vez de `MIN_WITHDRAW`.

---

## Resultado Esperado

- Dialog idêntico ao da referência HC Club
- Valor grande e centralizado no topo
- Slider com instrução "Arraste para indicar o valor"
- Botão dinâmico "Sacar R$ X.XXX,XX"
- Informações de taxa e mínimo abaixo do botão
- Fluxo de PIX em etapa separada (apenas se necessário)
- Layout limpo e mobile-friendly
