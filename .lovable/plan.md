

## Plano: Correção do Layout Mobile - Cards Compactos e Responsivos

O problema identificado: no mobile, os cards estão ocupando 100% da largura da tela (`w-full`) combinado com aspect ratio 4:5, criando cards gigantes que tomam quase toda a altura da tela.

---

### Problema Visual Atual

```text
Mobile (390x844):
+------------------------+
| Header                 |
+------------------------+
|                        |
|   [Card Bronze         |
|    ocupando            |
|    praticamente        |
|    toda a tela]        |
|                        |
|                        |
+------------------------+
| Nav                    |
+------------------------+
```

---

### Solução: Cards Horizontais Compactos

Em vez de cards verticais gigantes, vou usar um **layout horizontal compacto** no mobile:

```text
Mobile (390x844):
+------------------------+
| Header                 |
+------------------------+
| +--------------------+ |
| | [Img] Bronze       | |  <- Card horizontal
| |       100 pts      | |
| +--------------------+ |
| +--------------------+ |
| | [Img] Silver       | |
| |       500 pts      | |
| +--------------------+ |
| +--------------------+ |
| | [Img] Gold         | |
| |       1.000 pts    | |
| +--------------------+ |
| ... mais cards ...     |
+------------------------+
```

---

### Arquivos a Modificar

#### 1. `src/components/reconhecimento/RecognitionCard.tsx`

**Mudanças principais:**

1. Adicionar prop `compact` para layout horizontal compacto
2. No modo compacto:
   - Layout flex horizontal (imagem à esquerda, conteúdo à direita)
   - Imagem com tamanho fixo (80x100px aproximadamente)
   - Altura controlada do card

```typescript
interface RecognitionCardProps {
  level: RecognitionLevel;
  isCurrentLevel?: boolean;
  isAchieved?: boolean;
  isFuture?: boolean;
  /** Compact horizontal layout for mobile */
  compact?: boolean;
}
```

**Estrutura do card compacto:**

```tsx
{compact ? (
  // Layout horizontal compacto
  <article className="flex gap-3 w-full h-[100px] rounded-xl ...">
    {/* Imagem pequena à esquerda */}
    <div className="w-20 h-full shrink-0 rounded-l-xl overflow-hidden">
      <img ... />
    </div>
    
    {/* Conteúdo à direita */}
    <div className="flex-1 py-2 pr-3">
      <h3>Member Bronze</h3>
      <p>Adicione 3 pessoas</p>
      <Badge>100 pts</Badge>
    </div>
  </article>
) : (
  // Layout vertical original para desktop
  <article className="w-[clamp(200px,50vw,280px)] ...">
    ...
  </article>
)}
```

#### 2. `src/pages/Reconhecimento.tsx`

**Mudanças:**

Passar `compact={true}` para cards no mobile em vez de `fullWidth`:

```typescript
{isMobileOrTablet ? (
  <div className="flex flex-col gap-3">
    {recognitionLevels.map((level, index) => (
      <RecognitionCard
        key={level.id}
        level={level}
        isCurrentLevel={index === currentLevelIndex}
        isAchieved={index < currentLevelIndex}
        isFuture={index > currentLevelIndex}
        compact  // <-- Layout horizontal compacto
      />
    ))}
  </div>
) : (
  // Desktop mantém horizontal scroll com cards verticais grandes
  ...
)}
```

---

### Especificações do Card Compacto

| Elemento | Valor |
|----------|-------|
| Altura total | 100px |
| Largura imagem | 80px (aspect 4:5 respeitado) |
| Gap | 12px (gap-3) |
| Padding conteúdo | py-2 pr-3 |
| Fonte título | text-sm font-semibold |
| Fonte descrição | text-xs text-muted-foreground |
| Badge | text-[10px] |

---

### Destaque do Nível Atual (Compacto)

No modo compacto, a borda dourada vai envolver todo o card horizontal:

```text
+----[DOURADO]-------------+
| [Img] Bronze   SEU NÍVEL |
|       100 pts            |
+---------------------------+
```

---

### Resultado Esperado

1. **Mobile/Tablet**: Cards horizontais compactos (~100px altura cada)
   - Todos os 6 níveis visíveis com scroll mínimo
   - Imagem da placa visível à esquerda
   - Informações legíveis à direita
   - Nível atual com destaque dourado

2. **Desktop**: Mantém layout atual com scroll horizontal e cards verticais grandes

3. **Responsivo**: Transição suave entre layouts sem quebras

---

### Resumo de Arquivos

```text
Modificar:
- src/components/reconhecimento/RecognitionCard.tsx (adicionar modo compact)
- src/pages/Reconhecimento.tsx (usar compact no mobile)
```

