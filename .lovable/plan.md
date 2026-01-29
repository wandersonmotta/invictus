
Objetivo (o que você pediu agora)
1) O mapa precisa ficar “Invictus”: mais escuro, com sensação de vidro (glaze) no “oceano/área ao redor”, e com os países/terra puxando para dourado (não cinza genérico).
2) Pins precisam virar foto circular da pessoa, com destaque cromado/metálico nas bordas (premium).
3) Remover controles confusos:
   - Tirar “Brasil” e “Em mim” (texto/botões)
   - Tirar zoom +/− (ou substituir por algo bem discreto)
   - Manter só 1 botão “localizar” (geo referência) como ação principal.
4) Manter privacidade: localização aproximada (jitter) continua.

Diagnóstico rápido do estado atual
- O mapa está usando tiles padrão OSM + filtro CSS. Isso tende a ficar “cinza genérico”, porque tile raster não separa “água”/“terra” de forma controlável.
- Os pins hoje são um divIcon dourado; não usam foto.
- A RPC `get_approved_member_pins` (backend) não retorna `avatar_url`, então o front não tem como renderizar a foto no pin sem mudar essa função.

Estratégia para ficar realmente “Invictus” (sem virar gambiarra)
A) Visual do mapa (único, Invictus, com glaze + países dourados)
- Você escolheu “Mapa premium (com chave)”. Vou implementar assim:
  1) Trocar a camada de tiles por um provedor premium (ex.: Mapbox/MapTiler) com um “style” próprio voltado para: fundo escuro + terra dourada.
  2) Por cima, manter o “Invictus overlay” (pattern microgrid + sweep gold + vinheta) para dar assinatura da marca.
  3) “Glaze/vidro” no oceano: em mapa raster não existe transparência real por camada, então faremos a sensação de vidro por composição:
     - reduzir opacidade dos tiles para deixar o background “glass” do container aparecer
     - aplicar overlays com gradientes e blur (já existe parte disso) para parecer água vitrificada
     - ajustar blend modes para não “lavar” o dourado.

Importante (dependência para o “países dourados” ficar perfeito)
- Para países realmente dourados (terra) e água vitrificada, precisamos de um “map style” próprio do provedor premium.
- Vou preparar o app para receber um `MAP_STYLE_URL` (ou `STYLE_ID`) + `TOKEN`.
- Se você já tiver um style pronto: me passa o style URL/ID.
- Se você não tiver: eu implemento com um style premium recomendado como base + filtro Invictus por cima; depois refinamos quando você me passar o style final.

B) Pins com foto circular + borda cromada/metálica (obrigatório ter foto)
1) Backend: atualizar a função `public.get_approved_member_pins` para também retornar:
   - `avatar_url` (da tabela `profiles`)
   - opcional: `display_name` (para tooltip, se você quiser)
2) Como a foto é obrigatória:
   - A função vai filtrar apenas membros aprovados com `avatar_url IS NOT NULL` (assim não aparecem pins “quebrados”).
   - Se existir aprovado sem foto hoje, ele simplesmente não aparece no mapa até preencher (isso bate com o “obrigatório”).
3) Frontend:
   - Ajustar `ApprovedMemberPin` para incluir `avatar_url`.
   - No `MemberMap`, trocar o `goldIcon` “genérico” por um `divIcon` que renderiza:
     - `<img src="...">` circular
     - anel cromado metálico + detalhe dourado (uma borda dupla: chrome + gold line)
     - glow sutil e sombra de profundidade
   - O tooltip pode continuar glass; opcionalmente mostrar nome/cidade.

C) Controles (simplificar para “um único localizar”)
- No `MemberMap.tsx`:
  - Remover o bloco do zoom +/− (Plus/Minus) completamente.
  - Manter apenas 1 botão: ícone “Localizar” (LocateFixed).
  - O comportamento do botão:
    1) Se existir `centerMe` (local aproximado do perfil), centraliza nele.
    2) Se não existir, tenta `navigator.geolocation` (caso o usuário permita).
