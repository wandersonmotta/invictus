
Objetivo (o que você pediu agora)
- Melhorar os “quadrados/painéis” para ficarem mais premium e menos “caixa pesada”, mantendo a legibilidade.
- Colocar ícones (discretos) em pontos estratégicos:
  - Nos 4 pilares
  - Em “O que você encontra aqui”
- Adicionar animações leves de entrada (sem poluir).
- Adicionar até 2 vídeos em loop (tipo GIF), abstratos e elegantes, sem texto, em preto e branco com detalhes dourados, colocados estrategicamente.

O que existe hoje (base atual)
- As seções da landing usam um wrapper comum (`SectionShell`) que agora envolve o conteúdo com `.invictus-landing-panel`.
- O componente `WaitlistHero` já está no final e usa `Dialog` com animação nativa (tailwind-animate via data-state).
- O projeto já usa `lucide-react` e já tem infra de animações via `tailwindcss-animate` (classes `animate-in`, `fade-in-*`, `slide-in-*`, etc.).

Parte 1 — Refinar os “quadrados” (painéis) sem perder legibilidade
1) Ajustar o estilo do painel `.invictus-landing-panel` para ficar menos “quadrado” e mais “luxo editorial”
- Trocar o fundo chapado por um “glass” mais sofisticado (gradiente + leve vinheta interna):
  - background com gradient (ex.: de background/0.62 para background/0.42)
  - border com opacidade menor + “borda dourada” bem sutil (via `box-shadow` ou `border-image`/pseudo-elemento)
  - aumentar um pouco o blur (ou manter 10px e ajustar contraste)
- Adicionar variações leves para densidade:
  - `.invictus-landing-panel--soft` (mais transparente)
  - `.invictus-landing-panel--strong` (mais opaco para trechos com muita letra)
  (isso permite aplicar “strong” só nas seções com muito texto)

2) Ajustar tipografia e espaçamento dentro do painel
- Aumentar levemente line-height e/ou tamanho de fonte em parágrafos longos (sem “inflar” demais)
- Garantir contraste: textos `text-muted-foreground` podem ficar claros demais no fundo; vamos:
  - reduzir o uso de `muted-foreground` em blocos grandes e usar `text-foreground/90` em trechos críticos
  - manter `muted` apenas para subtítulos, descrições curtas

3) Manter performance
- Evitar blur exagerado e evitar sombras pesadas.
- Manter o parallax/fixed background apenas em telas maiores (já está assim).

Parte 2 — Ícones (Pilares + “O que você encontra aqui”)
4) Pilares: adicionar ícone por pilar (discreto, dourado, pequeno)
- Em `Pillars()`, trocar o bloco atual por layout com:
  - ícone no topo (ou à esquerda) + título + texto curto
- Escolha de ícones (exemplo de mapeamento, ajustável):
  - Disciplina: `Shield` ou `BadgeCheck`
  - Execução: `Zap` ou `Hammer`
  - Resultado: `Target`
  - Verdade: `Eye` ou `ScanFace`
- Estilo:
  - `size={18}` ou `20`
  - cor: `text-primary/80` (sem ficar neon)
  - adicionar um “halo” sutil (ex.: `drop-shadow` bem leve) só se necessário

5) “O que você encontra aqui”: adicionar ícone por item (sem virar lista infantil)
- Em `WhatYouFindHere()`, trocar a bolinha por:
  - ícone minimalista (ex.: `ChevronRight`/`Sparkle`/`Dot`)
  - OU (melhor): 1 ícone por categoria (3 colunas) e dentro de cada coluna manter bullets — para não ter 6 ícones diferentes e poluir.
- Vou implementar a versão mais limpa:
  - 3 grupos (2 itens cada) com um ícone por grupo
  - mantém leitura premium e reduz “ruído visual”

Parte 3 — Animações leves de entrada (sem poluição)
6) Implementar animação “entrada suave” por seção quando aparecer na tela
- Criar um hook simples com `IntersectionObserver` (ex.: `useRevealOnScroll`) que:
  - aplica `opacity: 0` + `translateY(8px)` inicialmente
  - quando entra no viewport, adiciona classes `animate-in fade-in-0 slide-in-from-bottom-2` (ou equivalente)
  - respeita `prefers-reduced-motion` (se usuário preferir reduzir, não anima)
