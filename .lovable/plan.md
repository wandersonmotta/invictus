
Contexto do problema (pelos seus prints + o que existe hoje)
- No Feed (/feed), o post (principalmente vídeo 9:16) fica alto demais e “empurra” as ações (curtir/comentar) para fora da tela.
- Você quer o padrão do Instagram:
  1) No feed: mídia grande, porém com altura limitada para não “tomar a tela toda”.
  2) Ações no estilo IG (ícones) e um link/ação de comentários.
  3) Ao tocar na mídia, abrir o post em um modal “Instagram web” (mídia à esquerda + painel lateral de comentários à direita), igual ao que já ajustamos no perfil.
  4) Ao tocar em comentar, abrir o mesmo modal lateral já com foco no campo “Adicione um comentário…”.

Diagnóstico no código atual
- Feed é renderizado por:
  - `src/pages/Feed.tsx` → lista de `FeedPostCard`
  - `src/components/feed/FeedPostCard.tsx` → hoje renderiza:
    - `<ReelsMedia />` com ratio 9/16 para vídeo e 4/5 para foto (via `ReelsMedia.tsx`)
    - Botões “Curtir (N)” e `CommentsDrawer`
- O “modal estilo Instagram” existe hoje apenas no perfil:
  - `src/pages/Membro.tsx`
  - `src/components/profile/MyProfilePreview.tsx`
  - com `DialogContent` (935px / 720px) + `<PostCommentsPanel />`
- Portanto: o Feed ainda está no modelo antigo (card + drawer), e o vídeo 9:16 no card causa o problema de altura.

Objetivo (o que vamos entregar)
A) Feed com aparência mais Instagram e sem “tomar a tela”
- Limitar a altura da mídia no card do feed (especialmente vídeo), mantendo o conteúdo centralizado.
- Deixar as ações (curtir/comentar) sempre visíveis logo abaixo (estilo IG).

B) Modal do post no Feed igual ao do Perfil
- Ao tocar na mídia do post no feed, abrir um `Dialog` com:
  - Esquerda: mídia
  - Direita: `PostCommentsPanel` (comentários já carregados, scroll interno, composer fixo)
- Ao tocar no ícone de comentar, abrir o modal e focar automaticamente no campo de comentário.

Mudanças planejadas (frontend)
1) Criar um “viewer” reutilizável para post (para não duplicar lógica)
- Criar um componente novo (ex.: `src/components/feed/FeedPostViewerDialog.tsx`) que recebe:
  - `open`, `onOpenChange`
  - `post` (com `media_urls`, caption, liked_by_me, like_count, comment_count, autor)
  - `initialFocus?: "comment" | "none"`
- Esse componente vai usar o mesmo layout do modal do perfil:
  - `DialogContent` com:
    - `h-[min(80vh,720px)]`
    - `w-[min(935px,calc(100vw-1.5rem))]`
    - `max-w-none self-center mt-0 overflow-hidden p-0`
  - Container interno:
    - `flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_420px]`
    - Área da mídia com comportamento mobile: `h-[45vh]` (ou um valor mais ajustado, se necessário)
  - `PostCommentsPanel` do lado direito
- Benefício: depois podemos, se você quiser, reaproveitar esse mesmo viewer no perfil (reduzir duplicação).

2) Ajustar `PostCommentsPanel` para suportar “auto focus no composer”
- Adicionar uma prop opcional, por exemplo:
  - `autoFocusComposer?: boolean`
- Quando o modal abrir via “comentar”, o panel faz foco automático no input.
- Sem isso, o modal abre, mas o usuário ainda precisa tocar no campo.

3) Atualizar `FeedPostCard` para:
- Remover `CommentsDrawer` (modelo antigo)
- Trocar a área de ações para o padrão Instagram (ícones)
  - Curtir (coração)
  - Comentar (balão) → abre modal com foco no input
  - (Opcional) Compartilhar / Salvar (se você quiser; deixo pronto, mas podemos esconder no começo)
- Ao tocar na mídia:
  - abrir o novo `FeedPostViewerDialog` (igual Instagram)
- Ajustar o layout da mídia no card para “limitar altura”
  - Em vez de forçar sempre o ratio 9/16 ocupando toda a altura, vamos:
    - colocar a mídia dentro de um frame com `max-h-[70svh]` (ou similar)
    - usar “contain/centralizar” para não estourar a tela
  - Implementação mais segura:
    - criar um wrapper específico no card (sem mudar o comportamento do modal do perfil)
    - e/ou adicionar uma opção no `ReelsMedia` para `fit="contain"` + `maxHeightClassName`
- Resultado: ações ficam visíveis sem precisar rolar muito.

4) Garantir atualização de contadores no Feed (curtir/comentar)
- No card:
  - Like do post: seguir invalidando `["feed_posts"]`
- No modal:
  - Continuar usando os callbacks já existentes (`onPostLikeChange`, `onCommentCountChange`) para atualizar a UI imediatamente
  - Continuar invalidando queries (já existe no `PostCommentsPanel`) para sincronizar feed/perfis

Ajustes finos com base no seu modelo (Instagram)
- Medidas:
  - Desktop: 935px largura, painel direito 420px (igual ao que já usamos no perfil)
  - Mobile: mídia em cima + painel embaixo, com scroll interno e composer sempre visível
- Ordem e visual das ações (no Feed):
  - Linha de ícones logo abaixo da mídia
  - Contador de curtidas abaixo (ex.: “232,3 mil curtidas”)
  - Linha de legenda em seguida (autor + texto)
  - “Ver todos os comentários (N)” como link/ação que abre o modal

Arquivos que serão alterados/criados
- Criar:
  - `src/components/feed/FeedPostViewerDialog.tsx` (novo, reutilizável)
- Alterar:
  - `src/components/feed/FeedPostCard.tsx` (abrir modal ao tocar na mídia; ações estilo IG; limitar altura; remover drawer)
  - `src/components/feed/PostCommentsPanel.tsx` (prop `autoFocusComposer`)
  - (Possível) `src/components/feed/ReelsMedia.tsx` (somente se for necessário adicionar suporte “contain/max height” sem duplicar código; se não, fazemos tudo via wrapper no card)

Como eu vou testar (end-to-end)
1) No Feed (/feed)
- Confirmar que o vídeo/foto não “toma a tela toda” e que os ícones de curtir/comentar ficam visíveis
- Tocar na mídia → abre modal com mídia + painel de comentários (igual Instagram)
- Tocar no ícone de comentar → abre modal e já foca o input
- Curtir no feed e no modal → contador atualiza e sincroniza
- Comentar no modal → comentário aparece e contador atualiza (e o feed reflete)

2) Verificar que não quebramos o que já funciona no perfil
- Abrir modal no `/membro/:username` e no preview do perfil
- Confirmar layout e scroll ok, e que mudanças em `ReelsMedia` (se houver) não alteraram o comportamento do modal.

Riscos/atenções (e como vamos evitar)
- “Limitar altura” sem distorcer:
  - vamos priorizar “contain/centralizado” no feed para não cortar conteúdo e não empurrar ações para baixo
- Evitar duplicar viewer em vários lugares:
  - criar `FeedPostViewerDialog` e usar no Feed; depois, se você aprovar, podemos refatorar perfil para usar o mesmo componente também.

Entrega esperada depois dessa implementação
- No Feed, posts ficam com mídia grande porém com altura controlada, e ações visíveis.
- Ao tocar na mídia, abre o modal igual ao Instagram web (mídia esquerda, comentários direita).
- Ao comentar, abre o mesmo modal com foco no formulário de comentário.
