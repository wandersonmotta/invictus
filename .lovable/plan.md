
Contexto e decisões já confirmadas
- Feed estilo Instagram dentro do Invictus.
- Toggle no Feed: “Todos” e “Seguindo”.
- Interações: Curtidas e Comentários.
- Mídia: Fotos e vídeos (máx. 20MB por arquivo) com visual “Reels/Instagram”.
- Perfil público estilo Instagram (bio + grid + seguir + mensagem).
- Usuário pendente: não vê nada do Feed/Perfis/Buscar; única liberação é /perfil enquanto aguarda aprovação (isso já é compatível com o RequireAuth atual).

Objetivo do que vamos entregar (MVP completo do “Instagram interno”)
1) Nova área “Feed” com:
   - lista de posts (paginação)
   - criar publicação com múltiplas mídias (foto/vídeo)
   - visual de mídia tipo Reels (priorizando 9:16 e player clean)
   - curtir + comentar com contadores
   - toggle “Todos” / “Seguindo”
2) Perfil público (/membro/:username) com:
   - avatar, nome, @, bio, cidade/UF, expertises
   - contadores (posts, seguidores, seguindo)
   - botão Seguir/Seguindo
   - botão Mensagem (abre/inicia DM e navega para /mensagens/:conversationId)
   - grid de posts e modal com visual Reels
3) Buscar atualizado para:
   - mostrar “Seguir” e “Mensagem” no card do resultado
   - abrir o perfil público
4) Backend + storage seguros:
   - posts e mídia não ficam públicos
   - só usuário aprovado acessa
   - respeitar profile_visibility (members/mutuals/private)

Exploração rápida do que já existe (para reaproveitar)
- Controle de acesso: RequireAuth já bloqueia “pendente” para tudo exceto /perfil e /aguardando-aprovacao.
- Seguir: tabela follows já existe + função is_mutual_follow(a,b). Porém, por RLS, não dá para contar seguidores/seguindo do outro via SELECT direto; precisamos de RPCs para estatísticas e estado “estou seguindo?”.
- Mensagens: já existe RPC create_conversation(...) e send_message(...); UI em /mensagens já pronta.
- Upload privado: comunidade já usa storage privado + createSignedUrl para abrir anexos; vamos replicar essa abordagem para mídia do feed.

Parte 1 — Banco de dados / backend (Lovable Cloud)
1) Storage (arquivos do feed)
- Criar bucket privado: feed-media.
- Convenção de path (importante para validação/políticas):
  - {authorId}/{postId}/{randomUUID}-{filename}
- Políticas de acesso em storage.objects:
  - INSERT: só permite se auth.uid() == authorId (primeiro segmento do path) e usuário aprovado.
  - SELECT: só permite se usuário aprovado E pode ver o post associado (respeitando profile_visibility do autor + mutuals + self/admin).
  - Observação: vamos suportar “abrir mídia” via createSignedUrl (como já acontece em anexos da Comunidade). Isso mantém o bucket privado e seguro.

2) Tabelas novas (public schema)
- feed_posts
  - id uuid pk default gen_random_uuid()
  - author_id uuid not null
  - caption text null
  - created_at timestamptz default now()
  - updated_at timestamptz default now()
- feed_post_media
  - id uuid pk default gen_random_uuid()
  - post_id uuid not null (fk -> feed_posts.id on delete cascade)
  - storage_bucket text not null default 'feed-media'
  - storage_path text not null
  - content_type text null
  - size_bytes bigint null
  - width int null (opcional)
  - height int null (opcional)
  - sort_order int not null default 0
  - created_at timestamptz default now()
- feed_post_likes
  - post_id uuid fk
  - user_id uuid
  - created_at timestamptz default now()
  - primary key (post_id, user_id)
- feed_post_comments
  - id uuid pk default gen_random_uuid()
  - post_id uuid fk
  - author_id uuid not null
  - body text not null
  - created_at timestamptz default now()

Índices (para performance)
- feed_posts(author_id, created_at desc)
- feed_posts(created_at desc)
- feed_post_media(post_id, sort_order)
- feed_post_comments(post_id, created_at asc)
- feed_post_likes(post_id)

