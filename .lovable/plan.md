
Objetivo
- Na tela /mapa, adicionar um “modo proximidade” opcional, onde o usuário escolhe um raio (10 a 200 km) baseado na localização em tempo real do dispositivo.
- Preservar privacidade: não exibir a localização exata do usuário (nem um pin preciso), apenas uma referência aproximada e um círculo de raio.
- Mostrar quem está próximo dentro do raio, permitindo clicar para ver detalhes (expertise, bio) e fazer ações (ver perfil, seguir, iniciar mensagem).
- Manter também o modo “Mapa global” (todos os membros) como já existe hoje.

O que vou verificar/usar do que já existe
- /mapa está em `src/pages/Index.tsx` e usa:
  - `useApprovedMemberPins()` -> RPC `get_approved_member_pins` (já traz pins com jitter e respeita privacidade).
  - `MemberMap` (Leaflet) que renderiza pins e tem botão de geolocalização.
- Já existe RPC `get_public_profile(p_user_id)` retornando `bio`, `city/state`, `expertises`, `username`, etc. (ideal para carregar detalhes ao clicar em um membro).
- Já existe follow: RPC `toggle_follow` e stats via `get_follow_stats` (usado em /membro e /buscar).
- Já existe iniciar conversa: RPC `create_conversation` (usado em `NewMessageDialog`).

Regras de acesso (conforme pedido)
- Modo proximidade: disponível apenas para membros aprovados.
  - Se o usuário não for aprovado, mostrar um card explicando que o recurso fica disponível após aprovação (sem quebrar o mapa global).
- Os pins já vêm somente de aprovados e com filtros de visibilidade (members/mutuals/private) via backend; manter essa regra.

UX (como vai ficar na prática)
1) Toggle de modo
- No painel lateral da página /mapa (onde hoje tem “Seu status” e “Pins”), adicionar uma seção “Proximidade”.
- Um seletor simples:
  - “Mapa global” (padrão): mostra todos os pins como hoje.
  - “Perto de mim”: ativa geolocalização do dispositivo e habilita o slider de raio.

2) Slider de raio (10–200 km)
- Slider com step de 10 km, min 10, max 200.
- Exibir texto: “Raio: 80 km” e “Encontrados: 12 membros”.
- Atualizar em tempo real o filtro e o círculo no mapa ao mover o slider.

3) Solicitação de GPS (permissão)
- Ao ativar “Perto de mim”, pedir permissão do navegador usando Geolocation API.
- Usar `watchPosition` para atualizar em tempo real (se a pessoa se mover, os resultados mudam).
- Se negar permissão, mostrar mensagem clara e um botão “Tentar novamente”.

4) Privacidade da localização do usuário
- Guardar internamente a localização exata apenas em memória (state), somente para cálculo de distância.
- Para exibição no mapa:
  - Não criar “marker” do usuário.
  - Desenhar apenas um círculo de proximidade centrado em uma coordenada aproximada do usuário:
    - Ex.: arredondar lat/lng para 2 casas decimais (aprox. 1 km) antes de desenhar o círculo e antes de qualquer reverse-geocode.
- Texto no UI: “Sua localização é aproximada (privacidade).”

5) Lista de “membros próximos”
- Abaixo do slider (ou em um Card dedicado), renderizar uma lista dos membros dentro do raio (ordenados por distância).
- Cada item:
  - Avatar + nome + cidade/UF + distância (ex.: “23 km”).
  - Clique abre um mini-modal/painel com detalhes (bio + expertises) carregados via `get_public_profile`.
  - Ações:
    - “Ver perfil” (vai para `/membro/:username`).
    - “Seguir/Seguindo” (toggle follow).
    - “Mensagem” (cria conversa DM e navega para `/mensagens/:conversationId`).

Implementação técnica (frontend)
A) Criar um hook para localização do dispositivo
- Novo hook (por ex. `src/components/map/useDeviceLocation.ts`):
  - `status`: "idle" | "requesting" | "granted" | "denied" | "error"
  - `exact`: { lat, lng } | null  (apenas em memória)
  - `approx`: { lat, lng } | null  (arredondada)
  - `start()` para iniciar `watchPosition`
  - `stop()` para limpar o watch
  - Guardar `watchId` em ref
  - Configurar options: `{ enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 }`

B) Cálculo de distância e filtro por raio
- Função util (pode ficar no próprio hook ou em `src/lib/geo.ts`):
  - Haversine (km) entre `exact` (user) e `pin.lat/lng`.
- No `Index.tsx`:
  - `mode: "global" | "nearby"`
  - `radiusKm` state (default 80)
  - `nearbyPins = pins.filter(distance <= radiusKm)` (usando `exact`)
  - `nearbySorted = nearbyPins.map(withDistance).sort(distance asc)`

