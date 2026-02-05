
Objetivo
- Eliminar completamente a rolagem horizontal (rolar para a direita) no celular e tablet nas views:
  - Meta Ads
  - Google Ads
- Manter a experiência “rica” no desktop, mas no mobile tudo deve caber na largura da tela.

Diagnóstico (com base no código atual)
- O componente `CampaignsTable` ainda força largura mínima (`min-w-[600px]`) e isso, mesmo com `overflow-x-auto`, costuma gerar sensação de “tela não responsiva” (e em alguns casos acaba criando overflow no layout pai).
- Em mobile, tabelas densas são o principal motivo de overflow. Você confirmou que no mobile quer “Cards (sem rolagem)”.

Mudanças que vou implementar (sem alterar o visual desktop)

1) CampaignsTable: criar layout “Cards” para mobile e manter tabela para md+
Arquivos:
- `src/components/leads/charts/CampaignsTable.tsx`

O que será feito:
- Renderização condicional por breakpoint:
  - Mobile (< md): lista de cards (um card por campanha), sem tabela e sem `min-width` forçando overflow.
  - Desktop (md+): tabela como hoje (pode manter a versão atual com colunas completas).
- Remover/evitar `min-w-[600px]` no layout mobile.
- Conteúdo dos cards (mobile):
  - Meta:
    - Nome (com status)
    - Investimento
    - Custo por compra
    - Compras
  - Google Ads:
    - Nome
    - Investimento
    - Custo por conversão
    - Conversões
    - Taxa de conversão (se existir)
- Ajustar truncamento (`min-w-0`, `truncate`) para garantir que textos longos não empurrem a largura.
- Manter o “efeito premium” (vidro fosco) nos cards e tipografia consistente com o dashboard.

2) LeadsMetaView: garantir que nada “force” largura no mobile
Arquivos:
- `src/components/leads/views/LeadsMetaView.tsx`

O que será feito:
- Trocar o uso de `CampaignsTable` para aproveitar automaticamente o novo modo “cards no mobile”.
- Revisar containers de cards e grids para garantir `min-w-0` quando necessário (principalmente em blocos com texto + números).
- Garantir que o bloco de legenda do gráfico não crie overflow (ex.: adicionar `flex-wrap` ou reduzir gaps em telas pequenas, se necessário).

3) LeadsGoogleAdsView + KeywordsTable: impedir overflow por cabeçalhos/colunas rígidas
Arquivos:
- `src/components/leads/views/LeadsGoogleAdsView.tsx`
- `src/components/leads/charts/KeywordsTable.tsx`

O que será feito:
- `CampaignsTable` (Google Ads) vai passar a usar cards no mobile automaticamente após a mudança no componente.
- `KeywordsTable`:
  - Ajustar o cabeçalho (linha com “Cliques” e “Conversões”) para não depender de `gap-6` fixo em telas estreitas.
  - Opção que vou aplicar: transformar o cabeçalho em um mini-grid responsivo (ou `flex-wrap`) e reduzir gaps no mobile.
  - Garantir que keyword longa nunca estoure a largura: reforçar `min-w-0` no container do item + `truncate`.

4) “Trava de segurança” contra overflow no container principal (somente se necessário)
Arquivo:
- `src/pages/Leads.tsx`

O que será feito (com cuidado):
- Se após os ajustes ainda existir overflow horizontal, vou aplicar `overflow-x-hidden` no container de conteúdo (não no body inteiro) para impedir qualquer “vazamento” de largura.
- Importante: só farei isso depois que os componentes estiverem realmente responsivos, para não “mascarar” problema cortando conteúdo.

Como vou testar (de verdade) antes de te devolver
Ambiente mobile (390x844):
1) Abrir `/leads` no mobile.
2) Trocar para “Meta Ads” (via dropdown do seletor mobile):
   - Confirmar: não existe rolagem horizontal da página.
   - Confirmar: seção “Campanhas” aparece em cards empilhados, legível.
3) Trocar para “Google Ads”:
   - Confirmar: não existe rolagem horizontal da página.
   - Confirmar: “Palavras-chave” não estoura largura.
   - Confirmar: “Campanhas” em cards, sem scroll lateral.
4) Tablet (ex.: 768px de largura):
   - Confirmar: layout fica em 2 colunas quando aplicável, sem overflow.
5) Desktop:
   - Confirmar: tabelas continuam em formato tabela com colunas completas.

Critérios de aceite (o que vai ficar “certo”)
- No celular:
  - Zero rolagem horizontal na página.
  - Campanhas em cards (não tabela) para Meta e Google Ads.
  - Textos longos truncam com reticências, sem estourar o layout.
- No tablet:
  - Layout fluido, sem precisar “arrastar para o lado”.
- No desktop:
  - Mantém o layout completo (tabela + colunas).

Arquivos envolvidos (previsto)
- `src/components/leads/charts/CampaignsTable.tsx`
- `src/components/leads/views/LeadsMetaView.tsx`
- `src/components/leads/views/LeadsGoogleAdsView.tsx`
- `src/components/leads/charts/KeywordsTable.tsx`
- (opcional, só se necessário) `src/pages/Leads.tsx`