- Aplicar no wrapper do `SectionShell` (ou no `.invictus-landing-panel`) para animar cada seção uma vez.

7) Garantir consistência com Radix UI (Dialog etc.)
- Não mexer nas animações do modal (já estão corretas).
- Só adicionar as animações de entrada nas seções da landing.

Parte 4 — Vídeos abstratos em loop (máximo 2) e colocação estratégica
8) Gerar 2 vídeos curtos, abstratos, estilo “cinemagraph”
- Formato recomendado:
  - `.mp4` com H.264 (compatibilidade) + opcional `.webm` (melhor compressão)
  - duração 3–6s, loop perfeito
  - sem áudio
  - resolução moderada (ex.: 720p) para não pesar
- Conteúdo visual (brief de geração):
  - preto e branco (textura de concreto/metal, skyline abstrato, linhas arquitetônicas)
  - pequenos brilhos dourados (poucos, sofisticados)
  - sem texto, sem símbolos óbvios

9) Onde colocar os vídeos (2 pontos bem estratégicos)
- Vídeo 1: na seção Manifesto (coluna direita), como “janela” vertical pequena (ou 4:5), com borda sutil e blur no fundo.
- Vídeo 2: na seção final (Lista de espera), ao lado do CTA, para reforçar “premium” sem poluir o texto.

10) Implementação de componente reutilizável de “LoopVideo”
- Criar um componente simples `LoopVideo` (React) que renderiza:
  - `<video autoPlay muted loop playsInline preload="metadata" />`
  - com `poster` opcional
  - com fallback visual (div com gradient) se o vídeo não carregar
  - respeita `prefers-reduced-motion`: se reduzir movimento, pausa o autoplay e mostra poster

11) Layout e responsividade dos vídeos
- Desktop: vídeo ao lado do texto (coluna).
- Mobile: vídeo vai para baixo (stack) e com altura limitada para não “empurrar” demais.

Checklist de QA (o que vou testar depois de implementar)
1) Legibilidade:
- Em desktop e mobile, rolar página inteira e verificar se nenhum texto “some” no fundo.
2) Ícones:
- Conferir se não virou “poluição” e se os ícones estão consistentes (mesmo peso/estilo/cor).
3) Animações:
- Conferir que é suave, não “pula”, e só acontece uma vez por seção.
- Conferir `prefers-reduced-motion` (simulado no browser).
4) Vídeos:
- Autoplay funciona no mobile (muted + playsInline).
- Não há áudio, não trava rolagem, e não pesa demais.
5) Regressão:
- Modal da lista de espera continua funcionando (validação + envio).
- /auth e /reset-password continuam com o fundo antigo.

Arquivos que eu vou mexer (implementação)
- `src/styles/invictus-auth.css`
  - refinar `.invictus-landing-panel` e adicionar variações
- `src/components/landing/ManifestoSections.tsx`
  - adicionar ícones em Pillars e reorganizar “O que você encontra aqui” em 3 grupos
  - aplicar animação de entrada via hook/atributo
  - inserir vídeo 1 no Manifesto
- `src/components/landing/WaitlistHero.tsx`
  - inserir vídeo 2 de forma discreta na área do CTA
- Novo(s) arquivo(s) de util/hook e componente:
  - `src/hooks/useRevealOnScroll.ts` (ou similar)
  - `src/components/landing/LoopVideo.tsx` (ou similar)
- Novos assets:
  - `public/videos/…` (2 vídeos em loop) + posters opcionais em `public/images/…`

Observações de “não poluir”
- Ícones: pequenos, monocromáticos dourados, sem animação própria (a animação fica só na entrada da seção).
- Vídeos: apenas 2, sem texto, com moldura discreta e tamanho controlado.
- O painel continua existindo para legibilidade, mas mais “luxo” (menos caixa pesada).

Entrega incremental (para você validar rápido)
- Etapa 1: Refino do painel + tipografia (legibilidade perfeita).
- Etapa 2: Ícones (pilares + encontra aqui).
- Etapa 3: Animação de entrada suave.
- Etapa 4: Inserir 2 vídeos em loop (gerados) + ajuste fino de tamanho e posição.
