

## Objetivo
Tornar as animações **muito mais perceptíveis e premium**, especificamente:
1. **Cards dos pilares**: entrando **da direita para esquerda** com sensação de "encaixe" no lugar
2. **Ícones**: quando o card encaixa, o ícone **acende como LED amarelo** e permanece aceso
3. **Outras animações**: simples, mas perceptíveis

---

## Diagnóstico: Por que está "fraquinho"

### Problema 1: Movimento quase invisível
- Hoje: `translateX(16-26px)` é muito sutil, quase não percebe
- Cards usam transition suave que "some" visualmente

### Problema 2: Ícones não "acendem"
- O pop atual muda brightness de 0.98 → 1.03 (quase imperceptível)
- Não há efeito de "LED dourado ligando"

### Problema 3: Falta de "encaixe"
- Não há easing que simule "chegar e parar" (hoje é glide contínuo)

---

## Solução: Animações Premium Perceptíveis

### A) Cards entrando da direita para esquerda com "encaixe"

**Estado inicial:**
- `translateX(60px)` (movimento bem maior, vindo da direita)
- `opacity: 0`
- Leve blur (desktop)

**Animação:**
- Duração: 650ms
- Easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` — esse easing tem um "overshoot" sutil que cria a sensação de "encaixar" no lugar
- Stagger: 120ms entre cada card (para entrar um por um, não todos juntos)

**Resultado visual:**
O card vem da direita, desacelera, "ultrapassa" levemente a posição final e volta (como se encaixasse)

---

### B) Ícones "acendendo como LED amarelo"

**Estado inicial:**
- `opacity: 0`
- `scale(0.85)`
- Sem brilho

**Quando o card encaixa (delay +180ms):**
1. Ícone aparece com scale 0.85 → 1.0
2. Ao mesmo tempo: **box-shadow dourado intenso acende** (efeito LED)
3. Background do plate ganha **tonalidade dourada**
4. O brilho **permanece** (não some depois)

**CSS do "LED ligado" (estado final permanente):**
```css
box-shadow:
  0 0 0 1px hsl(var(--gold-hot) / 0.45) inset,
  0 0 18px -4px hsl(var(--gold-hot) / 0.65),
  0 0 30px -8px hsl(var(--gold-hot) / 0.45);
background:
  linear-gradient(
    135deg,
    hsl(var(--gold-hot) / 0.22),
    hsl(var(--gold-soft) / 0.14) 50%,
    hsl(var(--gold-hot) / 0.18)
  );
```

---

### C) Outras animações mais perceptíveis

**Seções (SectionShell):**
- Aumentar `translateY` de 12px → 22px
- Duração: 700ms
- Mais presença na entrada

**Textos e bullets dentro das seções:**
- Stagger com entrada de baixo (16px)
- Delay um pouco maior entre itens (90ms)

---

## Arquivos a modificar

### 1) `src/styles/invictus-auth.css`
- Reescrever `.invictus-stagger--lr` com:
  - `translateX(60px)` (direita → esquerda)
  - Easing "encaixe" com overshoot sutil
  - Keyframes novos para o movimento
- Reescrever `.invictus-icon-plate` animação:
  - Novo keyframe `invictus-icon-glow` com LED dourado
  - Estado final com glow permanente
- Ajustar `.invictus-reveal` com mais presença
- Ajustar delays do stagger (mais espaçados)

### 2) `src/components/landing/ManifestoSections.tsx`
- Manter classes já aplicadas (já usam `invictus-stagger--lr`)
- (opcional) Garantir que todos os pilares entrem da direita

---

## Comportamento esperado

### Desktop e Mobile:
1. Você rola até "Nossa mentalidade (pilares)"
2. Os 4 cards entram **um por um da direita**, com movimento perceptível (60px)
3. Cada card "encaixa" no lugar (efeito de desaceleração + micro bounce)
4. O ícone de cada card **acende dourado** (LED) ~180ms após o card encaixar
5. O ícone **permanece aceso** (não apaga)

### Acessibilidade:
- Respeita `prefers-reduced-motion: reduce` — tudo aparece sem animação

---

## Detalhes técnicos

### Keyframes do card (entrada direita → esquerda com encaixe):
```css
@keyframes invictus-card-slide-in {
  0% {
    opacity: 0;
    transform: translateX(60px) translateY(8px);
  }
  70% {
    opacity: 1;
    transform: translateX(-4px) translateY(0); /* micro overshoot */
  }
  100% {
    opacity: 1;
    transform: translateX(0) translateY(0); /* encaixado */
  }
}
```

### Keyframes do ícone (acendendo LED):
```css
@keyframes invictus-icon-glow {
  0% {
    opacity: 0;
    transform: scale(0.85);
    box-shadow: 0 0 0 0 transparent;
    background: linear-gradient(135deg, hsl(var(--foreground) / 0.14), ...);
  }
  60% {
    opacity: 1;
    transform: scale(1.02);
    box-shadow: 0 0 24px -2px hsl(var(--gold-hot) / 0.75); /* flash */
  }
  100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 18px -4px hsl(var(--gold-hot) / 0.65); /* permanece */
    background: linear-gradient(135deg, hsl(var(--gold-hot) / 0.22), ...);
  }
}
```

---

## Checklist de validação

- [ ] Cards dos pilares entram da **direita para esquerda** (60px de movimento)
- [ ] Cada card "encaixa" com micro bounce
- [ ] Ícones **acendem amarelo/dourado** como LED
- [ ] O brilho do ícone **permanece** depois de acender
- [ ] Animações são **perceptíveis** no desktop e mobile
- [ ] Tudo funciona com `prefers-reduced-motion: reduce`

---

## Próximos passos após implementação

1. Testar no desktop (recarregar página e rolar até os pilares)
2. Testar no mobile (mesmo fluxo)
3. Se quiser mais ou menos intensidade, ajustamos os valores (translateX, duração, brilho)

