
# Plano: Otimização de Responsividade da Seção de Depoimentos

## Problemas Identificados

Analisando a seção de depoimentos em diferentes viewports, identifiquei os seguintes problemas:

### Desktop (xl: 4 colunas)
- O depoimento do **Lucas** é muito mais longo que os outros (menciona produtos, serviços, R$ 10 mil, etc.)
- Isso causa **altura desigual** entre os cards, quebrando o alinhamento visual
- O card do Lucas "estica" verticalmente enquanto os outros ficam menores

### Mobile (1 coluna)
- O texto do Lucas ocupa muito espaço vertical
- Falta refinamento no tamanho da fonte e espaçamentos para telas pequenas
- Os cards podem parecer "pesados" com textos longos

### Tablet (md: 2 colunas)
- Mesma questão de alturas desiguais entre pares de cards

## Soluções Propostas

### 1. Equalizar tamanhos dos textos

Ajustar os depoimentos para terem comprimentos mais similares, mantendo a essência:

**Antes (Lucas - 54 palavras):**
> "Dentro da Invictus encontrei produtos e serviços que mudaram minha vida. Em apenas 1 mês, com disciplina e fazendo o que tinha que ser feito, ganhei mais de R$ 10 mil. Aqui o resultado é questão de tempo pra quem executa."

**Depois (Lucas - ~35 palavras):**
> "Dentro da Invictus encontrei produtos e serviços que mudaram minha vida. Em apenas 1 mês, ganhei mais de R$ 10 mil. Disciplina e execução. Aqui o resultado é questão de tempo."

### 2. Melhorar CSS do grid

```text
Atual:    grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-4
Proposto: grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-4 [com min-height nos cards]
```

- Adicionar `min-h-[240px]` ou usar `grid-rows-subgrid` para equalizar alturas
- Ajustar `flex-1` no blockquote para preencher espaço disponível uniformemente

### 3. Responsividade de tipografia

Melhorar a hierarquia tipográfica mobile-first:

| Elemento | Mobile | Desktop |
|----------|--------|---------|
| Quote text | `text-sm leading-relaxed` | `sm:text-base` |
| Author name | `text-sm` | OK |
| Author role | `text-xs` | OK |

### 4. Otimizar espaçamentos

| Propriedade | Atual | Proposto |
|-------------|-------|----------|
| Padding card | `p-5 sm:p-6` | `p-4 sm:p-5 lg:p-6` (mais compacto em mobile) |
| Gap grid | `gap-4 sm:gap-5` | `gap-3 sm:gap-4 lg:gap-5` |
| Gap interno card | `gap-4` | `gap-3 sm:gap-4` |

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/landing/TestimonialsSection.tsx` | Ajustar textos, classes de grid e espaçamentos |

## Mudanças Técnicas

```tsx
// Grid com altura mínima consistente
<div className="grid gap-3 sm:gap-4 lg:gap-5 md:grid-cols-2 xl:grid-cols-4">
  {testimonials.map((t, i) => (
    <article
      className="invictus-landing-card invictus-landing-card--lift 
                 group relative flex min-h-[220px] flex-col gap-3 
                 p-4 sm:gap-4 sm:p-5 lg:p-6"
    >
      {/* ... */}
    </article>
  ))}
</div>
```

## Resultado Esperado

```text
Mobile (1 col)
┌────────────────────────┐
│  "Depoimento curto..." │
│  [👤] Ricardo M.       │
└────────────────────────┘
┌────────────────────────┐
│  "Depoimento curto..." │
│  [👤] Camila S.        │
└────────────────────────┘
┌────────────────────────┐
│  "Depoimento curto..." │
│  [👤] Bruno F.         │
└────────────────────────┘
┌────────────────────────┐
│  "Depoimento curto..." │
│  [👤] Lucas P.         │
└────────────────────────┘

Desktop (4 cols) - Alturas equalizadas
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│              │ │              │ │              │ │              │
│  Ricardo     │ │  Camila      │ │  Bruno       │ │  Lucas       │
│              │ │              │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
     ↑ Mesma altura visual em todos os cards
```

## Considerações de Performance

- Mantém `content-visibility: auto` já aplicado via `.invictus-landing-card`
- Sem adição de novas animações ou efeitos pesados
- Apenas refinamento de classes Tailwind existentes
