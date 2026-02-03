
# Plano: Dashboard de Marketing/Tráfego Pago "Leads" para Membros Invictus

## Status: 🟡 Fase 1 Completa - Estrutura Base

---

## Progresso

### ✅ Fase 1: Estrutura Base (COMPLETA)
1. ✅ Tabelas criadas no banco de dados (`ad_platform_connections`, `ad_metrics_cache`, `ad_reports`)
2. ✅ RLS policies configuradas
3. ✅ Rota "Leads" adicionada no sidebar
4. ✅ Página de conexões com cards das 3 plataformas
5. ✅ Dashboard principal com dados mock
6. ✅ Componentes: KPICard, PlatformCard, DateRangePicker, Charts

### 🔲 Fase 2: Integração Meta Ads
- [ ] Configurar secrets (META_APP_ID, META_APP_SECRET)
- [ ] Criar Edge Function para OAuth do Meta
- [ ] Criar Edge Function para buscar insights (Marketing API)
- [ ] Conectar dashboard com dados reais
- [ ] Implementar cache de métricas

### 🔲 Fase 3: Integração Google
- [ ] Configurar secrets (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- [ ] Criar OAuth para Google (Ads + Analytics)
- [ ] Edge Function para Google Ads API
- [ ] Edge Function para GA4 Data API
- [ ] Integrar dashboards específicos

### 🔲 Fase 4: Relatórios
- [ ] Criar componente de geração de relatório
- [ ] Implementar PDF com branding Invictus
- [ ] Opção de compartilhar relatório (link público ou download)

---

## Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/Leads.tsx` | Dashboard principal de marketing |
| `src/pages/LeadsConexoes.tsx` | Gerenciar conexões de plataformas |
| `src/components/leads/KPICard.tsx` | Card de métrica com variação % |
| `src/components/leads/PlatformCard.tsx` | Card de status de conexão |
| `src/components/leads/DateRangePicker.tsx` | Seletor de período |
| `src/components/leads/LeadsOverviewCharts.tsx` | Gráficos de impressões, analytics e região |
| `src/components/leads/PlatformSummaryCard.tsx` | Resumo de métricas por plataforma |

## Tabelas Criadas

| Tabela | Descrição |
|--------|-----------|
| `ad_platform_connections` | Conexões OAuth do usuário com as plataformas |
| `ad_metrics_cache` | Cache de métricas para otimizar requisições |
| `ad_reports` | Relatórios gerados pelos usuários |

---

## Próximos Passos

Para continuar a implementação da **Fase 2**, será necessário:

1. **Criar App no Meta for Developers**
   - Acessar: https://developers.facebook.com/apps
   - Criar app do tipo Business
   - Habilitar Marketing API
   - Obter App ID e App Secret

2. **Configurar Secrets no Lovable Cloud**
   - `META_APP_ID`
   - `META_APP_SECRET`

3. **Implementar Edge Functions**
   - `leads-meta-oauth` - callback do OAuth
   - `leads-meta-insights` - buscar métricas

---

## Considerações

- Dashboard atual exibe dados mock para demonstração
- Membros podem acessar a seção "Leads" no menu lateral
- Ao clicar em "Conectar", exibe toast informando que OAuth será implementado
