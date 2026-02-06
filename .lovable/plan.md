
# Corrigir deducao do saldo -- usar valor bruto dos saques pendentes

## Problema

Quando voce solicita um saque de R$ 100, o historico mostra corretamente R$ 95,01 (valor liquido apos a taxa de 4,99%). Porem, do "Bonus atual" precisa sair os R$ 100 completos (o valor bruto que foi solicitado), porque esse e o valor que fica travado na sua carteira ate a auditoria aprovar ou recusar.

Atualmente o `balance` vindo do backend nao desconta saques pendentes. Precisamos subtrair manualmente a soma dos `gross_amount` dos saques pendentes.

## Solucao

**Arquivo:** `src/pages/Carteira.tsx`, funcao `fetchWallet` (linha 106)

Alterar de:
```
setBalance(walletData.balance ?? 0);
```

Para:
```
const pendingGross = (walletData.pending_withdrawals ?? [])
  .filter(w => w.status === "pending")
  .reduce((sum, w) => sum + (w.gross_amount ?? 0), 0);
setBalance((walletData.balance ?? 0) - pendingGross);
```

Isso soma o `gross_amount` (R$ 100) de cada saque pendente e subtrai do saldo, em vez de usar o `net_amount` (R$ 95,01).

## Resultado esperado

- Voce solicita saque de R$ 100
- Historico mostra "Saque PIX - Pendente - R$ 95,01" (valor liquido que voce vai receber)
- Bonus atual cai R$ 100 (o valor bruto completo)
- Quando o financeiro aprovar, o debito de R$ 100 ja esta registrado no backend, tudo bate

Nenhuma outra alteracao necessaria.
