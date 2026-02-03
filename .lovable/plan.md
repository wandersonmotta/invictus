
# Plano: Dashboard de Marketing/Tráfego Pago "Leads" para Membros Invictus

## Visão Geral

Criar uma seção **"Leads"** exclusiva para membros aprovados da Invictus, onde eles podem conectar suas contas de **Meta Ads**, **Google Ads** e **Google Analytics (GA4)** para visualizar métricas de campanhas em um dashboard premium no padrão visual Invictus, com capacidade de gerar relatórios compartilháveis.

---

## Escopo da Feature

### O que será implementado:

1. **Nova seção "Leads"** no menu lateral (somente para membros aprovados)
2. **Página de conexões** para vincular APIs das plataformas
3. **Dashboard unificado** com métricas de todas as plataformas
4. **Dashboards individuais** para Meta Ads, Google Ads e Analytics
5. **Sistema de relatórios** exportáveis com branding Invictus
6. **Backend (Edge Functions)** para proxy das APIs

---

## Arquitetura Técnica

### Integrações de APIs

| Plataforma | API | Autenticação | Dados Principais |
|------------|-----|--------------|------------------|
| **Meta Ads** | Marketing API v24.0 | OAuth 2.0 + Access Token | Investimento, Conversões, Impressões, Cliques, CPC, ROAS |
| **Google Ads** | Google Ads API | OAuth 2.0 + Customer ID | Custo, Conversões, CTR, CPC, Campanhas |
| **Google Analytics** | GA4 Data API | OAuth 2.0 + Property ID | Acessos, Usuários, Sessões, Origem, Dispositivo |

### Fluxo de Autenticação OAuth

```text
1. Usuário clica "Conectar Meta Ads"
2. Redirect para OAuth do Meta/Google
3. Callback retorna access_token
4. Token é criptografado e salvo no banco
5. Edge Function usa token para buscar dados
6. Dados são processados e exibidos no dashboard
```

---

## Estrutura de Arquivos

### Novas Páginas

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/Leads.tsx` | Dashboard principal de marketing |
| `src/pages/LeadsConexoes.tsx` | Gerenciar conexões de plataformas |
| `src/pages/LeadsMetaAds.tsx` | Dashboard detalhado Meta Ads |
| `src/pages/LeadsGoogleAds.tsx` | Dashboard detalhado Google Ads |
| `src/pages/LeadsAnalytics.tsx` | Dashboard detalhado Analytics |
| `src/pages/LeadsRelatorio.tsx` | Gerador de relatórios |

### Componentes

| Arquivo | Descrição |
|---------|-----------|
| `src/components/leads/KPICard.tsx` | Card de métrica com variação % |
| `src/components/leads/SpendChart.tsx` | Gráfico de investimento |
| `src/components/leads/ConversionsChart.tsx` | Gráfico de conversões |
| `src/components/leads/FunnelChart.tsx` | Funil de tráfego |
| `src/components/leads/CampaignsTable.tsx` | Tabela de campanhas |
| `src/components/leads/RegionMap.tsx` | Mapa de origem dos acessos |
| `src/components/leads/PlatformCard.tsx` | Card de status de conexão |
| `src/components/leads/DateRangePicker.tsx` | Seletor de período |
| `src/components/leads/ReportGenerator.tsx` | Gerador de relatório PDF |

### Edge Functions (Backend)

| Função | Descrição |
|--------|-----------|
| `supabase/functions/leads-meta-oauth/` | OAuth callback do Meta |
| `supabase/functions/leads-google-oauth/` | OAuth callback do Google |
| `supabase/functions/leads-meta-insights/` | Buscar dados do Meta Ads |
| `supabase/functions/leads-google-ads/` | Buscar dados do Google Ads |
| `supabase/functions/leads-ga4-analytics/` | Buscar dados do GA4 |
| `supabase/functions/leads-generate-report/` | Gerar PDF do relatório |

---

## Modelo de Dados

### Novas Tabelas

```sql
-- Conexões de plataformas do usuário
CREATE TABLE ad_platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('meta_ads', 'google_ads', 'google_analytics')),
  
  -- Tokens criptografados
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- IDs específicos da plataforma
  account_id TEXT, -- act_xxx para Meta, customer_id para Google Ads
  property_id TEXT, -- GA4 property ID
  account_name TEXT,
  
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, platform)
);

-- Cache de métricas (evitar requisições excessivas às APIs)
CREATE TABLE ad_metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES ad_platform_connections(id) ON DELETE CASCADE,
  
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  metric_type TEXT NOT NULL, -- 'overview', 'campaigns', 'daily'
  
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(connection_id, date_range_start, date_range_end, metric_type)
);

-- Relatórios gerados
CREATE TABLE ad_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  platforms TEXT[] NOT NULL, -- ['meta_ads', 'google_ads']
  
  report_data JSONB NOT NULL,
  pdf_storage_path TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Interface do Dashboard (Baseado nas Imagens de Referência)