- Zoom fica via:
  - mouse wheel / trackpad no desktop
  - pinch no mobile
  - double tap / double click (Leaflet já suporta), deixando a UI limpa e premium.

Mudanças planejadas (arquivos / backend)
1) Backend (migração SQL)
- Alterar `public.get_approved_member_pins`:
  - RETURNS TABLE passa a incluir `avatar_url text` (e opcionalmente `display_name text`)
  - SELECT passa a pegar esses campos de `public.profiles`
  - Adicionar filtro `p.avatar_url IS NOT NULL` (já que foto é obrigatória)
- Manter `SECURITY DEFINER` + `GRANT EXECUTE` como está.
- Não mexer em RLS de `profiles` (a função já faz o papel de expor somente o necessário).

2) Frontend (TypeScript/React)
- `src/components/map/useApprovedMemberPins.ts`
  - Atualizar tipo `ApprovedMemberPin` para incluir `avatar_url` (+ opcional display_name).
- `src/components/map/MemberMap.tsx`
  - Remover controles de zoom (+ e −).
  - Manter só o botão de localizar (um único controle).
  - Criar `iconForPin(p)` (memoized) para gerar `divIcon` com `<img ...>` e classes novas.
  - Ajustar tooltip para continuar premium (pode mostrar city/state e, se desejar, nome).
- `src/styles/invictus-map.css`
  - Criar um “avatar pin” novo:
    - `.invictus-map-avatar-pin`, `.invictus-map-avatar-img`, `.invictus-map-avatar-ring`
    - “chrome ring” (efeito metálico) com gradient frio (cinza) + highlights, e um filet dourado interno.
  - Ajustar o mapa para ficar menos “cinza” e mais “Invictus”:
    - se tile premium for aplicado, reduzir dependência do filtro cinza e usar tonalização dourada + overlays.
  - Aumentar a sensação de glaze:
    - reforçar background do container com “glass ocean”
    - diminuir opacidade do tile pane e recalibrar contrast para não perder leitura.

3) Configuração de chave (necessária para “mapa premium”)
- Adicionar 1 variável de ambiente (segura e simples):
  - `VITE_MAP_PROVIDER_TOKEN` (ex.: Mapbox/MapTiler token)
  - e `VITE_MAP_STYLE_URL` (ou `VITE_MAP_STYLE_ID`)
- Eu vou solicitar esses valores no chat quando for implementar.
- Observação: token de mapa normalmente é “publicável” (não é segredo ultra sensível), mas ainda assim é melhor ficar como variável, não hardcoded.

Como vamos validar que ficou “padrão Invictus”
Checklist visual
- Mapa visivelmente mais dark (graphite), sem ficar “cinza morto”.
- Terra/países puxando para dourado (não amarelo neon).
- “Água”/área ao redor com sensação de vidro/glaze (profundidade e transparência).
- Overlay Invictus (pattern + sweep) aparece sutil, não polui.
Checklist de UX
- Só existe 1 controle: “Localizar”.
- Sem botões “Brasil/Em mim” e sem +/−.
- Clique em localizar centraliza corretamente (perfil primeiro; fallback para geolocalização do navegador).
Checklist de pins
- Pins são fotos circulares (obrigatório) e parecem “joia”: borda cromada metálica + detalhe dourado + glow sutil.
- Sem imagens quebradas (quem não tem foto não aparece).

Riscos / dependências
- “Países dourados + água transparente de verdade” depende do style premium do provedor. Sem style custom, dá para aproximar com filtros/overlays, mas o resultado máximo vem com o style certo.
- Se houver membros aprovados sem foto hoje, eles vão sumir do mapa até colocar foto (alinhado ao “obrigatório”).

Sequência de implementação
1) Backend: atualizar a RPC `get_approved_member_pins` para retornar `avatar_url` (e filtrar `NOT NULL`).
2) Frontend: atualizar tipos + hook + renderização dos pins com `<img>`.
3) UI: remover zoom +/− e manter apenas o botão “localizar”.
4) Trocar tiles para provedor premium com token + style e recalibrar o glaze/dourado (overlay final “Invictus”).
