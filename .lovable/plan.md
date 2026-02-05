

## Plano: Member Diamond + Cards Maiores + Layout Mobile Vertical

Vou implementar as melhorias solicitadas na pagina de Reconhecimento.

---

### Resumo das Alteracoes

1. **Novo nivel Member Diamond** - R$ 1 milhao em resultados, 12.000 pontos
2. **Cards maiores** - Aumentar tamanho para melhor visualizacao das placas
3. **Correcao do efeito hover** - Borda dourada nao vai mais sumir no topo
4. **Layout mobile/tablet vertical** - Scroll de cima para baixo em vez de horizontal

---

### Arquivos a Modificar

#### 1. `src/components/reconhecimento/recognitionLevels.ts`

Adicionar novo nivel Diamond:

```text
{
  id: "diamond",
  name: "Member Diamond",
  description: "Acumule R$ 1 milhao em resultados",
  requirement: "R$ 1 milhao",
  points: 12000,
  gradient: "from-cyan-300 via-blue-200 to-cyan-400",
  accent: "bg-cyan-400",
  imageUrl: undefined  // Sera gerado depois
}
```

#### 2. `src/components/reconhecimento/RecognitionCard.tsx`

**Aumentar tamanho do card:**
- Desktop: de `clamp(140px,42vw,188px)` para `clamp(200px,50vw,280px)`
- Aspect ratio maior para destacar a placa

**Corrigir efeito hover da borda dourada:**
- Problema atual: `overflow-hidden` esta cortando a borda (ring)
- Solucao: Remover `overflow-hidden` do container principal e aplicar apenas na area da imagem
- Ajustar `ring-offset` para nao ser cortado

```text
// Antes (problema)
className="... overflow-hidden ..."
isCurrentLevel && "ring-2 ring-primary ring-offset-2 ..."

// Depois (corrigido)
className="... overflow-visible ..."
// Overflow hidden apenas no container da imagem
```

#### 3. `src/pages/Reconhecimento.tsx`

**Layout responsivo diferenciado:**
- Desktop (lg+): Manter scroll horizontal com cards maiores
- Mobile/Tablet (<1024px): Grid vertical (coluna unica) com scroll vertical natural

```text
// Mobile/Tablet (< lg)
+---------------------------+
|  [Bronze - ATUAL]         |  <- Borda dourada
|  -------------------------+
|  [Silver]                 |
|  -------------------------+
|  [Gold]                   |
|  -------------------------+
|  [Black]                  |
|  -------------------------+
|  [Elite]                  |
|  -------------------------+
|  [Diamond]                |
+---------------------------+

// Desktop (lg+)
[Bronze] [Silver] [Gold] [Black] [Elite] [Diamond] ->
         <- Scroll horizontal
```

**Implementacao:**

```typescript
import { useIsMobileOrTablet } from "@/hooks/use-mobile";

// ...

const isMobileOrTablet = useIsMobileOrTablet();

{isMobileOrTablet ? (
  // Layout vertical para mobile/tablet
  <div className="flex flex-col gap-4">
    {recognitionLevels.map(...)}
  </div>
) : (
  // Layout horizontal para desktop
  <div className="-mx-4 px-4 overflow-x-auto snap-x ...">
    <div className="flex gap-6 min-w-max pb-3">
      {recognitionLevels.map(...)}
    </div>
  </div>
)}
```

---

### Correcao Detalhada do Efeito Hover

O problema ocorre porque:
1. `overflow-hidden` no card corta o `ring` (borda externa)
2. O `ring-offset` precisa de espaco fora do elemento

**Solucao:**
1. Usar `overflow-visible` no container do card
2. Aplicar `overflow-hidden` apenas no `div` da imagem (para conter a imagem)
3. Adicionar `rounded-xl` no container da imagem tambem

```tsx
<article className="... overflow-visible rounded-xl">
  {/* Imagem com overflow hidden separado */}
  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-xl">
    <img ... />
  </div>
  
  {/* Conteudo */}
  <div className="p-4 ...">
    ...
  </div>
</article>
```

---

### Tamanhos Ajustados

| Elemento | Atual | Novo |
|----------|-------|------|
| Largura card desktop | 140-188px | 200-280px |
| Largura card mobile | 140-188px | 100% (full width) |
| Gap entre cards | 4 (16px) | 6 (24px) desktop, 4 mobile |
| Aspect ratio | 4/5 | Manter 4/5 |
| Padding conteudo | p-3 | p-4 |
| Fonte titulo | text-sm | text-base |
| Fonte descricao | text-xs | text-sm |

---

### Geracao da Placa Diamond

Depois de implementar as alteracoes, vou chamar a Edge Function para gerar a placa Diamond:

```text
POST /generate-recognition-awards
{ "level": "diamond" }
```

Prompt da IA para Diamond:
- Cristal translucido azul-cyan com reflexos prismaticos
- Faixa diagonal cyan/azul clara
- Visual "diamante" com brilho intenso

---

### Resumo de Arquivos

```text
Modificar:
- src/components/reconhecimento/recognitionLevels.ts (adicionar Diamond)
- src/components/reconhecimento/RecognitionCard.tsx (cards maiores + fix hover)
- src/pages/Reconhecimento.tsx (layout responsivo vertical/horizontal)
```

---

### Resultado Esperado

1. Novo nivel Member Diamond com requisito de R$ 1 milhao
2. Cards visivelmente maiores mostrando melhor as placas 3D
3. Borda dourada do nivel atual visivel em todos os lados (sem corte)
4. Mobile/tablet com layout vertical (scroll natural de cima para baixo)
5. Desktop com layout horizontal (deslizar para os lados)
6. Nivel atual sempre destacado com borda dourada em ambos os layouts

