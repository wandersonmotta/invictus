
Objetivo
- Deixar o mapa com a mesma “pegada Invictus” (dark executivo + glass + sofisticado), com:
  - Base do mapa em estilo dark executivo (sem “oceano azul”)
  - Moldura glass já existente + refinamentos (vinheta/overlay premium)
  - Pins dourados com glow (premium, não neon)
  - Tooltip glass (estilo card do app)
  - Controles do Leaflet (zoom) reestilizados com glass + linha dourada
  - Botões “Centralizar no Brasil” e “Centralizar em mim”
  - Entrada suave dos pins (animação ao carregar)

O que existe hoje (relevante)
- `MemberMap.tsx` usa Leaflet “puro” (imperativo) e renderiza markers padrão.
- O container do mapa já fica dentro de `invictus-surface invictus-frame`.
- `src/index.css` já contém o design system (graphite + gold) e import do Leaflet CSS.

Estratégia de design (sem trocar stack, sem mexer no backend)
1) “Dark executivo” na base do mapa
- Opção A (mais simples e confiável): manter OSM padrão e aplicar um “map filter” CSS no container do mapa:
  - reduzir saturação, aumentar contraste, reduzir brilho e aplicar leve hue-rotate neutro (para matar azuis)
  - adicionar uma vinheta/overlay com gradientes do próprio design system para dar profundidade e “premium feel”
- Opção B (melhor visual, depende de tiles externos): trocar para um tile dark (ex.: CARTO dark, Stadia, etc.). Como pode exigir chave/limites, vou implementar a Opção A como padrão e deixar a Opção B como toggle fácil no código.

2) Pins dourados com glow (premium)
- Trocar `L.marker()` padrão por `L.marker(..., { icon: L.divIcon(...) })` usando HTML/CSS:
  - Pin/anel dourado com borda metálica (gold-soft + gold-hot)
  - Glow suave com `drop-shadow` e “specular highlight”
  - Tamanho confortável mobile (área de toque maior)
- Benefícios:
  - 100% consistente com os tokens do app
  - Sem precisar de imagens externas
  - Fácil de animar (entrada suave)

3) Tooltip glass (premium)
- Em vez do tooltip padrão com fundo branco, usar classes customizadas:
  - `className: "invictus-map-tooltip"` no `bindTooltip`
- Estilizar no `src/index.css`:
  - fundo glass (hsl(var(--card)/alpha))
  - blur, borda sutil, linha dourada fina, tipografia e sombra controlada
  - garantir `z-index` alto e opacidade correta

4) Controles premium (zoom) + attribution discreto
- Estilizar `.leaflet-control-zoom` e botões:
  - fundo glass + borda + glow dourado sutil
  - hover com aura (somente desktop via media query)
- Attribution:
  - reduzir impacto visual (opacidade baixa), manter legível e acessível

5) Botões “Centralizar”
- Adicionar uma camada de UI por cima do mapa (dentro do mesmo card) com botões:
  - “Brasil” (fitBounds BRAZIL_BOUNDS)
  - “Em mim” (se `me` tiver `location_lat/lng`, centraliza e dá zoom)
- Onde buscar “me”:
  - Hoje isso está no `src/pages/Index.tsx`. Vou passar `me?.location_lat/lng` para `MemberMap` como props opcionais:
    - `centerMe?: { lat: number; lng: number } | null`
  - `MemberMap` expõe handlers que usam `mapRef.current?.fitBounds(...)` e `mapRef.current?.setView(...)`.

6) Animação de entrada dos pins
- No `divIcon` do marker, usar uma classe CSS (ex.: `invictus-pin`) com:
  - animação “scale-in / fade-in”
- Como os markers são DOM nodes criados pelo Leaflet:
  - aplicar classe no HTML do `divIcon`
  - CSS com keyframes (podemos reutilizar a linguagem de animação que vocês já usam; se não houver keyframes prontos no Tailwind para isso, adicionamos no CSS)

Mudanças planejadas (arquivos)
1) `src/components/map/MemberMap.tsx`
- Adicionar props:
  - `centerMe?: { lat: number; lng: number } | null`
  - opcional: `onReady?` se precisarmos sinalizar que o mapa inicializou (provavelmente não necessário)
- Trocar marker padrão por `divIcon` dourado:
  - `L.marker([p.lat, p.lng], { icon: goldIcon }).addTo(markers)`
- Tooltip com `className` custom:
  - `.bindTooltip(label, { direction: "top", opacity: 1, className: "invictus-map-tooltip", sticky: true })`
- Adicionar overlay UI (botões) dentro do wrapper do mapa, com `position: absolute`:
  - Requer ajustar o container para `relative`.

2) `src/pages/Index.tsx` (rota /mapa)
- Passar `centerMe` para o `MemberMap` quando houver coords do usuário:
  - `centerMe={me?.location_lat && me?.location_lng ? { lat: me.location_lat, lng: me.location_lng } : null }`
- (Opcional) colocar também um botão “Centralizar em mim” no card lateral; mas a melhor UX é ficar por cima do mapa.

3) `src/index.css`
- Adicionar um bloco de estilos “Invictus Map”:
  - `.invictus-map` para aplicar filtro dark executivo no tile pane (ex.: `.invictus-map .leaflet-tile-pane { filter: ... }`)
  - overlay/vinheta: pseudo-elemento no wrapper (ex.: `.invictus-map-overlay::before`)
  - tooltip glass: `.invictus-map-tooltip` + overrides do Leaflet tooltip
  - controles: `.invictus-map .leaflet-control-zoom a` etc.
  - garantir fundo não transparente e `z-index` correto (especialmente tooltip/controls)

Detalhes visuais (o “padrão Invictus” aplicado ao mapa)
- “Dark executivo”:
  - filtro base sugerido (ajustaremos fino após ver no preview):
    - `saturate(0.35) contrast(1.15) brightness(0.78) sepia(0.18)`
- Vinheta/overlay:
  - gradientes com `--primary` e `--foreground` em baixa opacidade para “luxo” e profundidade
- Pins:
  - ouro: `--gold-hot` e `--gold-soft`
  - glow: `drop-shadow(0 0 16px hsl(var(--primary)/0.35))` (controlado)

Critérios de aceite (como você valida que ficou “do jeito do site”)
- O mapa não parece “claro/azulado”; ele entra no mood graphite do app.
- O card do mapa mantém o glass premium; a área do mapa ganha vinheta e contraste.
- Pins são claramente dourados, com brilho sofisticado (sem neon).
- Tooltip parece um mini “card invictus” (glass + borda).
- Controles de zoom não ficam “brancos padrão”; ficam premium.
- Botões “Brasil” e “Em mim” são intuitivos, discretos e premium.
- Ao carregar pins, a entrada é suave (não “pipoca” agressivo).

Riscos / observações
- Filtro CSS em tiles é o caminho mais “garantido” sem depender de terceiros. Se você quiser um tile dark específico depois, a troca é simples.
- No mobile, blur muito pesado pode custar performance; manteremos blur moderado e usaremos media queries para reforçar no desktop (como você já faz em `.invictus-surface`).

Sequência de implementação
1) Estilos base (CSS): invictus-map, tooltip, controles, overlay/vinheta
2) Pins dourados com `divIcon` + animação
3) Botões “Centralizar” por cima do mapa + wiring com `mapRef`
4) Ajustes finos (contraste/brilho do filtro) com base no preview em /mapa (desktop + mobile)
