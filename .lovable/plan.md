
Contexto do que você quer (comparando seus prints)
- Hoje: ao clicar na publicação abre um modal com a mídia à esquerda e, à direita, botões “Curtir / Comentários” + legenda + botão “Ir para o Feed”. Para ver comentários você ainda precisa abrir o Drawer.
- Objetivo (estilo Instagram): ao abrir a publicação, os comentários já aparecem “do lado” (painel direito), com rolagem própria e UM ÚNICO formulário fixo embaixo para comentar, sem abrir drawer/modal extra. E remover “Ir para o Feed” (já existe o X para fechar).

Diagnóstico do que está no código agora
- O modal “Publicação” que aparece no perfil está em:
  - `src/pages/Membro.tsx` (rota atual do print: `/membro/:username`)
  - `src/components/profile/MyProfilePreview.tsx` (preview do próprio perfil)
- Ambos renderizam:
  - Esquerda: `<ReelsMedia />`
  - Direita: botões + legenda (e no Membro tem “Ir para o Feed”)
  - Comentários: via `<CommentsDrawer postId count />` (abrindo Drawer)
- O “Ir para o Feed” está explicitamente em `src/pages/Membro.tsx` (linhas ~303–305).

O que vamos construir (para ficar igual ao modelo do Instagram)
1) Criar um painel fixo de comentários (sem Drawer)
- Criar um novo componente reutilizável (ex.: `src/components/feed/PostCommentsPanel.tsx`) que:
  - Recebe `post` (para mostrar autor/legenda/contagens) e `postId`
  - Busca comentários via RPC `list_feed_post_comments` SEM depender de “open”
  - Renderiza em layout de coluna:
    - Header do painel (autor + menu opcional)
    - “Bloco da legenda” (username + caption) no topo da lista (igual Instagram)
    - Lista de comentários rolável (`ScrollArea` com `min-h-0 flex-1`)
    - Footer fixo com o composer (reutilizando `FeedCommentComposer`, que você já aprovou)
  - Mantém ações de comentário que já existem hoje:
    - Curtir comentário (coração) via `toggle_feed_comment_like`
    - Editar/Apagar via menu (⋯) como você pediu
    - Add comentário via `add_feed_post_comment`
- Importante: não vamos criar novas tabelas nem mexer no backend. É 100% UI reaproveitando as mesmas RPCs.

2) Ajustar o modal da publicação para layout “mídia + painel”
- Atualizar `src/pages/Membro.tsx` e `src/components/profile/MyProfilePreview.tsx` para:
  - Remover o botão “Comentários (N)” que abre Drawer
  - Renderizar o novo `<PostCommentsPanel />` no lado direito do modal
  - Manter “Curtir” do post, mas colocar no padrão do painel (no header do painel ou numa barra abaixo do header)
- Layout sugerido (desktop):
  - `DialogContent`: mais largo (ex.: `sm:max-w-5xl` ou `max-w-6xl`) e altura controlada
  - Grid: esquerda flexível, direita com largura fixa tipo Instagram (ex.: `md:grid-cols-[minmax(0,1fr)_420px]`)
  - Altura: `max-h-[85vh]` e `overflow-hidden` para permitir rolagem só no painel de comentários
- Layout (mobile):
  - Em telas pequenas, empilhar:
    - Mídia em cima
    - Painel de comentários embaixo
  - Composer sempre visível no final do painel

3) Remover “Ir para o Feed”
- Remover o botão “Ir para o Feed” de `src/pages/Membro.tsx` (não faz sentido com o X do modal, como no seu print).

4) Manter consistência visual “Invictus Glass”
- Aplicar `invictus-surface invictus-frame border-border/70` no painel direito
- Separadores como no Instagram: borda suave (`border-border/60`) entre header / lista / composer
- Garantir que o ScrollArea não “estoura” o modal:
  - `min-h-0` no container e `flex-1` no miolo do painel

5) Atualizar contadores (evitar “bug visual” depois de comentar)
Hoje você já viu situações em que o comentário existe mas o contador/visual não atualiza “na hora”.
Para o painel lateral, vamos garantir:
- Ao comentar:
  - invalidar `["feed_comments", postId]`
  - invalidar `["feed_posts"]` (para feed)
  - invalidar também listas de perfil:
    - `invalidateQueries({ queryKey: ["profile_feed"], exact: false })`
    - `invalidateQueries({ queryKey: ["my-profile-feed"], exact: false })`
- Opcional (recomendado): o painel pode atualizar o contador na UI imediatamente via callback:
  - `onCommentCountChange(delta)` para o componente pai atualizar `selectedPost.comment_count` sem esperar refetch

Arquivos que serão criados/alterados
- Criar:
  - `src/components/feed/PostCommentsPanel.tsx` (novo painel estilo Instagram)
- Alterar:
  - `src/pages/Membro.tsx` (trocar Drawer por painel e remover “Ir para o Feed”)
  - `src/components/profile/MyProfilePreview.tsx` (trocar Drawer por painel)
  - (Possível) pequenos ajustes de classe em `DialogContent` (largura/altura) nos dois arquivos
- Reutilizar sem mexer:
  - `src/components/feed/FeedCommentRow.tsx` (já está com menu ⋯ e coração)
  - `src/components/feed/FeedCommentComposer.tsx` (já está no padrão do Instagram)
  - RPCs existentes (sem mudanças no backend)

Checklist de testes (end-to-end) que eu vou executar após implementar
1) Perfil (/membro/:username)
   - Abrir uma publicação: confirmar que comentários aparecem do lado sem clicar em “Comentários”
   - Rolar a lista de comentários (ScrollArea)
   - Comentar no formulário fixo: comentário aparece e contador atualiza
   - Curtir um comentário (coração): atualiza o estado/contador
   - No seu comentário: abrir menu ⋯ → Editar → Salvar; depois ⋯ → Apagar
2) Preview do próprio perfil (MyProfilePreview)
   - Repetir os mesmos testes
3) Responsividade
   - Desktop: mídia + painel lado a lado
   - Mobile: painel abaixo, composer sempre acessível (sem “sumir” atrás do teclado)
4) Remoção do botão
   - Confirmar que “Ir para o Feed” não aparece mais no modal

Riscos/atenções (para evitar ficar “bugado”)
- Altura/overflow: se o `DialogContent` não tiver `max-h` + `overflow-hidden`, a rolagem pode “quebrar” e empurrar o modal (vou travar isso).
- Cache/contadores: se só invalidar `feed_posts`, o perfil pode não atualizar; por isso vou invalidar também as queries de perfil e (opcionalmente) atualizar o contador local.

Resultado final esperado (como no Instagram)
- Clique na publicação → abre modal
- Mídia grande à esquerda
- À direita: header + legenda + comentários roláveis + campo “Adicione um comentário…” com botão “Postar” fixo embaixo
- Sem botão “Ir para o Feed” (fecha no X)
