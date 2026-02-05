

## Plano: Fixar Top Bar Durante Scroll Horizontal dos Cards

### Problema Identificado

O container dos cards no desktop usa:
```css
-mx-4 px-4 overflow-x-auto
```

Esse `-mx-4` faz o container "vazar" para fora do seu pai, criando um scroll horizontal que afeta a visualização do header. O header está `sticky top-0`, que funciona para scroll **vertical**, mas o scroll horizontal do container filho está causando o deslocamento visual.

---

### Causa Técnica

```text
┌──────────────────────────────────────────────┐
│ SidebarInset (main)                          │
│ ┌──────────────────────────────────────────┐ │
│ │ Header (sticky top-0)                    │ │ ← Sticky no eixo Y
│ └──────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────┐ │
│ │ Content div                              │ │
│ │ ┌────────────────────────────────────────┼─┼──► Cards com -mx-4
│ │ │ Cards container (overflow-x-auto)      │ │    vazando para fora
│ │ └────────────────────────────────────────┼─┘
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

Quando o usuário faz scroll horizontal nos cards, o container pai também pode ser afetado devido ao "vazamento" do `-mx-4`.

---

### Solução

Remover o `-mx-4` do container de scroll horizontal e usar uma abordagem que não vaze para fora do container:

**Arquivo:** `src/pages/Reconhecimento.tsx`

**Antes:**
```tsx
<div className="-mx-4 px-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 scrollbar-hide">
```

**Depois:**
```tsx
<div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide -mr-4 pr-4">
```

Ou, melhor ainda, encapsular os cards em um container que tenha `overflow-x-auto` sem usar margens negativas:

```tsx
<div className="w-full overflow-hidden">
  <div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-3">
    <div className="flex gap-6 min-w-max pl-0 pr-4">
      {/* Cards */}
    </div>
  </div>
</div>
```

---

### Mudanças Específicas

#### `src/pages/Reconhecimento.tsx`

Linha 43-44, trocar:

```tsx
{/* Desktop: Horizontal scroll container with larger cards */}
<div className="-mx-4 px-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 scrollbar-hide">
  <div className="flex gap-6 min-w-max pb-3">
```

Por:

```tsx
{/* Desktop: Horizontal scroll container with larger cards */}
<div className="w-full overflow-hidden">
  <div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-3">
    <div className="flex gap-6 min-w-max pr-4">
```

E fechar corretamente:

```tsx
    </div>
  </div>
</div>
```

---

### Resultado Esperado

```text
┌──────────────────────────────────────────────┐
│ SidebarInset (main)                          │
│ ┌──────────────────────────────────────────┐ │
│ │ Header (sticky top-0) - FIXO             │ │ ← Não se move mais
│ └──────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────┐ │
│ │ Content div                              │ │
│ │ ┌──────────────────────────────────────┐ │ │
│ │ │ overflow-hidden wrapper              │ │ │
│ │ │ ┌──────────────────────────────────┐ │ │ │
│ │ │ │ Cards (overflow-x-auto) ──────►  │ │ │ │ ← Scroll contido
│ │ │ └──────────────────────────────────┘ │ │ │
│ │ └──────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

1. **Top bar permanece fixo** durante scroll horizontal dos cards
2. **Cards ainda têm scroll horizontal** no desktop
3. **Layout mobile não é afetado** (já usa scroll vertical)

---

### Arquivo a Modificar

```text
src/pages/Reconhecimento.tsx
```

