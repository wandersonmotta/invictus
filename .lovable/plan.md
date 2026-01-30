
Objetivo (o que você pediu)
- Deixar as animações mais perceptíveis e “premium clean”, sem pesar.
- Dar destaque especial para:
  1) os “quadrados” dos pilares / cards (entrando alternado esquerda/direita)
  2) os ícones (metal plates) com “pop” suave
  3) manter a experiência “auto”: desktop um pouco mais forte, mobile mais leve

O que encontrei no código (por que ainda está “fraquinho”)
- Hoje o sistema está assim:
  - A seção inteira usa `.invictus-reveal` (fade + leve slide + blur) quando ganha `invictus-revealed`.
  - Os itens internos usam `.invictus-stagger` com `@keyframes invictus-stagger-in`, que é basicamente um “subir 14px” igual para todo mundo.
- Resultado: funciona, mas fica muito “padrão UI” (parece template). Falta direção (L/R) e falta um “segundo tempo” para os ícones.

Decisões aprovadas (do seu retorno agora)
- Direção dos cards: Alternado L/R
- Ícones: Pop suave
- Desktop vs mobile: Auto (desktop mais perceptível, mobile mais leve)

Solução proposta (sem pesar)
Vou adicionar um “motion layer” específico para cards e ícones, sem mudar conteúdo e sem mexer no backend.

1) Stagger premium com direção alternada (L/R) só onde faz sentido
Meta: os cards (Pilares, O que encontra aqui) entrarem alternando esquerda→centro e direita→centro, de forma organizada.
Como:
- Criar uma variação de stagger: `.invictus-stagger--lr`
- Em CSS, preparar o estado inicial dos filhos:
  - `opacity: 0`
  - `transform: translateY(10px) translateX(+/- 18px)` (alternado por odd/even)
  - blur mínimo (opcional bem leve, só desktop)
- No estado revelado (`.invictus-revealed`), animar para `transform: none; opacity: 1;` com easing premium (mesma linha do reveal atual).
- Manter o stagger antigo (`.invictus-stagger` vertical) para textos/bullets (porque L/R em texto pode ficar estranho).

2) “Pop” suave para os ícones (metal plates), sincronizado com a entrada do card
Meta: o ícone parecer “peça premium” entrando depois do card, com micro brilho.
Como:
- Animar `.invictus-icon-plate` com:
  - scale 0.92 → 1.00 (com leve overshoot 1.02 e volta, bem sutil)
  - opacidade 0 → 1
  - micro aumento de brilho (box-shadow) durante o pico do pop
- Sincronizar o delay do ícone com o delay do card (ícone entra ~80–120ms depois do card para dar sensação “editada”).
Implementação técnica (CSS-only, sem biblioteca):
- Usar `nth-child(n)` para atribuir uma variável `--invictus-d` (delay) no card.
- Reutilizar `--invictus-d` dentro do card para atrasar o pop do ícone com `calc(var(--invictus-d) + 90ms)`.

3) Intensidade “Auto”: desktop mais perceptível, mobile mais leve
Meta: você sentir no computador sem virar “pesado”.
Como:
- Em `@media (min-width: 768px)`:
  - aumentar um pouco o translateX (ex.: 18px → 24px) e duração (ex.: 520ms → 620ms) nos cards L/R
  - manter blur mínimo (ex.: 0.35px) apenas no desktop
- Em mobile:
  - translateX menor (ex.: 12–16px)
  - sem blur (ou blur praticamente zero)
  - duration levemente menor

4) Aplicação pontual nos lugares certos (sem mexer no app interno)
Onde aplicar `.invictus-stagger--lr`:
- `src/components/landing/ManifestoSections.tsx`
  - Grid de cards em `Pillars()` (os 4 cards)
  - Grid de cards em `WhatYouFindHere()` (os 3 cards)
Onde NÃO aplicar (mantém vertical):
- blocos de texto do Manifesto
- listas (`BulletList`) e itens de bullet

5) Garantias de qualidade
- Acessibilidade: manter e ampliar o bloco `prefers-reduced-motion: reduce` para:
  - desativar as novas animações de L/R e pop dos ícones
  - manter tudo visível e sem transform
- Performance:
  - evitar blur no mobile
  - usar transform/opacity (barato) e limitar efeitos de box-shadow no pico do pop

Arquivos que vou alterar
1) `src/styles/invictus-auth.css`
- Adicionar:
  - `.invictus-stagger--lr` (estado inicial + animação revelada)
  - novos `@keyframes` (ex.: `invictus-card-in-left`, `invictus-card-in-right`, `invictus-icon-pop`)
  - sistema de delays por CSS variable (`--invictus-d`) aplicado por `nth-child`
  - ajustes “Auto” via media queries
  - regras extras dentro de `prefers-reduced-motion: reduce` cobrindo as novas classes

2) `src/components/landing/ManifestoSections.tsx`
- Trocar `className="invictus-stagger grid ..."` por:
  - `className="invictus-stagger invictus-stagger--lr grid ..."` nos grids de cards (Pilares e O que encontra aqui)
- (Opcional, se necessário para o pop ficar mais consistente) adicionar uma classe leve no wrapper do ícone, mas preferencialmente vou manter só `.invictus-icon-plate` para não poluir o JSX.

Como você vai validar rapidamente (checklist)
- Desktop:
  - Role até “Nossa mentalidade (pilares)” e veja cards entrando alternado L/R.
  - Repare que o ícone “dá o pop” logo depois do card entrar.
  - Role até “O que você encontra aqui”: mesma lógica, bem organizada.
- Mobile:
  - Mesma ideia, mas mais leve (sem blur pesado), ainda perceptível.
- Clique/hover:
  - CTA continua com micro-interações e sheen (já existe), sem travar.

Possíveis refinamentos (após você ver no preview)
- Ajustar “quanto” de L/R (ex.: 18px vs 28px no desktop).
- Ajustar a cadência do pop (ex.: +70ms vs +120ms depois do card).
- Definir um “preset” (Sutil+): mesma estética, só um pouco mais presente (caso você ainda ache fraco).

Sequência de implementação (rápida e segura)
1) Implementar `.invictus-stagger--lr` + keyframes no CSS (sem mexer em JSX ainda).
2) Aplicar `.invictus-stagger--lr` nos grids de cards (Pillars / WhatYouFindHere).
3) Adicionar pop do `.invictus-icon-plate` sincronizado.
4) Ajustar intensidade “Auto” (desktop vs mobile).
5) Testar “prefers-reduced-motion” e corrigir qualquer item que fique invisível fora do scope.

Riscos e como vou evitar
- “Ficar chamativo demais”: manter overshoot mínimo e sombras controladas; motion clean, sem bounce.
- “Alguns itens sumirem”: garantir que a regra de ocultar (`opacity: 0`) continue limitada ao `.invictus-reveal-scope` (como já está hoje).
- “Delay bagunçado”: centralizar delays via `--invictus-d` para card + ícone, evitando cálculos duplicados ou inconsistências.
