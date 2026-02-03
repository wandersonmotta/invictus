
# Plano: Campanhas Meta Ads com Preview Real + Revisão de Fidelidade

## Resumo

Este plano aborda duas necessidades:
1. **Revisar e ajustar** o dashboard de Leads para garantir fidelidade máxima às referências visuais
2. **Implementar previews reais de campanhas** no Meta Ads, buscando thumbnails dos criativos diretamente da API do Facebook/Meta

---

## Parte 1: Previews de Campanhas com Dados Reais

### O que será implementado

Na tabela de campanhas do Meta Ads, cada linha mostrará:
- **Thumbnail do criativo** (imagem ou frame do vídeo do anúncio)
- **Nome da campanha**
- Métricas existentes (conjuntos, anúncios, investimento, custo por compra, compras)

### Arquitetura Técnica

**1. Nova Edge Function: `leads-meta-campaigns`**

Criará uma nova função para buscar campanhas com seus criativos da API Meta Marketing:

```
Endpoint: GET /leads-meta-campaigns
Query params: start_date, end_date

Retorno:
{
  campaigns: [
    {
      id: "123",
      name: "CAM - Sales - Remarketing 2025",
      status: "ACTIVE",
      thumbnail_url: "https://...",
      ad_sets_count: 3,
      ads_count: 12,
      insights: {
        spend: 5276.77,
        purchases: 212,
        cost_per_purchase: 25.13
      }
    }
  ]
}
```

**Chamadas à API Meta:**
1. `GET /act_{account_id}/campaigns` - Lista campanhas
2. `GET /act_{account_id}/ads` - Lista anúncios com `creative{thumbnail_url}`
3. `GET /{campaign_id}/insights` - Métricas por campanha

**2. Hook: `useMetaCampaigns`**

Novo hook React Query para buscar e cachear dados de campanhas com previews.

**3. Componente: `CampaignPreviewCell`**

Célula de tabela que exibe:
- Thumbnail arredondado (40x40px)
- Nome da campanha
- Badge de status (Ativo/Pausado)

---

## Parte 2: Revisão de Fidelidade Visual

### Ajustes identificados

| Componente | Ajuste Necessário |
|------------|-------------------|
| **CampaignsTable** | Adicionar coluna de preview/thumbnail na primeira posição |
| **CampaignsTable** | Incluir badge de status (Ativo/Pausado) |
| **FunnelChart** | Ajustar proporções e gradientes para match exato |
| **LeadsMetaView** | Reorganizar grid para match com referência |
| **LeadsSidebar** | Já corrigido (ícones oficiais + nome "Leads") |

---

## Arquivos a Criar/Modificar

### Novos Arquivos:
1. `supabase/functions/leads-meta-campaigns/index.ts` - Edge function para campanhas
2. `src/hooks/useMetaCampaigns.ts` - Hook de dados
3. `src/components/leads/charts/CampaignPreviewCell.tsx` - Célula com thumbnail

### Arquivos a Modificar:
1. `src/components/leads/charts/CampaignsTable.tsx` - Adicionar coluna de preview
2. `src/components/leads/views/LeadsMetaView.tsx` - Integrar dados reais de campanhas

---

## Detalhes Técnicos

### Edge Function - leads-meta-campaigns

```typescript
// Buscar campanhas da conta
const campaignsUrl = 
  `https://graph.facebook.com/v21.0/act_${accountId}/campaigns?` +
  `fields=id,name,status,effective_status,adsets{id},ads{id,creative{thumbnail_url}}` +
  `&access_token=${accessToken}`;

// Buscar insights por campanha
const insightsUrl =
  `https://graph.facebook.com/v21.0/act_${accountId}/insights?` +
  `level=campaign` +
  `&fields=campaign_id,campaign_name,spend,actions` +
  `&time_range={"since":"${startDate}","until":"${endDate}"}` +
  `&access_token=${accessToken}`;
```

### Estrutura do CampaignPreviewCell

```tsx
// Thumbnail + Nome + Status
<div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted/30">
    {thumbnail_url ? (
      <img src={thumbnail_url} className="w-full h-full object-cover" />
    ) : (
      <div className="flex items-center justify-center h-full">
        <ImageIcon className="w-4 h-4 text-muted-foreground" />
      </div>
    )}
  </div>
  <div>
    <p className="font-medium text-sm">{name}</p>
    <Badge variant={status === "ACTIVE" ? "success" : "secondary"}>
      {status === "ACTIVE" ? "Ativo" : "Pausado"}
    </Badge>
  </div>
</div>
```

---

## Fluxo de Implementação

1. Criar edge function `leads-meta-campaigns`
2. Criar hook `useMetaCampaigns` 
3. Criar componente `CampaignPreviewCell`
4. Atualizar `CampaignsTable` com nova estrutura
5. Atualizar `LeadsMetaView` para usar dados reais
6. Testar integração end-to-end

---

## Considerações

- **Fallback**: Se não houver conexão Meta ativa, exibir dados mockados sem thumbnails
- **Cache**: Thumbnails serão cacheados via React Query (5 min stale time)
- **Placeholder**: Ícone genérico quando thumbnail não disponível
- **Status da campanha**: Badge visual indicando se está ativo ou pausado
