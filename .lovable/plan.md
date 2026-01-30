
Objetivo (o que você pediu)
- Ativar/fortalecer animações “sutil premium” na landing (desktop e mobile) conforme a pessoa desce a página.
- Fazer as seções/painéis “entrarem” com elegância (sem cara de template), com stagger interno, fotos com entrada suave e CTAs com micro-interações.
- Garantir que as animações funcionem no desktop (hoje você está vendo mais no celular) e respeitem “reduzir movimento” do sistema.

Diagnóstico (por que no desktop parece que não anima)
1) Viewport maior no desktop:
   - Em telas grandes, várias seções ficam “no viewport” já no carregamento inicial.
   - O IntersectionObserver dispara imediatamente e a animação acontece antes da percepção do usuário (parece que “não teve animação”).

2) Classe de animação aplicada no mesmo frame:
   - O hook `useRevealOnScroll` aplica classes Tailwind de animação quando `visible` muda.
   - Dependendo do timing de renderização, isso pode “pular” a transição visual (especialmente quando o elemento já nasce visível).

3) Stagger interno existe, mas depende de `invictus-revealed`:
   - O CSS do stagger já está pronto (`.invictus-stagger`), mas precisamos garantir que o reveal do container aconteça no timing certo e de forma consistente.

Direção aprovada
- Intensidade: Sutil premium
- Animar: Seções/painéis + Stagger interno + Fotos/mídias + CTAs

O que vou implementar (solução)
A) “Reveal” realmente perceptível no desktop (seções/painéis)
- Ajustar o `useRevealOnScroll` para:
  1) Disparar o reveal um pouco mais tarde (quando a seção está “entrando” de verdade), usando `rootMargin` e `threshold` mais “exigentes”.
  2) Garantir que a mudança de classe ocorra após o browser “pintar” o estado inicial (ex.: usando `requestAnimationFrame`/micro-delay), para a animação ficar visível mesmo quando a seção entra rapidamente.
  3) Manter compatibilidade com `prefers-reduced-motion` (se estiver ativado, tudo aparece sem animação).

B) Motion system premium (sem Tailwind dependente)
- Em vez de depender apenas de `animate-in` do Tailwind (que pode ser sutil demais e/ou timing-sensitive), criar também um modo “cinematográfico sutil” em CSS para o reveal:
  - Estado inicial: `opacity: 0; transform: translateY(10~14px); filter: blur(0.5px) (bem leve)`.
  - Estado revelado: `opacity: 1; transform: none; filter: none`.
  - Transição: `cubic-bezier(0.2, 0.8, 0.2, 1)` com ~500–650ms (premium).

C) Stagger interno mais “arrumado”
- Manter o stagger atual, mas:
  - Garantir que apenas elementos dentro do “scope” correto sejam ocultados.
  - Ajustar curva/tempo para ficar mais “luxo”: menos “snappy”, mais “glide”.
  - Expandir delays para cobrir mais casos (seções com muitos itens) e evitar que tudo apareça junto em telas grandes.

D) Fotos/mídias com entrada premium
- Atualizar `EditorialMedia` para aceitar (por padrão) um reveal suave:
  - Fade + leve zoom-in (ex.: 1.02 → 1.00) e blur mínimo removendo.
  - Entrada sincronizada com o stagger do bloco (para parecer “editado”, não “UI”).

E) CTAs premium (hover + press + shine discreto)
- Manter o visual do `.invictus-cta` e adicionar micro-interação:
  - Hover: já existe; vou refinar com transição mais “soft”.
  - Active/press: leve “press down” (translateY 1px) e redução mínima de brilho.
  - Opcional: “sheen” muito sutil no hover (um highlight diagonal que se move) — controlado para não virar efeito chamativo.

Arquivos que vou mexer
1) `src/hooks/useRevealOnScroll.ts`
- Ajustar lógica para:
  - Melhor timing no desktop (rootMargin/threshold default melhores para landing).
  - Aplicar `setVisible(true)` com micro-delay quando intersecta (evitar “sem animação”).
  - Expor uma opção tipo `enterDelayMs` (default pequeno, ex.: 30–60ms) para seções muito acima da dobra não “piscar”.

2) `src/components/landing/SectionShell.tsx`
- Ajustar as opções do hook (ex.: threshold mais alto no desktop).
- Garantir que o container do painel (e header) use classes do novo motion CSS (ex.: `invictus-reveal`), além do `invictus-revealed`.

3) `src/components/landing/EditorialMedia.tsx`
- Aplicar um reveal próprio para a mídia (hook + classes), respeitando reduced motion.
- Manter fallback e props atuais (sem quebrar chamadas existentes).

4) `src/styles/invictus-auth.css`
- Adicionar/ajustar:
  - Classes de reveal (`.invictus-reveal-enter`, `.invictus-revealed ...`) com transições suaves.
  - Refinar `invictus-stagger` (timing/easing/delays).
  - Micro-interações de CTA (hover/active/sheeen opcional).
  - Garantir bloco `@media (prefers-reduced-motion: reduce)` cobrindo tudo.

Checklist de validação (o que você vai conseguir testar no Preview)
- Desktop:
  - Ao descer, cada seção aparece com fade + leve slide (perceptível).
  - Dentro de cada seção, cards/bullets entram em sequência (stagger “chique”, sem parecer template).
  - As fotos entram suave (sem “pulo” e sem parecer “efeito de PowerPoint”).
  - CTAs têm hover premium e “press” ao clicar.
- Mobile:
  - Animações continuam leves (sem travar e sem blur pesado).
  - Nada vira “bagunça” — tudo entra organizado.
- Preferências do sistema:
  - Se “reduzir movimento” estiver ativado, tudo aparece sem animação (acessibilidade).

Riscos / cuidados
- Performance: blur/filters em excesso podem pesar; vou usar blur mínimo (ou remover em mobile) e manter durations curtas.
- “Sem animação no desktop”: mitigado com threshold/rootMargin + micro-delay para garantir que o browser veja o estado inicial.
- Consistência: mudanças isoladas na landing (CSS prefixado `invictus-...`), sem afetar o app interno.

Entrega incremental (para você validar rápido)
1) Ajustar hook + SectionShell (você já deve ver as seções “entrarem” no desktop).
2) Stagger interno refinado (cards e listas entram em sequência com mais “luxo”).
3) EditorialMedia com entrada premium.
4) CTAs com micro press + sheen sutil no hover.
