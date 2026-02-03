

# Plano: Refatoração Completa do Dashboard de Leads para Fidelidade 100%

## Análise das Referências

Após analisar detalhadamente as 4 imagens de referência (DashCortex), identifiquei as seguintes diferenças entre a implementação atual e o design desejado:

---

## Visão Geral (IMG_8349) - Diferenças Identificadas

| Elemento | Referência | Atual | Ação |
|----------|------------|-------|------|
| **KPI Cards** | 5 cards horizontais com barra de progresso colorida na base | Implementado mas layout pode diferir | Verificar espaçamento e cores |
| **Impressões Totais** | Card com gráfico de linha dual (azul + verde) + valor grande à esquerda | Está OK | Mínimos ajustes |
| **Meta Ads Card** | Gráfico de barras azuis + métricas lado a lado (Investimento, Compras, CPC) | Usa emojis ao invés de ícones oficiais | Substituir emojis por ícones SVG oficiais |
| **Google Ads Card** | Gráfico de barras verdes + métricas lado a lado | Usa emojis | Substituir emojis por ícones SVG oficiais |
| **Google Analytics Card** | Gráfico de barras laranja + métricas (Total Acessos, Usuários, Únicos) | Usa emoji | Substituir emoji por ícone SVG oficial |
| **Origem dos Acessos** | Donut chart com tabela de regiões à direita | Existe mas layout diferente | Reorganizar layout para match |

---

## Meta Ads (IMG_8350) - Diferenças Identificadas

| Elemento | Referência | Atual | Ação |
|----------|------------|-------|------|
| **Header** | Logo Meta (∞ azul) + "Relatório Meta Ads \| Nome da Empresa" | Parcialmente correto | Ajustar texto do header |
| **Filtros** | Botões "Campanhas" e "Anúncios" no header | Não existe | Adicionar filtros de segmentação |
| **Funil de Tráfego** | Funil 3D com gradiente azul degradê, labels nas laterais | Existe mas visual diferente | Refatorar completamente o FunnelChart |
| **Métricas do Funil** | Add to Cart, Frequência, CPM abaixo do funil | Parcialmente implementado | Verificar valores e layout |
| **Card Checkouts** | Checkouts Iniciados + Custo por Checkout + gráfico linha verde | Existe mas precisa ajustar | Refinar layout e cores |
| **Melhores Anúncios** | Donut chart com legenda vertical à direita | Implementado | OK |
| **Tabela Campanhas** | Colunas: Preview \| Nome \| Conjuntos \| Anúncios \| Investimento \| Custo por Compra \| Compras | Recém implementado | Verificar se preview está funcionando |

---

## Google Ads (IMG_8351) - Diferenças Identificadas

| Elemento | Referência | Atual | Ação |
|----------|------------|-------|------|
| **Header** | Logo Google Ads + "Relatório Google Ads \| Nome da Empresa" + filtros (Campanhas, Grupo, Tipo) | Não tem filtros | Adicionar filtros dropdown |
| **KPIs** | 5 KPIs (Investimento, Conversões, Custo por Conversão, Cliques, CPC Médio) | Implementado | OK |
| **Palavras-chave** | Tabela com scroll e pagination (1-100/793) | Não tem pagination | Adicionar pagination |
| **CTR e Taxa Conversão** | Cards separados abaixo da tabela keywords | Implementado | OK |
| **Gráfico Multi-linha** | 3 linhas (Investimento azul, Conversões verde, Custo laranja) | Implementado | OK |
| **Conversões por Gênero** | Donut verde/azul/cinza | Implementado | OK |
| **Tabela Campanhas** | Com barra de progresso verde na linha destacada | Parcialmente | Ajustar highlight verde |

---

## Analytics (IMG_8352) - Diferenças Identificadas

| Elemento | Referência | Atual | Ação |
|----------|------------|-------|------|
| **Header** | Logo Analytics + filtros "Cidade", "Região" | Não tem filtros | Adicionar dropdowns |
| **KPIs** | 5 KPIs laranja (Acessos, Usuários, Novos Usuários, Visualizações, Taxa Engajamento) | Implementado | OK |
| **Mapa do Brasil** | Mapa interativo com estados coloridos | Placeholder emoji 🇧🇷 | Implementar mapa real SVG |
| **Tabela Regiões** | Região, Cidade, Acessos com barras de progresso laranja | Implementado | OK |
| **Gráfico Período** | Linha laranja suave | Implementado mas usando DualLineChart | Usar gráfico de linha única |
| **Gráfico Semanal** | Barras laranja por dia da semana | Implementado | OK |
| **Origem Acessos** | Donut laranja com legend | Implementado | OK |
| **Sistema Operacional** | Donut vermelho/laranja | Implementado | OK |
| **Dispositivo** | Donut vermelho/laranja | Implementado | OK |
| **Acessos por URL** | Tabela com barras | Implementado | OK |

---

