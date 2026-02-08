
# Ajuste do Timing da Animacao Gold Sweep

## Problema atual

A animacao existe e funciona, mas o brilho varre muito rapido (apenas 40% dos 4s = 1.6s de movimento real) e depois fica parado por muito tempo (60% = 2.4s de pausa). Isso pode dar a impressao de que nao esta funcionando.

## O que muda

**Arquivo**: `src/components/landing/GoldSweepText.tsx`

1. **Duracao total**: de `4s` para `3s` (ciclo mais curto, como solicitado)
2. **Distribuicao do keyframe**: o brilho vai varrer por 60% do ciclo (1.8s de movimento) e pausar por 40% (1.2s), ao inves do contrario atual. Isso deixa o sweep mais visivel e a pausa mais curta.
3. **Faixa de brilho mais larga**: aumentar a area do highlight no gradiente (de 30% de largura para 40%) para que o reflexo fique mais perceptivel enquanto passa.

## Detalhes tecnicos

Alteracoes no `GoldSweepText.tsx`:
- Linha 41: `animation: "gold-sweep 3s ease-in-out infinite"`
- Linhas 46-50: keyframes ajustados:
  - `0%` -> brilho em `200% center` (comeca fora da direita... na verdade fora da esquerda, posicao alta)
  - `60%` -> brilho em `-100% center` (termina fora da direita)
  - `100%` -> pausa (mantem `-100% center`)
- Gradiente do brilho: alargar a faixa luminosa (transparent em 30%/70% ao inves de 35%/65%)
