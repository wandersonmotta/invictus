
# Ajustes na Landing Page -- Logo, Cor Dourada e Counter

## 1. Logo maior na cortina de abertura

A logo atualmente usa `w-20` (80px) no mobile e `w-24` (96px) no desktop. Vou aumentar para `w-32` (128px) no mobile e `w-40` (160px) no desktop, mantendo responsividade com breakpoints intermediarios.

**Arquivo**: `src/components/landing/HeroIntro.tsx`
- Classe da img: `w-20 sm:w-24` passa para `w-32 sm:w-36 md:w-40`
- O texto "FRATERNIDADE" mantem o mesmo tamanho (`text-xs tracking-[0.35em]`)

## 2. Texto "FRATERNIDADE" com cor dourada

Trocar a cor de `text-foreground/80` para o gradiente dourado da identidade visual, usando `background-clip: text` com o gradiente primary da marca.

**Arquivo**: `src/components/landing/HeroIntro.tsx`
- Remover `text-foreground/80`
- Aplicar estilo inline com gradiente dourado (`linear-gradient` usando as cores primary do tema) e `background-clip: text` / `color: transparent`

## 3. Corrigir AnimatedNumber nos depoimentos

O counter nao esta disparando porque o `useRevealOnScroll` com `disableClasses: true` funciona corretamente para `visible`, mas o `rootMargin: "0px 0px -10% 0px"` combinado com a posicao da secao no final da pagina pode nao intersectar adequadamente. Vou ajustar para usar `rootMargin: "0px"` e `threshold: 0.1` para garantir que o counter dispare quando a secao de depoimentos entrar na viewport.

**Arquivo**: `src/components/landing/TestimonialsSection.tsx`
- Ajustar `rootMargin` para `"0px 0px 0px 0px"` e `threshold` para `0.1`
- Remover `enterDelayMs` que pode estar atrasando o trigger

## Detalhes tecnicos

Apenas 2 arquivos serao modificados:
- `src/components/landing/HeroIntro.tsx` -- Logo maior + texto dourado
- `src/components/landing/TestimonialsSection.tsx` -- Fix do counter
