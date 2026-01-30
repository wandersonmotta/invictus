
Objetivo
- Ao clicar em “Comentários” no card do post, o painel (Drawer) deve abrir com estética “Invictus Glass” (vidro premium) aplicada no painel inteiro.
- O formulário de comentário no rodapé deve seguir o modelo da imagem: botão de emoji à esquerda, campo “pill” no centro e ação “Postar” à direita, com popover de emojis (sem dependências novas), mantendo o mesmo padrão visual do painel lateral.

O que já existe (e vamos reaproveitar)
- `src/components/feed/CommentsDrawer.tsx` já lista comentários, faz add/edit/delete/like via RPCs e usa Vaul Drawer.
- Tokens/estilos “glass” já existem no CSS (`invictus-surface`, `invictus-frame`, e também `invictus-modal-glass` para conteúdo tipo popover/modal).
- Componentes base existentes: `Popover`, `Button`, `Input`, `ScrollArea`, `Drawer*`.

Escopo exato aprovado (conforme sua escolha)
- “Drawer inteiro em glass”: aplicar visual glass no header, lista (área rolável) e rodapé (composer).
- Popover de emojis também ficará com glass (sem ficar transparente), com z-index alto.

Mudanças planejadas (Frontend)

1) Deixar o Drawer inteiro no modelo glass
Arquivo: `src/components/feed/CommentsDrawer.tsx`
- Atualizar `DrawerContent` (classe atual: `invictus-surface`) para incluir também moldura/vidro no painel inteiro:
  - adicionar `invictus-frame`
  - garantir borda consistente `border-border/70` (ou equivalente)
  - manter `overflow-hidden` para o vidro ficar “limpo”
- Ajustar o layout interno para suportar “rodapé fixo”:
  - transformar o miolo em um layout de coluna:
    - topo (título)
    - meio (lista rolável)
    - base (composer)
  - reduzir risco do composer “sumir” atrás do teclado no mobile:
    - manter padding e usar `ScrollArea` para o conteúdo com altura calculada (ex.: `h-[45vh]` já existe; vamos avaliar trocar por `flex-1` com `min-h-0` para ficar mais adaptável).
- Garantir contraste e não-transparência onde precisa:
  - Separador `border-t border-border/60` acima do rodapé
  - Header com o mesmo “glass surface” (sem ficar “see-through” demais)

2) Criar o composer no rodapé no estilo da imagem (emoji + pill + Postar)
Novo arquivo: `src/components/feed/FeedCommentComposer.tsx`
- UI:
  - Container do rodapé com `invictus-surface`
  - “pill” interno com borda suave: `rounded-full border border-border/60 bg-background/40` (ajustado para não ficar transparente demais no dark)
  - Botão de emoji (ícone) à esquerda
  - Campo de digitação central (single-line) com placeholder “Adicione um comentário…”
  - Botão “Postar” à direita (desabilitado quando vazio/pending)
- Comportamento:
  - Enter envia (como hoje), sem mandar se estiver vazio
  - Após enviar com sucesso: limpar input e manter foco
  - API/Mutations continuam no `CommentsDrawer` (composer recebe `value`, `onChange`, `onSubmit`, `disabled`), mantendo a lógica atual intacta.

3) Adicionar um Emoji Picker leve (Popover) com estética glass
Novo arquivo: `src/components/ui/emoji-popover.tsx` (ou `src/components/feed/emoji-popover.tsx`; vou seguir a pasta `ui/` por ser reutilizável)
- Implementar usando `Popover`, `PopoverTrigger`, `PopoverContent`
- Conteúdo:
  - Grid de emojis mais usados (sem lib externa)
  - Clique em um emoji insere no texto atual (versão 1: insere no final; versão 2 opcional: inserção na posição do cursor usando ref e selectionStart/selectionEnd)
- Estilo:
  - `PopoverContent` com `invictus-surface invictus-frame border-border/70` para ficar premium e não transparente
  - `z-50` já existe no popover base; manter/elevar se necessário (ex.: `z-[60]`) para não ficar atrás do Drawer

4) Integrar o composer dentro do CommentsDrawer
Arquivo: `src/components/feed/CommentsDrawer.tsx`
- Substituir o bloco atual de input + botão “Enviar” por `<FeedCommentComposer />`
- Conectar o botão “Postar” ao `addMutation.mutate()`
- Ligar o emoji picker para atualizar `body` do comentário (ex.: `setBody(prev => prev + emoji)`)
- Melhorias de UX:
  - Ao abrir o Drawer: focar automaticamente o campo do composer (passando ref do input para o `CommentsDrawer` ou expondo `autoFocus` controlado pelo open state)

5) (Opcional, mas combina com o visual) Atualizar o trigger “Comentários (N)”
Arquivos possíveis:
- `src/components/feed/CommentsDrawer.tsx` (no `DrawerTrigger`)
- Se preferir no card: `src/components/feed/FeedPostCard.tsx`
Mudança:
- Trocar o botão textual por ícone + contador (ex.: `MessageCircle`) mantendo acessibilidade (`sr-only` com “Abrir comentários”).
Observação: isso é opcional; só farei se você confirmar que quer esse ajuste também.

Pontos de atenção / qualidade
- Evitar “dropdown see-through”: Popover e Drawer terão `bg`/surface suficiente para não ficar transparente demais.
- Z-index: garantir que o popover de emojis fique acima do Drawer e não seja cortado; se necessário, aumentar z-index do `PopoverContent`.
- Responsividade: manter max-width e estética minimalista já existente; o Drawer é full width, mas o conteúdo interno pode continuar centralizado e legível.
- Consistência com o app: usar os tokens/classe “Invictus” existentes, sem criar dependências.

Checklist de testes (end-to-end)
1) Feed → abrir um post → clicar em Comentários → confirmar que o painel inteiro está em glass (fundo + moldura).
2) Digitar comentário no “pill” → “Postar” habilita/desabilita corretamente → enviar → comentário aparece e contador atualiza.
3) Abrir emoji picker → escolher emoji → emoji entra no campo → enviar.
4) Mobile: abrir comentários, abrir teclado, garantir que o campo continua acessível e a lista rola normalmente.
5) Verificar que o popover de emojis não fica transparente e não fica atrás do painel.

Arquivos que serão criados/alterados
- Criar:
  - `src/components/feed/FeedCommentComposer.tsx`
  - `src/components/ui/emoji-popover.tsx`
- Editar:
  - `src/components/feed/CommentsDrawer.tsx`
  - (Opcional) `src/components/feed/FeedPostCard.tsx` se formos trocar o trigger por ícone

Observação importante
- Isso é 100% frontend/UI. Não exige nenhuma alteração no backend, nem em tabelas/RPCs, porque vamos reutilizar exatamente o fluxo atual de comentários.
