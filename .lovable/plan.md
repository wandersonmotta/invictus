
# Plano: Otimização de Performance + Menu Mobile em Tablets

## Visão Geral

Este plano aborda duas frentes principais:
1. **Correção do breakpoint mobile**: incluir tablets/iPads no mesmo comportamento de celulares
2. **Otimizações de performance**: técnicas para tornar o site mais fluido e rápido em todos os dispositivos

---

## Parte 1: Unificar Menu Mobile para Tablets e Celulares

### Problema Atual

O hook `useIsMobile()` usa breakpoint de **768px** (padrão Tailwind `md`), que classifica:
- **< 768px** → mobile (celulares)
- **≥ 768px** → desktop (inclui tablets!)

Isso faz com que iPads (768–1024px) e tablets Android (800–1280px) mostrem a sidebar desktop ao invés do menu mobile flutuante.

### Solução

Criar um novo hook `useIsMobileOrTablet()` com breakpoint de **1024px** (padrão Tailwind `lg`) para navegação, mantendo `useIsMobile()` para outros usos onde a distinção celular/tablet importa.

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/use-mobile.tsx` | Adicionar `useIsMobileOrTablet()` com breakpoint 1024px |
| `src/components/mobile/MobileBottomNav.tsx` | Usar `useIsMobileOrTablet()` ao invés de `useIsMobile()` |
| `src/components/AppLayout.tsx` | Usar `useIsMobileOrTablet()` para padding bottom |
| `src/components/ui/sidebar.tsx` | Ajustar para usar breakpoint 1024px no modo sheet |
| CSS classes | Trocar `md:hidden` por `lg:hidden` nos componentes de navegação mobile |

### Código do Novo Hook

```tsx
// src/hooks/use-mobile.tsx

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useIsMobile() {
  // ... código existente (< 768px)
}

