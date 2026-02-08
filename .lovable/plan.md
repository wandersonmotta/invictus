

# Upgrade Premium da Landing Page -- Animacoes e Identidade Visual

## Diagnostico Atual

Analisei cada componente da landing e o sistema de animacoes. O que ja existe e bom:
- Reveal on scroll com IntersectionObserver
- Stagger lateral nos cards (slide da direita)
- LED glow nos icones
- Hover "pull forward" (3D lift) nos cards
- Sheen no CTA (brilho deslizante no hover)
- GoldHoverText (gradiente dourado seguindo o mouse)

## O que FALTA para ser premium de verdade

Hoje a landing tem cara de "template bonito" porque:
1. A topbar aparece de forma plana, sem cerimonia
2. O titulo principal nao tem entrada cinematografica (simplesmente aparece)
3. As secoes todas usam o MESMO reveal (fade-up) -- monotono
4. Nao existe parallax sutil entre camadas (fundo vs conteudo)
5. Cards nao reagem ao mouse (nao "olham" pra voce)
6. Nao existe uma "cortina de abertura" -- a pagina simplesmente carrega
7. Textos longos nao revelam linha a linha -- aparecem de bloco
8. O separador dourado e estatico -- poderia "acender" ao scroll
9. O footer aparece sem cerimonia

## Plano de Melhorias (7 upgrades)

### 1. Cortina de Abertura (Hero Cinematic Intro)
Ao carregar a pagina, o logo aparece centralizado com fade + scale sutil, depois desliza pra cima enquanto o conteudo do Manifesto sobe por baixo. Dura ~1.2s. Elegante, sem exagero.

**Onde**: Novo componente `HeroIntro` + CSS keyframes
**Efeito**: Logo fade-in com scale 0.92->1.0, depois translateY para posicao final na topbar

### 2. Tilt 3D nos Cards (Mouse Tracking)
Quando o mouse passa sobre os cards de pilares/depoimentos, o card inclina suavemente na direcao do cursor (perspective + rotateX/Y). Efeito sutil de 3-5 graus, nao exagerado.

**Onde**: Novo hook `useTilt3D` aplicado nos cards
**Performance**: Usa requestAnimationFrame, desabilitado no mobile

### 3. Parallax Suave entre Camadas
O background se move ~20% mais devagar que o conteudo ao scrollar, criando profundidade. Implementado com CSS transform no scroll (nao background-attachment: fixed que causa problemas).

**Onde**: Hook `useParallax` aplicado no `LandingBackground`
**Performance**: CSS transform com will-change, throttled via rAF

### 4. Texto Revelando Linha a Linha (Split Text Reveal)
Os paragrafos principais do Manifesto revelam cada linha com um leve delay, criando efeito de "texto sendo escrito/revelado". Apenas nas 2-3 primeiras secoes para nao cansar.

**Onde**: Novo componente `RevealText` que envolve paragrafos-chave
**Efeito**: Cada linha com opacity 0->1 + translateY(8px) com 80ms de delay entre elas

### 5. Separador Dourado Animado
O separador entre titulo e conteudo de cada secao "acende" da esquerda pra direita quando a secao entra na viewport, como uma linha de luz se propagando.

**Onde**: CSS animation no `.invictus-section-separator` dentro de `.invictus-revealed`
**Efeito**: scaleX(0)->scaleX(1) com origin left, 800ms ease-out

### 6. Topbar com Blur Progressivo ao Scroll
A topbar comeca transparente e vai ganhando backdrop-blur + borda sutil conforme o usuario scrolla. Sticky com transicao suave.

**Onde**: Atualizar `LandingTopbar` com hook de scroll position
**Efeito**: Sticky top-0 com backdrop-blur crescente (0->20px) e borda bottom aparecendo

### 7. Numero Contando (Counter) nos Depoimentos
Quando a secao de depoimentos entra na viewport, numeros como "R$ 10 mil" fazem um count-up animado rapido. Cria impacto visual.

**Onde**: Novo componente `AnimatedNumber` usado no texto do Lucas P.
**Efeito**: Contagem de 0 ate 10.000 em ~1.5s com easing

## Detalhes Tecnicos

### Arquivos que serao CRIADOS
- `src/hooks/useTilt3D.ts` -- Hook de inclinacao 3D por mouse tracking
- `src/hooks/useParallax.ts` -- Hook de parallax suave no scroll
- `src/components/landing/HeroIntro.tsx` -- Cortina de abertura cinematografica
- `src/components/landing/RevealText.tsx` -- Texto revelando linha a linha
- `src/components/landing/AnimatedNumber.tsx` -- Counter animado
- `src/components/landing/StickyTopbar.tsx` -- Wrapper da topbar com blur progressivo

### Arquivos que serao MODIFICADOS
- `src/styles/invictus-auth.css` -- Novos keyframes (separador animado, cortina)
- `src/pages/Landing.tsx` -- Integrar HeroIntro e StickyTopbar
- `src/components/landing/ManifestoSections.tsx` -- Aplicar RevealText, tilt nos cards
- `src/components/landing/TestimonialsSection.tsx` -- Tilt nos cards, AnimatedNumber
- `src/components/landing/SectionShell.tsx` -- Separador animado
- `src/components/landing/LandingTopbar.tsx` -- Refatorar para usar StickyTopbar
- `src/components/landing/LandingBackground.tsx` -- Integrar parallax

### Sem dependencias externas
Tudo feito com CSS puro + hooks React. Zero bibliotecas novas.

### Performance
- Todos os efeitos usam `transform` e `opacity` (GPU accelerated)
- Mobile: tilt 3D e parallax desabilitados automaticamente
- `prefers-reduced-motion`: todos os efeitos desabilitados
- `will-change` aplicado apenas durante a animacao

### Ordem de implementacao
1. Cortina de abertura (impacto imediato)
2. Topbar sticky com blur
3. Separador animado
4. Tilt 3D nos cards
5. Parallax no background
6. RevealText nos paragrafos
7. Counter nos depoimentos