## Mudanças Prioritárias a Implementar

### 1. Ícones Oficiais nas Plataformas
Substituir todos os emojis (📘, 📗, 📊) pelos ícones SVG oficiais:
- **Meta**: Símbolo ∞ em azul #1877F2
- **Google Ads**: Logo multicolorido oficial
- **Analytics**: Logo laranja/amarelo oficial

### 2. Refatorar FunnelChart (Meta Ads)
Criar funil 3D com visual degradê azul idêntico à referência:
```text
    ┌─────────────────────────┐
    │      Cliques            │  Taxa de Cliques: 0.93%
    │        8K               │
    └───────────────────────┐ │
        │    Page Views     │    Connect Rate: 93.31%
        │      8K           │
        └─────────────────┐ │
            │ Checkouts   │    Taxa de Checkout: 31.30%
            │   2.474     │
            └───────────┐ │
               │Compras │    Taxa de Compras: 29.10%
               │  720   │
               └────────┘
```

### 3. Mapa do Brasil (Analytics)
Implementar SVG do mapa do Brasil com estados clicáveis e coloridos por densidade de acessos

### 4. Filtros nos Headers
Adicionar dropdowns de filtros em cada view:
- **Meta Ads**: Campanhas, Anúncios
- **Google Ads**: Campanhas, Grupo, Tipo
- **Analytics**: Cidade, Região

### 5. Layout dos Cards de Plataforma (Overview)
Reorganizar para match exato:
- Título com ícone SVG oficial
- Gráfico de barras semanal
- Métricas em grid 2x2 abaixo

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/leads/PlatformMetricsCard.tsx` | Trocar emojis por ícones SVG oficiais |
| `src/components/leads/LeadsAnalyticsCard.tsx` | Trocar emoji por ícone SVG oficial |
| `src/components/leads/charts/FunnelChart.tsx` | Refatorar completamente para visual 3D degradê |
| `src/components/leads/views/LeadsMetaView.tsx` | Adicionar filtros no header, ajustar layout |
| `src/components/leads/views/LeadsGoogleAdsView.tsx` | Adicionar filtros, ajustar tabela keywords com pagination |
| `src/components/leads/views/LeadsAnalyticsView.tsx` | Adicionar filtros, implementar mapa SVG do Brasil |
| `src/components/leads/views/LeadsOverviewView.tsx` | Ajustar layout cards para match exato |

---

## Arquivos Novos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/leads/icons/PlatformIcons.tsx` | Componentes SVG dos ícones oficiais (Meta, Google Ads, Analytics) |
| `src/components/leads/charts/BrazilMap.tsx` | Mapa SVG do Brasil com estados interativos |
| `src/components/leads/ViewFilters.tsx` | Componente de filtros dropdown reutilizável |

---

## Detalhes Técnicos

### Ícones SVG Oficiais

```tsx
// Meta Icon
const MetaIcon = () => (
  <span className="text-lg font-bold" style={{ color: "#1877F2" }}>∞</span>
);

// Google Ads Icon (já existe no LeadsSidebar)
const GoogleAdsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#FBBC04" d="M3.5 18.49l5.5-9.53..."/>
    <path fill="#4285F4" d="M14.5 18.49l5.5-9.53..."/>
    <path fill="#34A853" d="M9 8.96l5.5-9.53..."/>
    <circle fill="#EA4335" cx="6" cy="18" r="3"/>
  </svg>
);

// Analytics Icon
const AnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#F9AB00" d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12h4..."/>
    <path fill="#E37400" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12h4..."/>
    <circle fill="#F9AB00" cx="12" cy="12" r="4"/>
  </svg>
);
```

### Novo FunnelChart com Visual 3D

O funil terá:
- Gradiente azul degradando de claro para escuro (top to bottom)
- Formato trapezoidal diminuindo em cada etapa
- Labels com valores centralizados
- Taxas de conversão na lateral direita
- Bordas arredondadas na base

### Mapa do Brasil

Usar SVG paths dos estados brasileiros com:
- Fill baseado na densidade de acessos (escala laranja)
- Hover interativo mostrando nome do estado
- Legenda de cores

---

## Ordem de Implementação

1. Criar componente `PlatformIcons.tsx` com todos os ícones SVG
2. Atualizar `PlatformMetricsCard.tsx` e `LeadsAnalyticsCard.tsx` para usar ícones
3. Refatorar `FunnelChart.tsx` completamente
4. Criar `BrazilMap.tsx` para Analytics
5. Criar `ViewFilters.tsx` para dropdowns
6. Atualizar cada View com filtros e ajustes de layout
7. Revisar cores, espaçamentos e tipografia para match exato

---

## Resultado Esperado

Dashboard 100% fiel às referências DashCortex, mantendo a identidade visual Invictus (glassmorphism, tons dourados sutis nos elementos interativos) apenas nos elementos de navegação e UI, enquanto o conteúdo do dashboard segue exatamente o estilo das referências.

