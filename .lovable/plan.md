
# Plano: Adaptar Views Meta Ads, Google Ads e Analytics para Mobile/Tablet

## Problema Identificado

A **Visão Geral** do Leads já está responsiva, mas as três outras views têm problemas de layout em telas menores:

### Meta Ads (LeadsMetaView.tsx)
- Grid `lg:grid-cols-3` não se adapta bem em tablet
- Tabela de campanhas com muitas colunas fica cortada
- Funil com indicadores à direita não cabem em telas estreitas

### Google Ads (LeadsGoogleAdsView.tsx)
- Grid `lg:grid-cols-3` com keywords table ocupando 2 rows
- Gráfico multi-linha com legenda horizontal que trunca
- Tabela de campanhas com 6 colunas não cabe

### Analytics (LeadsAnalyticsView.tsx)
- Mapa do Brasil + tabela de regiões em espaço apertado
- Múltiplos donuts lado a lado que comprimem
- Grid de URLs com textos truncados

---

## Soluções por View

### 1. LeadsMetaView.tsx

| Elemento | Problema | Solução |
|----------|----------|---------|
| Grid principal | `lg:grid-cols-3` fixo | Usar `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` |
| FunnelChart | Indicadores de taxa à direita truncam | Esconder indicadores laterais em mobile, mostrar abaixo |
| CampaignsTable | 6 colunas não cabem | Scroll horizontal + priorizar colunas essenciais |
| KPIs | 5 cards em linha | Já está `grid-cols-2 lg:grid-cols-5`, manter |

**Mudanças específicas:**
- Linha 137: `grid-cols-1 lg:grid-cols-3` → `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- FunnelChart: Adicionar prop `compact` para mobile que move rates para baixo
- Tabela: Envolver em `overflow-x-auto` e ocultar colunas "Conjuntos" e "Anúncios" em mobile

### 2. LeadsGoogleAdsView.tsx

| Elemento | Problema | Solução |
|----------|----------|---------|
| Grid principal | Keywords table span 2 rows | Em mobile, cada card ocupa 100% |
| KeywordsTable | Largura fixa trunca | Full width em mobile |
| Chart legend | 3 itens em linha | Wrap em mobile |
| Gender Donut | Fica espremido | Full width em mobile |

**Mudanças específicas:**
- Linha 132: `lg:grid-cols-3` → `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Linha 134: `lg:row-span-2` → `md:row-span-2 lg:row-span-2` (só span em md+)
- Linha 177: `lg:col-span-2` → `md:col-span-2 lg:col-span-2`
- Legenda do chart: `flex-wrap` para quebrar em mobile

### 3. LeadsAnalyticsView.tsx

| Elemento | Problema | Solução |
|----------|----------|---------|
| BrazilMap + tabela | Card muito alto | Ajustar altura do mapa em mobile |
| Grid de donuts | 3 colunas comprimidas | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| Tabela de URLs | Truncamento excessivo | Melhorar responsividade |
| Region table | Colunas fixas | Adaptar para mobile |

**Mudanças específicas:**
- Linha 162: `lg:grid-cols-3` → `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Linha 164: `lg:row-span-2` → Remover span em mobile
- Linha 236: `md:grid-cols-2 lg:grid-cols-3` → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- BrazilMap: Reduzir altura máxima em mobile

---

## Componentes a Modificar

### CampaignsTable.tsx
- Adicionar `overflow-x-auto` no container
- Ocultar colunas secundárias em mobile via classes `hidden md:table-cell`
- Reduzir padding em mobile

### FunnelChart.tsx
- Mover indicadores de taxa para baixo do funil em mobile
- Usar media query ou prop `compact`

### KeywordsTable.tsx
- Já está OK, apenas garantir `overflow-hidden` nos textos

---

## Resumo de Arquivos

| Arquivo | Mudanças |
|---------|----------|
| `src/components/leads/views/LeadsMetaView.tsx` | Ajustar grids, adicionar responsividade |
| `src/components/leads/views/LeadsGoogleAdsView.tsx` | Ajustar grids e spans |
| `src/components/leads/views/LeadsAnalyticsView.tsx` | Ajustar grids, mapa e tabelas |
| `src/components/leads/charts/CampaignsTable.tsx` | Scroll horizontal + ocultar colunas em mobile |
| `src/components/leads/charts/FunnelChart.tsx` | Layout compacto para mobile |

---

## Breakpoints Utilizados

| Breakpoint | Largura | Dispositivos |
|------------|---------|--------------|
| default | < 640px | Celulares |
| `sm:` | ≥ 640px | Celulares grandes |
| `md:` | ≥ 768px | Tablets pequenos |
| `lg:` | ≥ 1024px | Tablets grandes / Notebooks |
| `xl:` | ≥ 1280px | Desktops |

---

## Resultado Esperado

1. **Celulares (< 640px)** → Cards empilhados verticalmente, tabelas com scroll horizontal
2. **Tablets (768-1023px)** → Grids de 2 colunas, elementos críticos visíveis
3. **Notebooks/Desktops (≥ 1024px)** → Layout completo de 3 colunas

---

## Testes a Realizar

1. Abrir Meta Ads em celular → verificar funil e tabela de campanhas
2. Abrir Google Ads em tablet → verificar keywords e gráfico
3. Abrir Analytics em celular → verificar mapa do Brasil e donuts
4. Testar scroll horizontal nas tabelas em mobile
5. Verificar que nenhum texto está cortado/truncado excessivamente
