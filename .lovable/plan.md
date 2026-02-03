
# Redesign do Dashboard de Leads - Estilo DashCortex com Identidade Invictus

## Objetivo
Recriar o dashboard de Leads seguindo o layout das referências enviadas (DashCortex), mantendo o padrão visual premium da Invictus (glassmorphism, tons dourados, superfícies de grafite).

---

## Análise das Referências

### Visão Geral (IMG_8349)
- **Header**: Logos das plataformas (Meta, Google Ads, Analytics) + Nome da Empresa + Date Picker
- **KPIs principais**: 5 cards horizontais (Investimento Total, Conversões Totais, Taxa de Conversão, Faturamento Total, ROI Geral) com variação percentual colorida
- **Gráfico de Impressões**: Linha com duas séries (Meta Ads vs Google Ads)
- **Cards de Plataforma**: Meta Ads e Google Ads lado a lado, cada um com gráfico de barras semanal e métricas específicas
- **Google Analytics**: Card com gráfico de barras diário e métricas de acessos
- **Origem dos Acessos**: Donut chart + tabela de regiões com barra de progresso

### Analytics Detalhado (IMG_8352)
- **KPIs**: Acessos Totais, Usuários Totais, Novos Usuários, Visualizações de Páginas, Taxa de Engajamento
- **Mapa do Brasil** com distribuição por estado
- **Gráficos**: Linha de acessos no período + Barras de acessos na semana
- **Donut charts**: Sistema Operacional e Dispositivo
- **Tabelas**: Região/Cidade e Acessos por URL

### Google Ads (IMG_8351)
- **KPIs**: Investimento, Conversões, Custo por Conversão, Cliques, CPC Médio
- **Tabela de Palavras-chave** com métricas
- **Gráfico de múltiplas linhas** (Investimento, Conversões, Custo por Conversão)
- **Pie chart**: Conversões por Gênero
- **Tabela de Campanhas** com colunas detalhadas

### Meta Ads (IMG_8350)
- **KPIs**: Investimento, Faturamento, Compras, ROAS Médio, Custo por Compra (CPA)
- **Funil de Tráfego** visual com etapas (Cliques → Page Views → Checkouts → Compras)
- **Métricas de funil**: Checkouts Iniciados, Custo por Checkout
- **Gráfico de linhas**: Faturamento vs Compras ao longo do tempo
- **Pie chart**: Melhores Anúncios
- **Tabela de Campanhas** com breakdown por Conjuntos e Anúncios

---

## Arquitetura de Componentes

### Novos Componentes a Criar:

```text
src/components/leads/
├── LeadsDashboardHeader.tsx      # Header com logos + date picker
├── LeadsKPIRow.tsx               # Row de 5 KPIs com estilo atualizado
├── LeadsImpressionsChart.tsx     # Gráfico de linha dual (Meta vs Google)
├── PlatformMetricsCard.tsx       # Card de plataforma com gráfico + métricas
├── LeadsAnalyticsCard.tsx        # Card específico do GA4
├── LeadsRegionDonutChart.tsx     # Donut + tabela de regiões
├── LeadsFunnelChart.tsx          # Visualização de funil (Meta Ads)
├── LeadsCampaignsTable.tsx       # Tabela de campanhas
├── LeadsKeywordsTable.tsx        # Tabela de palavras-chave (Google Ads)
└── charts/
    ├── MultiLineChart.tsx        # Gráfico de múltiplas linhas
    ├── WeeklyBarChart.tsx        # Barras por dia da semana
    └── DonutWithLegend.tsx       # Donut com legenda lateral
```

### Componentes a Atualizar:
- `src/pages/Leads.tsx` - Layout completamente novo
- `src/components/leads/KPICard.tsx` - Novo visual seguindo referência
- `src/components/leads/LeadsOverviewCharts.tsx` - Substituir por novos charts

---

## Especificações de Design

### Paleta de Cores (mantendo Invictus)
| Elemento | Cor |
|----------|-----|
| Background | `hsl(0 0% 7%)` (grafite escuro) |
| Cards | `hsl(0 0% 11%)` com glassmorphism |
| Bordas | `hsl(0 0% 18%)` com accent dourado |
| Primário (gold) | `hsl(42 85% 50%)` |
| Meta Ads | `hsl(214 100% 50%)` (azul) |
| Google Ads | `hsl(142 76% 36%)` (verde) |
| Analytics | `hsl(25 95% 53%)` (laranja) |
| Positivo | `hsl(142 76% 45%)` (verde) |
| Negativo | `hsl(0 84% 60%)` (vermelho) |

