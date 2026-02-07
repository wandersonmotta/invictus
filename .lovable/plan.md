

## Ajustes na Carteira para ficar identico a referencia

### Diferencas identificadas

1. **Cabecalho**: Na referencia, "Ola," e o nome aparecem na mesma linha, com o nome em negrito, e ha uma seta de voltar a esquerda. Hoje esta em duas linhas separadas sem seta.
2. **Botao "Sacar"**: Na referencia, o fundo e rosa claro (quase branco-rosado) com texto rosa/vermelho. Hoje esta com fundo escuro (`bg-red-950/40`), que nao corresponde.
3. **Texto do botao**: Na referencia mostra "Sacar" com um icone de check/seta ao lado (horizontal). Hoje esta empilhado verticalmente com icone em cima e texto embaixo.

### Arquivos a modificar

**1. `src/pages/Carteira.tsx`**

- Alterar o header para uma unica linha: seta de voltar + "Ola, **Nome**"
- Formato: `<ArrowLeft /> Ola, <strong>{displayName}</strong>` tudo alinhado horizontalmente
- A seta de voltar usa `useNavigate(-1)` ou volta para `/home`

**2. `src/components/carteira/WalletBalanceCard.tsx`**

- Mudar o botao "Sacar" de fundo escuro para fundo rosa claro: `bg-red-100 text-red-500 hover:bg-red-200`
- Mudar o layout do botao de vertical (icone em cima, texto embaixo) para horizontal (texto + icone lado a lado)
- Aumentar levemente o gap entre o card de saldo e o botao