3) RLS / regras de segurança (críticas)
- Habilitar RLS em todas as tabelas do feed.
- Regras base:
  - Apenas usuários autenticados e aprovados podem usar feed (select/insert).
  - Criar:
    - Policy de INSERT/UPDATE/DELETE: somente autor (author_id = auth.uid()).
    - Policy de SELECT: somente quando viewer pode ver o autor conforme profile_visibility:
      - self: sempre
      - admin: sempre (via has_role(auth.uid(),'admin'))
      - members: qualquer aprovado
      - mutuals: somente se is_mutual_follow(viewer, author)
      - private: somente self/admin
- Likes:
  - INSERT/DELETE: auth.uid() = user_id (e aprovado)
  - SELECT: segue a mesma regra de “posso ver o post”
- Comments:
  - INSERT: auth.uid() = author_id (e aprovado) e viewer pode ver o post
  - DELETE (MVP): autor do comentário pode apagar (opcional)
  - SELECT: segue a mesma regra de “posso ver o post”

4) Funções RPC (para facilitar UI e contornar limitações de RLS/contagem)
Vamos criar funções “SECURITY DEFINER” (com search_path público) para:
- list_feed_posts(p_mode text, p_limit int, p_before timestamptz null)
  - p_mode = 'all' | 'following'
  - Retorna posts paginados com:
    - post_id, created_at, caption
    - author card seguro (display_name, username, avatar_url)
    - mídia (lista ordenada: storage_path, content_type)
    - counts (like_count, comment_count)
    - liked_by_me boolean
