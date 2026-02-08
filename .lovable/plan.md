

# Ajustes: Logo Maior na Cortina + Barra Dourada no Mobile

## 1. Logo maior na cortina de abertura

A logo atual usa `w-32` (128px) no mobile e `w-40` (160px) no desktop. Ainda esta pequena para o impacto cinematografico desejado. Vou aumentar significativamente:

- Mobile: `w-44` (176px)
- Tablet: `w-52` (208px)  
- Desktop: `w-60` (240px)

O drop-shadow dourado tambem sera intensificado para acompanhar o tamanho maior.

**Arquivo**: `src/components/landing/HeroIntro.tsx`
- Linha 49: classe `w-32 sm:w-36 md:w-40` passa para `w-44 sm:w-52 md:w-60`

## 2. Barra dourada de scroll (ScrollProgress) no mobile

A barra dourada no topo da pagina que acompanha o scroll nao esta aparecendo no mobile. O problema e que com apenas `2px` de altura, ela fica praticamente invisivel em telas de alta densidade (retina). Alem disso, o `z-50` pode estar sendo coberto por outros elementos fixos.

**Correcoes** no `src/components/landing/ScrollProgress.tsx`:
- Aumentar altura de `h-[2px]` para `h-[3px]` (mais visivel em telas retina)
- Aumentar z-index para `z-[60]` para garantir que fique acima de tudo
- Adicionar uma sombra dourada (`box-shadow`) para dar mais presenca visual

## Detalhes tecnicos

Apenas 2 arquivos modificados:
- `src/components/landing/HeroIntro.tsx` -- Logo maior
- `src/components/landing/ScrollProgress.tsx` -- Barra visivel no mobile