export function useIsMobileOrTablet() {
  const [isMobileOrTablet, setIsMobileOrTablet] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobileOrTablet(window.innerWidth < TABLET_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobileOrTablet(window.innerWidth < TABLET_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobileOrTablet;
}
```

---

## Parte 2: Otimizações de Performance

### 2.1 CSS Crítico e Redução de Imports

**Problema:** O arquivo `index.css` importa todos os estilos na raiz, mesmo os que só são usados em rotas específicas.

**Solução:** Manter a estrutura atual mas adicionar `content-visibility` para componentes pesados.

```css
/* Adicionar em index.css */
.invictus-surface,
.invictus-frame {
  content-visibility: auto;
  contain-intrinsic-size: auto 200px;
}
```

### 2.2 Preload de Fontes Críticas

**Arquivo:** `index.html`

Adicionar preconnect para CDNs e preload de recursos críticos:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
<link rel="dns-prefetch" href="https://wotwxzolgnsmzjpposua.supabase.co" />
```

### 2.3 Otimização do GoldHoverText

**Problema:** O componente `GoldHoverText` re-renderiza a cada movimento de mouse, causando micro-lags.

**Solução:** Usar throttle no `onMouseMove` para limitar atualizações a ~60fps.

```tsx
// src/components/GoldHoverText.tsx
import { useCallback, useRef } from "react";

// Throttle simples inline (sem dependência extra)
const useThrottle = (callback: (...args: any[]) => void, delay: number) => {
  const lastCall = useRef(0);
  return useCallback((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      callback(...args);
    }
  }, [callback, delay]);
};

// No componente:
const throttledUpdate = useThrottle(updateFromEvent, 16); // ~60fps
```

### 2.4 Memoização de Componentes Pesados

**Arquivos a otimizar:**

| Componente | Técnica |
|------------|---------|
| `FeedPostCard` | Envolver com `React.memo()` |
| `ThreadList` items | Memoizar cada item da lista |
| `MobileMenuSheet` | Memoizar lista de itens de navegação |
| `AppSidebar` | Memoizar seções de navegação |

### 2.5 Lazy Loading de Imagens

**Problema:** Avatares e imagens do feed carregam todas de uma vez.

**Solução:** Adicionar `loading="lazy"` em componentes de imagem não-críticos.

```tsx
// Em Avatar e imagens de mídia
<img loading="lazy" decoding="async" ... />
```

### 2.6 Otimização de Backdrop Blur

**Problema:** `backdrop-filter: blur()` é caro em dispositivos mobile.

**Solução:** Reduzir intensidade do blur em mobile e usar `will-change` estrategicamente.

```css
/* Em invictus-mobile-nav.css */
@media (max-width: 1023px) {
  .invictus-mobile-nav {
    backdrop-filter: blur(16px) saturate(150%); /* reduzido de 24px */
  }
  
  .invictus-surface {
    backdrop-filter: blur(12px); /* reduzido de 18-20px */
  }
}
```

### 2.7 Skeleton Loading States

**Melhoria de UX:** Adicionar skeletons durante carregamento ao invés de textos "Carregando…".

```tsx
// Em Feed.tsx e ThreadList.tsx
{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-32 w-full rounded-xl" />
  </div>
) : ...}
```

### 2.8 Precarregamento Inteligente

**Já implementado:** O `App.tsx` já usa `requestIdleCallback` para pré-carregar rotas.

**Melhoria:** Adicionar preload on hover para navegação:

```tsx
// Em NavLink.tsx ou AppSidebar
onMouseEnter={() => {
  // Precarrega a rota ao passar o mouse
  if (item.url === "/mapa") import("@/pages/Index");
  if (item.url === "/feed") import("@/pages/Feed");
}}
```

---

## Parte 3: Ajustes de Breakpoints CSS

### Antes (md = 768px)
```css
.invictus-mobile-nav { ... md:hidden }
sidebar { ... md:block }
```

### Depois (lg = 1024px)
```css
.invictus-mobile-nav { ... lg:hidden }
sidebar { ... lg:block }
```

### Arquivos CSS a Ajustar

| Arquivo | Mudança |
|---------|---------|
| `src/components/mobile/MobileBottomNav.tsx` | `md:hidden` → `lg:hidden` |
| `src/components/ui/sidebar.tsx` | Linha 198: `md:block` → `lg:block` |
| `src/components/ui/sidebar.tsx` | Linha 201: `md:flex` → `lg:flex` |
| `src/styles/invictus-mobile-nav.css` | Verificar media queries |

---

## Resumo de Arquivos a Modificar

| Arquivo | Tipo | Mudança Principal |
|---------|------|-------------------|
| `src/hooks/use-mobile.tsx` | Modificar | Adicionar `useIsMobileOrTablet()` |
| `src/components/mobile/MobileBottomNav.tsx` | Modificar | Usar novo hook + `lg:hidden` |
| `src/components/AppLayout.tsx` | Modificar | Usar novo hook para padding |
| `src/components/ui/sidebar.tsx` | Modificar | Ajustar breakpoints para 1024px |
| `src/components/GoldHoverText.tsx` | Modificar | Throttle no mousemove |
| `src/components/feed/FeedPostCard.tsx` | Modificar | Envolver com `React.memo()` |
| `src/index.css` | Modificar | Adicionar `content-visibility` |
| `src/styles/invictus-mobile-nav.css` | Modificar | Reduzir blur em mobile |
| `index.html` | Modificar | Adicionar preconnect/dns-prefetch |

---

## Resultado Esperado

1. **Tablets/iPads** → Menu mobile flutuante + sheet (igual celular)
2. **Desktop (≥1024px)** → Sidebar fixa tradicional
3. **Transições** → Mais fluidas (blur reduzido em mobile)
4. **Carregamento** → Mais rápido (preloads + memoização)
5. **Interações** → Sem micro-lags (throttle no GoldHoverText)
6. **UX** → Skeletons durante loading (opcional, melhoria futura)

---

## Testes a Realizar

1. Abrir em iPad (768x1024) → deve mostrar menu mobile flutuante
2. Abrir em tablet Android (800x1280) → deve mostrar menu mobile flutuante
3. Abrir em notebook (1366x768) → deve mostrar sidebar desktop
4. Medir Lighthouse score antes e depois
5. Testar transições de tema no mobile
6. Verificar que hover no texto dourado (topbar) não causa lag
7. Navegar entre rotas e verificar fluidez