- create_feed_post(p_caption text, p_media jsonb)
  - Estratégia (robusta e simples):
    1) Frontend faz upload dos arquivos no bucket feed-media usando postId previamente gerado.
    2) Chama RPC create_feed_post com caption + lista de media (paths e metadados).
  - A função valida:
    - auth.uid() existe + is_approved()
    - todos os storage_path começam com “{auth.uid()}/{postId}/...”
    - cada arquivo <= 20MB (validação também no backend para segurança)
    - content_type permitido (image/*, video/mp4, video/webm, etc.)
- list_profile_feed_posts(p_user_id uuid, p_limit int, p_before timestamptz null)
  - Retorna posts do perfil + mídia + counts, respeitando visibility.
- get_public_profile_by_username(p_username text)
  - Baseado no que já existe, mas retornando os campos necessários para o perfil e garantindo as permissões.
  - Também retorna user_id para o resto das queries.
- get_follow_stats(p_user_id uuid)
  - Retorna followers_count, following_count e is_following boolean (viewer -> target)
  - Necessário porque a tabela follows não libera “ver seguidores do outro” diretamente.
- toggle_follow(p_target_user_id uuid) (opcional, mas melhora UX)
  - Se já segue: delete; senão: insert.
  - Alternativa: fazer insert/delete direto do frontend (também funciona com a RLS atual), e manter só get_follow_stats para contadores.

Parte 2 — Frontend (React)
1) Rotas e navegação
- Adicionar rota /feed (protegida por RequireAuth).
- Adicionar rota /membro/:username (protegida por RequireAuth).
- Adicionar item “Feed” no AppSidebar (seção Início), com ícone apropriado (ex.: layout-grid / image).

2) Página Feed (/feed)
Componentes sugeridos:
- FeedPage
  - Toggle: “Todos” / “Seguindo” (Tabs ou ToggleGroup)
  - Lista de posts (React Query + paginação por p_before)
  - Botão “Nova publicação”
- NewFeedPostDialog
  - Upload múltiplo (ex.: até 10 arquivos)
  - Validações:
    - vídeo <= 20MB
    - imagem <= 20MB (ou menor, mas você pediu 20MB padrão por arquivo)
    - tipos aceitos: image/*, video/mp4, video/webm
  - Preview:
    - imagem: thumbnail
    - vídeo: thumbnail/mini-player muted
  - Ao publicar:
    1) Gera postId (uuid) no frontend
    2) Faz upload de cada arquivo para `feed-media` com path {authorId}/{postId}/...
    3) Chama RPC create_feed_post(caption, media[])
    4) Invalida queries do feed e fecha modal
- FeedPostCard
  - Header: avatar + nome + @ + tempo
  - Mídia:
    - Carrossel (embla-carousel-react) se múltiplas mídias
    - Visual “Reels”: container com aspect ratio 9/16 (ou “fit” com fundo)
    - Vídeo: <video controls playsInline> com UI limpa; no card pode ser controls minimal, e no modal (abrir ao clicar) fica mais “Reels”
  - Ações:
    - Curtir (toggle) + contador
    - Comentários (abre drawer/modal com lista + input)
- CommentsDrawer/Modal
  - Lista de comentários + input de comentário
  - Envio via RPC (ou insert direto, se optarmos por isso)

3) Perfil público (/membro/:username)
- PublicProfilePage
  - Query: get_public_profile_by_username(username)
  - Botões:
    - Seguir/Seguindo (toggle_follow ou insert/delete + refresh stats)
    - Mensagem:
      - chamar create_conversation('direct', [me, target]) e navegar para /mensagens/:id
  - Estatísticas:
    - get_follow_stats(targetUserId)
    - post_count (via RPC do feed ou agregação no backend)
  - Grid de posts:
    - thumbnails (primeira mídia do post; se vídeo, mostrar um badge “vídeo”)
    - ao clicar abre modal PostViewer (estilo Reels)
- PostViewerModal (Reels-like)
  - Exibe 1 post por vez em “vertical focus” (9:16), com swipe/next/prev se houver carrossel ou se você quiser navegar entre posts do perfil (opcional para MVP).
  - Comentários e curtir presentes no modal também.

4) Atualização do Buscar (/buscar)
- Após encontrar usuário:
  - Botão Seguir/Seguindo
  - Botão Mensagem
  - Botão “Ver perfil” (navega /membro/:username)
- Regras:
  - Só aparece se o resultado tiver username (ideal). Se não tiver, podemos:
    - desabilitar “Ver perfil” e manter Mensagem, ou
    - criar rota alternativa por user_id (ex.: /membro/id/:userId). (Eu recomendo manter por @ e, se faltar, mostrar aviso “Usuário sem @ configurado”.)

Parte 3 — Realtime (opcional nesta fase, mas recomendado)
- Realtime para:
  - feed_post_likes e feed_post_comments
  - feed_posts (novos posts)
- Comportamento:
  - invalidar queries de feed e do post aberto quando receber INSERT/DELETE
- Observação: isso melhora muito a sensação “Instagram” (curtidas e comentários atualizando).

Parte 4 — Compatibilidade com bloqueio para “pendente”
- Não vamos criar exceções novas no RequireAuth.
- Como /feed e /membro/:username não estão na allowlist do pending, usuário pendente será automaticamente redirecionado para /aguardando-aprovacao (e continuará podendo editar /perfil).

Critérios de aceite (checagem end-to-end)
1) Usuário aprovado:
- Acessa /feed, alterna “Todos” / “Seguindo”.
- Publica post com:
  - 1 vídeo vertical (<= 20MB) e/ou fotos
  - vê no feed com visual tipo Reels
- Curte/descurte e comenta; contadores batem.
- Vai em /buscar, encontra alguém, segue e manda mensagem; abre a conversa em /mensagens/:id.
- Abre /membro/:username e vê grid + modal do post.
2) Usuário pendente:
- Tenta entrar no feed/perfis/buscar e é bloqueado (redirect).
- Continua podendo editar /perfil.

Sequência de implementação (na prática)
1) Migration (banco + storage):
   - criar bucket feed-media (privado)
   - criar tabelas feed_*
   - criar índices
   - habilitar RLS + policies
   - criar RPCs list/create + stats
2) Frontend:
   - criar /feed e seus componentes (listagem + criar post + card)
   - criar /membro/:username (perfil + grid + modal)
   - atualizar /buscar (seguir/mensagem/perfil)
   - adicionar item no sidebar + rotas no App.tsx
3) Ajustes visuais “Reels”
   - padronizar containers 9:16, fallback para mídia horizontal (fit/cover com fundo)
4) Testes completos (desktop + mobile)

Notas técnicas importantes (para não dar dor de cabeça)
- Vídeos:
  - aceitar mp4/webm; tocar com playsInline; em iOS há limitações (normal). Vamos garantir fallback e mensagens claras.
- Performance:
  - feed paginado (p_before) e retorno do backend já agregado com counts e mídia para reduzir round-trips.
- Segurança:
  - bucket privado + signed URLs
  - policies sempre checando is_approved() e visibility.

Escopo MVP (para manter rápido e consistente)
- Máximo de mídias por post (sugestão): 10 arquivos.
- Sem “stories”, sem “salvar”, sem “compartilhar externo” neste momento.
- Edição de post: opcional (podemos deixar para etapa 2). Delete: opcional (etapa 2). No MVP, foco em criar/ver/curtir/comentar/seguir/mensagem.
