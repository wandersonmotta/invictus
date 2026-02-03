
# Plano: Dashboard de Marketing/Tráfego Pago "Leads" para Membros Invictus

## Status: ✅ Todas as Fases Implementadas

---

## Progresso

### ✅ Fase 1: Estrutura Base (COMPLETA)
1. ✅ Tabelas criadas no banco de dados (`ad_platform_connections`, `ad_metrics_cache`, `ad_reports`)
2. ✅ RLS policies configuradas
3. ✅ Rota "Leads" adicionada no sidebar
4. ✅ Página de conexões com cards das 3 plataformas
5. ✅ Dashboard principal com dados mock
6. ✅ Componentes: KPICard, PlatformCard, DateRangePicker, Charts

### ✅ Fase 2: Integração Meta Ads (COMPLETA)
- ✅ Configurar secrets (META_APP_ID, META_APP_SECRET)
- ✅ Criar Edge Function para OAuth do Meta (`leads-meta-oauth`)
- ✅ Criar Edge Function para buscar insights (`leads-meta-insights`)
- ✅ Conectar dashboard com dados reais
- ✅ Implementar cache de métricas

### ✅ Fase 3: Integração Google (COMPLETA)
- ✅ Configurar secrets (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- ✅ Criar OAuth para Google (Ads + Analytics) (`leads-google-oauth`)
- ✅ Edge Function para Google Ads API (`leads-google-insights`)
- ✅ Edge Function para GA4 Data API (`leads-google-insights`)
- ✅ Integrar dashboards específicos

### ✅ Fase 4: Relatórios (COMPLETA)
- ✅ Criar componente de geração de relatório (`ExportReportDialog`)
- ✅ Implementar HTML/PDF com branding Invictus (`leads-generate-report`)
- ✅ Opção de exportar relatório (abre em nova janela para impressão/download)

---

## Arquivos Criados/Modificados

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/Leads.tsx` | Dashboard principal com dados reais |
| `src/pages/LeadsConexoes.tsx` | Gerenciar conexões de plataformas |
| `src/components/leads/KPICard.tsx` | Card de métrica com variação % |
| `src/components/leads/PlatformCard.tsx` | Card de status de conexão |
| `src/components/leads/PlatformSummaryCard.tsx` | Resumo de métricas por plataforma |
| `src/components/leads/DateRangePicker.tsx` | Seletor de período |
| `src/components/leads/LeadsOverviewCharts.tsx` | Gráficos de impressões, analytics e região |
| `src/components/leads/ExportReportDialog.tsx` | Dialog de exportação de relatório |
| `src/hooks/useLeadsMetrics.ts` | Hook para buscar métricas das APIs |
| `supabase/functions/leads-meta-oauth/index.ts` | OAuth do Meta Ads |
| `supabase/functions/leads-meta-insights/index.ts` | Buscar métricas do Meta Marketing API |
| `supabase/functions/leads-google-oauth/index.ts` | OAuth do Google (Ads + Analytics) |
| `supabase/functions/leads-google-insights/index.ts` | Buscar métricas do Google Ads e GA4 |
| `supabase/functions/leads-generate-report/index.ts` | Gerar relatório HTML/PDF |

## Tabelas Criadas

| Tabela | Descrição |
|--------|-----------|
| `ad_platform_connections` | Conexões OAuth do usuário com as plataformas |
| `ad_metrics_cache` | Cache de métricas para otimizar requisições |
| `ad_reports` | Relatórios gerados pelos usuários |

---

## Próximos Passos para Uso

1. **Configurar Redirect URIs** nas plataformas:
   - Meta: `https://[seu-dominio]/leads/conexoes`
   - Google: `https://[seu-dominio]/leads/conexoes`

2. **Testar conexões** navegando até `/leads/conexoes`

3. **Para Google Ads completo**: Obter Developer Token aprovado pelo Google

---

## Considerações

- Dashboard exibe dados reais quando plataformas estão conectadas
- Fallback para mensagem de "conecte suas contas" quando não há conexões
- Relatórios são gerados em HTML e abrem em nova janela para impressão/download como PDF
- Google Ads pode exibir dados simulados se o Developer Token não estiver aprovado