### KPI Cards (novo estilo)
```text
┌─────────────────────────────┐
│ Investimento Total          │  ← Label pequeno (muted)
│ R$ 10.453,14                │  ← Valor grande (branco)
│ ▲ 115,3%                    │  ← Badge de variação (verde/vermelho)
│ ═══════════════════════════ │  ← Progress bar accent (opcional)
└─────────────────────────────┘
```

### Cards de Plataforma
- Header com emoji/ícone + nome
- Legenda colorida (ex: "Compras na Semana")
- Gráfico de barras (7 dias)
- Grid de métricas à direita (Investimento, Compras, Custo por Compra)
- Cada métrica com valor + variação %

### Gráfico de Impressões
- Dual line chart
- Legenda: Meta Ads (azul) vs Google Ads (verde)
- Eixo Y formatado em "k"
- Tooltip com ambas as séries

---

## Plano de Implementação

### Fase 1: Componentes Base
1. **LeadsKPIRow.tsx** - 5 KPIs em grid responsivo
   - Valor grande + variação percentual colorida
   - Barra de progresso opcional no fundo
   - Glassmorphism + borda dourada sutil

2. **DonutWithLegend.tsx** - Donut chart reutilizável
   - Aceita dados dinâmicos
   - Legenda lateral com valores e cores

3. **WeeklyBarChart.tsx** - Barras para dias da semana
   - Labels: Seg, Ter, Qua, Qui, Sex, Sáb, Dom
   - Cor customizável por plataforma

### Fase 2: Cards de Plataforma
4. **PlatformMetricsCard.tsx** - Card completo por plataforma
   - Props: platform, chartData, metrics[]
   - Layout: gráfico à esquerda, métricas à direita
   - Cores específicas por plataforma

5. **LeadsAnalyticsCard.tsx** - Card do GA4
   - Gráfico de barras de acessos
   - Métricas: Total de Acessos, Total de Usuários, Usuários Únicos

### Fase 3: Gráficos Principais
6. **LeadsImpressionsChart.tsx** - Linha dual
   - Duas linhas (Meta + Google)
   - Total agregado no header
   - Variação percentual

7. **LeadsRegionDonutChart.tsx** - Origem dos acessos
   - Donut com % por região
   - Tabela lateral: Região | Acessos | Barra de progresso

### Fase 4: Página Principal
8. **Leads.tsx** - Novo layout
   - Header simplificado com logos e date picker
   - Grid de KPIs (5 colunas desktop, 2 mobile)
   - Seção de gráficos (Impressões + Cards de plataforma)
   - Seção Analytics + Origem

---

## Detalhes Técnicos

### Estrutura de Dados (mock inicial)
```typescript
interface PlatformChartData {
  day: string;
  value: number;
}

interface PlatformMetric {
  label: string;
  value: string;
  change: number; // percentual
}

interface RegionData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}
```

### Responsividade
| Breakpoint | KPIs | Charts | Platform Cards |
|------------|------|--------|----------------|
| Mobile (<640px) | 2 cols, scroll | 1 col | 1 col |
| Tablet (640-1024px) | 3 cols | 2 cols | 2 cols |
| Desktop (>1024px) | 5 cols | 3 cols | 2 cols |

### Animações
- Cards: fade-in + slide-up sequencial
- Charts: desenho progressivo (recharts default)
- Hover: elevação sutil + brilho dourado

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/Leads.tsx` | Reescrever com novo layout |
| `src/components/leads/KPICard.tsx` | Atualizar visual |
| `src/components/leads/LeadsOverviewCharts.tsx` | Substituir por novos componentes |
| `src/components/leads/PlatformSummaryCard.tsx` | Substituir por PlatformMetricsCard |

---

## Resultado Esperado

O dashboard final terá:
- Visual idêntico às referências DashCortex
- Identidade Invictus preservada (glassmorphism, dourado, grafite)
- Dados mockados inicialmente (integração real já existe)
- Layout responsivo para mobile e desktop
- Transição suave entre estados de loading
