

## Redesign da pagina Carteira seguindo a referencia

### O que muda

Ajustar o layout da Carteira para corresponder a referencia: card de saldo em barra larga escura com o botao "Sacar" alinhado a direita na mesma linha, e layout mais amplo no desktop.

### Arquivos a modificar

**1. `src/pages/Carteira.tsx`**

- Aumentar a largura maxima do container de `max-w-md` para `max-w-3xl`, permitindo que o conteudo ocupe mais espaco no desktop (como na referencia)
- O restante da logica permanece igual

**2. `src/components/carteira/WalletBalanceCard.tsx`**

Redesenhar para uma unica linha horizontal:

```text
+--------------------------------------------------+----------+
|  Saldo atual                              [icone] |          |
|  R$ 0,00                                         | Sacar -> |
+--------------------------------------------------+----------+
```

- Trocar o layout de `flex-col` (card em cima, botao embaixo) para `flex-row` (card + botao lado a lado)
- O card de saldo: fundo escuro solido (`bg-foreground text-background`), label "Saldo atual" em cima, valor embaixo, icone de carteira no canto direito do card
- O botao "Sacar": posicionado a direita, fora do card escuro, com estilo rosa/claro suave (como na referencia: `bg-red-50 text-red-500` ou similar), incluindo icone de seta
- No mobile: manter lado a lado mas o botao fica menor

### Detalhes visuais

- Label do saldo muda de "Bonus atual" para "Saldo atual" (como na referencia)
- Card com cantos arredondados (`rounded-2xl`), sem gradiente, fundo solido escuro
- Botao "Sacar" com fundo rosa claro, texto avermelhado, e icone de check/seta (como na referencia)
- Layout responsivo: ambos elementos ficam na mesma linha em todos os tamanhos

