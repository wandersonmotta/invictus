
# Plano: Ajustes Corretivos de Respiro Visual (Preservando Identidade)

## Princípio Fundamental

**PRESERVAR INTEGRALMENTE:** tema dark premium, paleta grafite + dourado, tipografia, logotipo, imagens, efeitos glass/metal, narrativa e DNA editorial. 

**AJUSTAR APENAS:** espaçamentos e respiro entre blocos escuros consecutivos para melhorar conforto visual sem alterar identidade.

---

## Diagnóstico Visual Atual

Após análise do código e screenshots, identifiquei pontos específicos de densidade excessiva:

### 1. Landing Page - Seções consecutivas muito próximas
- `SectionShell` usa `py-10 sm:py-14` entre seções
- Em telas maiores, os painéis de `invictus-landing-panel` ficam muito próximos
- O respiro atual é adequado para mobile, mas insuficiente em desktop

### 2. Páginas internas (Home, Perfil) - Cards empilhados sem respiro
- `.invictus-page` usa `space-y-4 sm:space-y-6` 
- Cards com `.invictus-surface .invictus-frame` muito próximos verticalmente
- Em mobile, densidade é perceptível

### 3. Repetição de moldura dourada em proximidade
- Seções `FinalWarning` e `WaitlistHero` ambas usam `invictus-auth-frame` (moldura dourada forte)
- Ficam em sequência, criando "excesso de borda dourada" num trecho curto

---

## Ajustes Propostos (Mínimos e Cirúrgicos)

### Arquivo: `src/styles/invictus-auth.css`

**Ajuste 1:** Aumentar respiro entre painéis da landing em desktop
```css
/* Antes */
.invictus-landing-panel {
  padding: 1.5rem;
}
@media (min-width: 640px) {
  .invictus-landing-panel {
    padding: 2rem;
  }
}

/* Depois - adicionar mais respiro interno em desktop grande */
@media (min-width: 1024px) {
  .invictus-landing-panel {
    padding: 2.25rem 2.5rem;
  }
}
```

### Arquivo: `src/components/landing/SectionShell.tsx`

**Ajuste 2:** Aumentar espaçamento entre seções em desktop
```tsx
// Antes
className="... px-4 py-10 sm:px-6 sm:py-14 ..."

// Depois - adicionar breakpoint lg para respiro extra
className="... px-4 py-10 sm:px-6 sm:py-14 lg:py-16 xl:py-20 ..."
```

### Arquivo: `src/index.css`

**Ajuste 3:** Melhorar espaçamento de páginas internas
```css
/* Antes */
.invictus-page {
  @apply space-y-4 sm:space-y-6;
}

/* Depois - adicionar respiro em desktop */
.invictus-page {
  @apply space-y-4 sm:space-y-6 lg:space-y-8;
}
```

### Arquivo: `src/components/landing/ManifestoSections.tsx`

**Ajuste 4:** Suavizar moldura dourada do `FinalWarning` para evitar repetição
```tsx
// Antes - FinalWarning usa invictus-auth-frame (borda dourada forte)
<Card className="invictus-auth-surface invictus-auth-frame border-0 p-6 sm:p-8">

// Depois - usar invictus-frame (mais sutil) ou adicionar classe modificadora
<Card className="invictus-auth-surface invictus-frame border-0 p-6 sm:p-8">
```

Isso diferencia visualmente o "Aviso Final" da "Lista de Espera" que vem logo abaixo, evitando duas molduras douradas fortes em sequência.

### Arquivo: `src/components/AppLayout.tsx`

**Ajuste 5:** Adicionar um pouco mais de padding no conteúdo principal em mobile
```tsx
// Antes
<div className="flex-1 p-4 sm:p-5 md:p-6 animate-fade-in">{children}</div>

// Depois
<div className="flex-1 p-4 pb-6 sm:p-5 sm:pb-8 md:p-6 animate-fade-in">{children}</div>
```

---

## O Que NÃO Será Alterado

| Elemento | Status |
|----------|--------|
| Paleta dark grafite (#7%→#18%) | Mantida |
| Gradiente dourado (gold-hot, gold-soft) | Mantido |
| Tipografia e tamanhos de fonte | Mantidos |
| Logo e branding "FRATERNIDADE" | Mantidos |
| Efeitos glassmorphism e metal | Mantidos |
| Animações de reveal e stagger | Mantidas |
| Imagens editoriais coloridas | Mantidas |
| Background cinematográfico B&W | Mantido |
| Hover "Pull Forward" nos cards | Mantido |

---

## Resumo de Arquivos

| Arquivo | Tipo de Mudança |
|---------|-----------------|
| `src/styles/invictus-auth.css` | Adicionar media query para padding extra em lg+ |
| `src/components/landing/SectionShell.tsx` | Adicionar classes `lg:py-16 xl:py-20` |
| `src/index.css` | Adicionar `lg:space-y-8` ao `.invictus-page` |
| `src/components/landing/ManifestoSections.tsx` | Trocar `invictus-auth-frame` por `invictus-frame` no FinalWarning |
| `src/components/AppLayout.tsx` | Adicionar padding-bottom extra em mobile |

---

## Validação

Após implementação, o site deve:
- Parecer o MESMO visualmente (identidade, tom, cores)
- Ter melhor "respiro" entre blocos escuros
- Manter toda a sofisticação e impacto premium
- Não ter nenhum elemento novo, cor nova ou estilo diferente

Se qualquer ajuste alterar a percepção de identidade, será revertido.
