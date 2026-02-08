
# Animacao "Sweeping Gold Shine" na Frase Final

## O que muda

A frase **"Isso e INVICTUS. Isso e Fraternidade. Isso e decisao."** vai deixar de usar o `GoldHoverText` (efeito que segue o mouse) e vai ganhar uma **animacao automatica de brilho dourado varrendo o texto** -- como um reflexo de luz passando por uma superficie metalica premium. O efeito roda em loop infinito, sem precisar de interacao do usuario.

## Referencia visual

Pense em logotipos gravados em metal dourado onde um reflexo de luz percorre a superficie de ponta a ponta, como se houvesse um spot de luz passando. O texto base fica com um gradiente dourado estatico, e um "flash" branco-dourado mais intenso desliza da esquerda para a direita a cada ~4 segundos.

## Detalhes tecnicos

### Novo componente: `src/components/landing/GoldSweepText.tsx`

Um componente dedicado que aplica:
- Texto base com gradiente dourado fixo (`--gold-hot` / `--gold-soft`) via `background-clip: text`
- Uma camada de brilho animada usando `background-position` com `@keyframes` que desliza um highlight branco-dourado da esquerda para a direita
- Animacao em loop com pausa natural (aceleracao no meio, pausa de ~2s entre ciclos usando porcentagens do keyframe)
- Sutil `text-shadow` dourado para dar profundidade

### Arquivo modificado: `src/components/landing/ManifestoSections.tsx`

- Substituir `<GoldHoverText>` por `<GoldSweepText>` na frase final
- Importar o novo componente

### Keyframe da animacao

```text
0%    -> brilho posicionado fora da esquerda
40%   -> brilho percorre ate a direita
100%  -> pausa (brilho fora da tela, espera antes do proximo ciclo)
```

Duracao total: ~4s, criando um ritmo elegante sem ser excessivo.
