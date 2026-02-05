

## Plano: Placas de Acrilico 3D Invictus + Selecao de Nivel

Vou implementar placas de acrilico 3D geradas por IA e a indicacao visual do nivel atual do usuario, seguindo exatamente o padrao das referencias enviadas.

---

### Visao Geral

```text
+-----------------------------------------------+
|  RECONHECIMENTO                               |
|  Bora para o proximo nivel!                   |
+-----------------------------------------------+
|                                               |
|  [Bronze]  [Silver]  [Gold]  [Black]  [Elite] |
|   ATUAL     proximo   futuro  futuro   futuro |
|  --------                                     |
|  borda gold                                   |
+-----------------------------------------------+
```

---

### Requisitos por Nivel (Atualizados)

| Nivel | Nome | Requisito | Pontos |
|-------|------|-----------|--------|
| 1 | Member Bronze | Adicione 3 pessoas | 100 |
| 2 | Member Silver | Acumule R$ 10 mil em resultados | 500 |
| 3 | Member Gold | Acumule R$ 50 mil em resultados | 1.000 |
| 4 | Member Black | Acumule R$ 100 mil em resultados | 2.500 |
| 5 | Member Elite | Acumule R$ 500 mil em resultados | 5.000 |

---

### Geracao das Placas 3D com IA

Vou criar uma Edge Function que usa **Lovable AI (google/gemini-2.5-flash-image)** para gerar imagens das placas:

**Prompt para cada placa:**
```text
Photorealistic 3D acrylic award trophy on dark gradient background.
Silver metallic rectangular frame with rounded corners and polished chrome border.
Inside: [COR] translucent crystal gem with faceted cuts catching light.
Diagonal [COR] accent stripe across the frame.
Top shows "INVICTUS" text in gold metallic letters.
Bottom shows "MEMBER [NIVEL]" text.
Professional product photography, studio lighting, soft reflections.
Clean minimal composition. Premium luxury business award style.
High detail, 4K quality.
```

**Cores por nivel:**
- Bronze: Amber/copper crystal + amber stripe
- Silver: Clear/white crystal + silver stripe
- Gold: Yellow/gold crystal + gold stripe
- Black: Dark smoke crystal + black stripe
- Elite: Gold crystal with rainbow reflections + gold stripe

---

### Arquivos a Criar

#### 1. `supabase/functions/generate-recognition-awards/index.ts`

Edge Function para gerar as imagens das placas:
- Recebe o nivel como parametro
- Chama Lovable AI com o prompt especifico
- Faz upload da imagem base64 para Supabase Storage
- Retorna URL publica da imagem

#### 2. Bucket de Storage `recognition-awards`

Criar bucket publico para armazenar as imagens geradas.

---

### Arquivos a Modificar

#### 3. `src/components/reconhecimento/recognitionLevels.ts`

Atualizar interface e dados:

```typescript
export interface RecognitionLevel {
  id: string;
  name: string;
  description: string;      // Requisito completo
  requirement: string;      // Texto destacado (ex: "3 pessoas")
  points: number;
  gradient: string;
  accent: string;
  imageUrl?: string;        // URL da placa gerada
}

// Atualizar Bronze:
{
  id: "bronze",
  name: "Member Bronze",
  description: "Adicione 3 pessoas",
  requirement: "3 pessoas",
  points: 100,
  ...
}
```

#### 4. `src/components/reconhecimento/RecognitionCard.tsx`

Redesenhar card para seguir referencia:

```text
+----------------------------+
|                            |
|    [Imagem da Placa        |
|     de Acrilico 3D]        |
|                            |
+----------------------------+
|  Member Gold               |
|  Acumule 50 mil em         |
|  resultados                |
+----------------------------+
|  Ganha: 1.000 pts.         |
+----------------------------+
```

Adicionar props:
- `isCurrentLevel: boolean` - destacar com borda dourada
- `isAchieved: boolean` - mostrar check de conquistado
- `isFuture: boolean` - aplicar opacidade reduzida

Visual do nivel atual:
- Borda dourada brilhante (`ring-2 ring-primary`)
- Badge "Seu nivel" ou indicador visual

#### 5. `src/pages/Reconhecimento.tsx`

Atualizar pagina:
- Subtitulo: "Bora para o proximo nivel!"
- Logica para determinar nivel atual (mock inicial, depois integracao real)
- Passar props de estado para cada card:

```typescript
// Mock inicial - depois vira dados reais
const currentLevelIndex = 0; // Bronze

{recognitionLevels.map((level, index) => (
  <RecognitionCard
    key={level.id}
    level={level}
    isCurrentLevel={index === currentLevelIndex}
    isAchieved={index < currentLevelIndex}
    isFuture={index > currentLevelIndex}
  />
))}
```

---

### Fluxo de Geracao de Imagens

```text
1. Admin acessa pagina de geracao (ou roda manualmente)
2. Edge Function chama Lovable AI para cada nivel
3. Imagem base64 retornada
4. Upload para Storage bucket "recognition-awards"
5. URL salva em tabela ou hardcoded inicialmente
6. RecognitionCard exibe imagem da placa
```

---

### Estados Visuais dos Cards

| Estado | Visual | Descricao |
|--------|--------|-----------|
| Conquistado | Opacity normal + check verde | Niveis ja atingidos |
| Atual | Borda dourada + badge "Seu nivel" | Nivel onde o usuario esta |
| Proximo | Opacity normal | Proximo nivel a conquistar |
| Futuro | Opacity 60% | Niveis distantes |

---

### Resumo de Arquivos

```text
Criar:
- supabase/functions/generate-recognition-awards/index.ts

Modificar:
- src/components/reconhecimento/recognitionLevels.ts
- src/components/reconhecimento/RecognitionCard.tsx
- src/pages/Reconhecimento.tsx

Criar bucket:
- recognition-awards (publico)
```

---

### Resultado Esperado

1. Placas de acrilico 3D com visual premium Invictus
2. Cristais coloridos translucidos em cada placa
3. Requisito do Bronze atualizado: "Adicione 3 pessoas"
4. Card do nivel atual destacado com borda dourada
5. Niveis futuros com opacidade reduzida
6. Layout identico as referencias enviadas