C) Atualizar `MemberMap` para suportar:
- Mostrar círculo do raio (sem marker do usuário)
  - Props novas:
    - `radiusCenter?: { lat; lng } | null` (usar approx)
    - `radiusKm?: number | null`
    - `showRadius?: boolean`
- Detectar mudanças e atualizar um `L.Circle` via refs:
  - criar circle uma vez quando `showRadius && radiusCenter`
  - atualizar `setLatLng` e `setRadius(radiusKm * 1000)` quando mudar
  - remover circle quando sair do modo proximidade
- Seleção de membro
  - Adicionar prop `onSelectPin?: (userId: string) => void`
  - Nos markers: registrar `marker.on("click", () => onSelectPin?.(p.user_id))`

D) Modal/Painel de detalhes do membro
- Criar componente (ex.: `src/components/map/MemberQuickProfileDialog.tsx`):
  - Recebe `userId` selecionado (ou null)
  - Query (React Query) chamando `supabase.rpc("get_public_profile", { p_user_id: userId })`
  - Renderiza:
    - Avatar, display_name, @username, cidade/UF
    - Chips de expertises (reusar `ExpertisesChips` se encaixar)
    - Bio
  - Botões:
    - Ver perfil: usa `username` para navegar
    - Seguir: `toggle_follow`
    - Mensagem: `create_conversation` tipo “dm” com `[userId]`, navegar para rota da conversa
  - Estado de loading/erro com toasts.

E) Ajustes no `Index.tsx` (/mapa)
- UI:
  - No `<aside>` adicionar Card “Proximidade”
    - Se `me?.access_status !== "approved"`: mostrar bloqueio.
    - Se aprovado:
      - Toggle “Mapa global / Perto de mim”
      - Ao ativar “Perto de mim”: chamar `start()` do hook
      - Slider (Radix Slider já existe em `src/components/ui/slider.tsx`)
      - Contagem de resultados e lista curta
- Map render:
  - Se modo global: `pins={pins}`
  - Se modo proximidade: `pins={nearbyPins}` (ou oferecer um switch “Filtrar pins no mapa”)
  - Passar `showRadius`, `radiusCenter={approx}`, `radiusKm`
  - Passar `centerMe` como hoje (se existir no profile) mas quando modo proximidade estiver ativo, dar prioridade à localização do dispositivo para “centralizar”.

F) (Opcional, mas recomendado) “cidade/estado aproximado” do usuário sem expor precisão
- Fazer reverse geocode usando lat/lng aproximados (arredondados) para obter um texto “Perto de: Cidade/UF”.
- Implementar com caching em memória e debounce (ex.: 1 chamada por mudança relevante).
- Se falhar: mostrar apenas “Perto de você”.

Cuidados e edge cases
- Permissão negada: manter mapa global funcional e mostrar “Você negou o acesso ao GPS”.
- Sem suporte no navegador: mostrar mensagem “Seu dispositivo não suporta geolocalização”.
- Performance: não disparar queries por membro; só buscar `get_public_profile` do membro selecionado (1 por vez).
- Privacidade: nunca renderizar marker do usuário, nunca salvar localização no backend, e usar apenas coordenada aproximada para UI/overlay.

Checklist de testes (end-to-end)
- /mapa com usuário aprovado:
  - Alternar para “Perto de mim” -> pedir permissão -> resultados aparecem.
  - Mover slider 10/80/200 -> pins filtram e círculo muda.
  - Clicar em pin -> abre painel -> mostra bio/expertises -> “Seguir” funciona -> “Mensagem” abre conversa.
- /mapa com usuário não aprovado:
  - Seção proximidade bloqueada, mapa global continua ok.
- Negar permissão:
  - Mensagem clara e opção de tentar novamente, sem quebrar o resto.

Arquivos que provavelmente serão alterados/criados
- Editar:
  - `src/pages/Index.tsx` (UI do modo proximidade + slider + lista + integração com mapa)
  - `src/components/map/MemberMap.tsx` (círculo de raio + clique em pin)
- Criar:
  - `src/components/map/useDeviceLocation.ts` (watchPosition + estado + approx)
  - `src/components/map/MemberQuickProfileDialog.tsx` (detalhes + ações)
  - (Opcional) `src/lib/geo.ts` para haversine e arredondamento

Sem mudanças no backend
- Para o que você pediu (raio + clique + detalhes + conexões), dá para fazer usando os RPCs já existentes (`get_approved_member_pins`, `get_public_profile`, `toggle_follow`, `create_conversation`) sem mexer no banco.