### Visão Geral (Dashboard Principal)

```text
┌──────────────────────────────────────────────────────────────────┐
│  🔷 Leads    [📥 Exportar] [📅 Aug 1 - Aug 11, 2025 ▼]          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐│
│  │Investim. │ │Conversões│ │Taxa Conv.│ │Faturamento│ │ROI Geral││
│  │R$10.453  │ │ 1.058,08 │ │ 24,89%   │ │R$28.178  │ │   2.7   ││
│  │ ▲ 115%   │ │ ▲ 101%   │ │ ▲ 85%    │ │ ▲ 134%   │ │ ▲ 116%  ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────┘│
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐│
│  │   Impressões Totais │  │                                     ││
│  │      380,580        │  │   Meta Ads          │  Google Ads   ││
│  │   ▲ 111%            │  │  ┌──────────────┐   │  ┌──────────┐ ││
│  │   [📊 Gráfico linha]│  │  │Invest: R$9.5k│   │  │Invest:R$854││
│  │                     │  │  │Compras: 315  │   │  │Conv: 743   ││
│  └─────────────────────┘  │  │CPC: R$30.47  │   │  │CPC: R$1.15 ││
│                           │  └──────────────┘   │  └──────────┘ ││
│  ┌─────────────────────┐  ├─────────────────────┴───────────────┤│
│  │  Google Analytics   │  │         Origem dos Acessos          ││
│  │  [📊 Barras]        │  │  [🥧 Gráfico Pizza] + Tabela Região ││
│  │  Total: 4,621       │  │  SP: 1.908  │  RJ: 277  │  MG: 246  ││
│  └─────────────────────┘  └─────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Dashboard Meta Ads (Detalhado)

- Funil de Tráfego (Cliques → Page Views → Checkouts → Compras)
- Gráfico de Faturamento vs Conversões por período
- Tabela de Campanhas com Investimento/Custo por Compra/Conversões
- Melhores Anúncios por Conversão

### Dashboard Google Analytics

- Mapa do Brasil com heatmap de acessos
- Acessos por período (linha)
- Acessos por dia da semana (barras)
- Sistema Operacional e Dispositivo (donuts)
- Tabela de URLs mais acessadas

---

## Fluxo de Implementação

### Fase 1: Estrutura Base
1. Criar tabelas no banco de dados
2. Adicionar rota "Leads" no sidebar (somente aprovados)
3. Criar página de conexões com cards das 3 plataformas
4. Implementar UI base do dashboard com dados mock

### Fase 2: Integração Meta Ads
5. Criar Edge Function para OAuth do Meta
6. Criar Edge Function para buscar insights (Marketing API)
7. Conectar dashboard com dados reais
8. Implementar cache de métricas

### Fase 3: Integração Google
9. Criar OAuth para Google (Ads + Analytics)
10. Edge Function para Google Ads API
11. Edge Function para GA4 Data API
12. Integrar dashboards específicos

### Fase 4: Relatórios
13. Criar componente de geração de relatório
14. Implementar PDF com branding Invictus
15. Opção de compartilhar relatório (link público ou download)

---

## Considerações Importantes

### APIs Externas - Requisitos

| Plataforma | Requisito | Como Obter |
|------------|-----------|------------|
| **Meta Ads** | App ID + App Secret | developers.facebook.com/apps |
| **Google Ads** | Developer Token + OAuth Credentials | console.cloud.google.com |
| **Google Analytics** | OAuth Credentials | console.cloud.google.com |

O usuário (membro Invictus) precisará:
1. Ter uma conta de anúncios ativa na plataforma
2. Autorizar o app Invictus via OAuth
3. Selecionar qual conta/propriedade conectar

### Segurança
- Tokens de acesso serão criptografados no banco
- Edge Functions fazem proxy das requisições (tokens nunca expostos no frontend)
- RLS garante que cada usuário vê apenas suas conexões
- Refresh tokens são renovados automaticamente

### Estilo Visual Invictus
- Cards com gradiente dourado premium
- Gráficos em tons de azul (Meta), verde (Google Ads), laranja (Analytics)
- Fundo escuro executivo
- Relatórios com logo + "FRATERNIDADE" + assinatura visual

---

## Resumo de Alterações

| Tipo | Quantidade |
|------|------------|
| Novas páginas | 6 |
| Novos componentes | ~12 |
| Novas Edge Functions | 6 |
| Novas tabelas | 3 |
| Alterações em arquivos existentes | 2 (App.tsx, AppSidebar.tsx) |

---

## Próximos Passos Recomendados

1. **Aprovar este plano** para iniciar a implementação
2. **Criar credenciais** nos portais de desenvolvedores (Meta, Google)
3. **Configurar secrets** no Lovable Cloud para as chaves de API
4. Implementar em fases, começando pela UI com dados mock
