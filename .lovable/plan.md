
Objetivo
- Criar uma nova aba “Comunidade” no app (estilo fórum/Discord), com “canais fixos” e dentro de cada canal uma lista de temas (tópicos). Ao entrar em um tema, os membros conversam em um feed de mensagens (posts), com suporte a anexos (mídia + documentos).
- Acesso: apenas membros aprovados (coerente com a regra atual de aprovação).

O que já existe e vamos reutilizar
- Padrão de UI: AppLayout + Sidebar (src/components/AppSidebar.tsx) + páginas (src/pages/*) com estilo “invictus-*”.
- Padrão de dados: TanStack Query + supabase client + RPCs “SECURITY DEFINER” para projeções seguras (ex.: get_my_threads, search_approved_members).
- Storage privado com políticas por “foldername(name)[1]::uuid” (usado em dm-attachments).
- Realtime já usado em mensagens (ChatView) via supabase.channel + postgres_changes.

Decisões de produto (MVP)
1) Estrutura: “Canais fixos” (você escolheu).
2) Conteúdo: dentro do canal, cada “Tema” (thread) tem título + (opcional) descrição + tags (opcional) + contagem de posts + último post.
3) Conversa: feed de posts em ordem cronológica; permitir responder com texto + anexos.
4) Moderação (MVP): autor pode editar/apagar o próprio post por X minutos OU sem editar/apagar no MVP (recomendado começar sem delete/edit para reduzir complexidade). Admin pode moderar (próxima etapa).

Etapa 1 — Banco de dados (estrutura + segurança)
1.1 Tabelas (public)
- community_channels
  - id (uuid pk, default gen_random_uuid())
  - slug (text unique) — ex.: “geral”, “negocios”, “treinos”
  - name (text)
  - description (text null)
  - sort_order (int default 0)
  - created_at (timestamptz default now())
- community_threads
  - id (uuid pk)
  - channel_id (uuid, fk -> community_channels.id)
  - created_by (uuid) — user_id
  - title (text)
  - body (text null) — texto inicial opcional (primeiro post “fixo” do tema)
  - created_at, updated_at, last_post_at
  - is_locked (boolean default false) — opcional (para futura moderação)
- community_posts
  - id (uuid pk)
  - thread_id (uuid, fk -> community_threads.id on delete cascade)
  - author_id (uuid)
  - body (text null)
  - created_at (timestamptz default now())
- community_post_attachments
  - id (uuid pk)
  - post_id (uuid, fk -> community_posts.id on delete cascade)
  - storage_bucket (text default 'community-attachments')
  - storage_path (text)  — formato: “<thread_id>/<post_id>/<uuid>.<ext>”
  - file_name (text null)
  - content_type (text null)
  - size_bytes (bigint null)
  - created_at

1.2 Storage
- Criar bucket privado: community-attachments (public=false).
- Políticas de storage.objects para community-attachments:
  - SELECT: permitido se o usuário atual tiver acesso ao post/thread (aprovado + thread existente).
  - INSERT: permitido se o usuário atual for o autor do post, e o path seguir o padrão (thread_id/post_id/…).
  - (Opcional) UPDATE/DELETE: negar no MVP, como no dm-attachments.

1.3 RLS (Row Level Security)
- Ativar RLS em todas as tabelas community_*.
- Regras de acesso (MVP “Aprovados apenas”):
  - SELECT em channels/threads/posts: somente usuários autenticados e com perfil aprovado.
  - INSERT:
    - threads: somente aprovados; created_by = auth.uid()
    - posts: somente aprovados; author_id = auth.uid(); thread não locked
    - attachments: somente se o post for do autor (validação por subquery)
  - UPDATE/DELETE:
    - inicialmente negar (mais simples e seguro)
    - opcional (fase 2): permitir UPDATE/DELETE do próprio post com janela de tempo; admin always.

Observação importante de privacidade
- Hoje o app já tem “profile_visibility”. Em Comunidade, mostraremos um “cartão do autor” (nome/username/avatar) de forma segura.
- Para evitar depender de SELECT direto em profiles (que é restrito), vamos expor autor via RPCs com projeção e fallback:
  - Se o viewer pode ver o perfil do autor (members/mutuals/private/admin/self), retorna display_name/username/avatar.
  - Se não pode, retorna “Membro” e avatar nulo (mantém privacidade, mas ainda exibe a mensagem no fórum).

1.4 RPCs (SECURITY DEFINER) — padrão já usado no projeto
Criar funções para o frontend não precisar fazer joins sensíveis:
- list_community_channels()
  - Retorna id, slug, name, description, sort_order.
- list_community_threads(p_channel_id, p_search?, p_limit?, p_offset?)
  - Retorna: thread_id, title, created_at, last_post_at, post_count, created_by_card(…).
- get_community_thread(p_thread_id)
  - Retorna dados do thread + canal.
- list_community_posts(p_thread_id, p_limit?, p_before?)
  - Retorna posts com autor “card seguro” + contagem/preview de anexos.
- create_community_thread(p_channel_id, p_title, p_body)
  - Cria thread e já cria o primeiro post (opcional) para padronizar.
- create_community_post(p_thread_id, p_body)
  - Cria post, atualiza last_post_at no thread.
- add_community_post_attachment(p_post_id, p_storage_path, p_file_name, p_content_type, p_size_bytes)
  - Valida autor e registra metadata no DB.

Realtime
- Habilitar realtime para community_posts (semelhante ao messages):
  - ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
- Frontend assina INSERT por thread_id para atualizar feed em tempo real.

Etapa 2 — Frontend: rotas, sidebar e página Comunidade
2.1 Rotas
- Adicionar rota protegida: /comunidade
  - Dentro do App.tsx: criar Route com <RequireAuth><AppLayout><Comunidade /></AppLayout></RequireAuth>

2.2 Sidebar
- Adicionar item “Comunidade” no menu (src/components/AppSidebar.tsx), com ícone apropriado (ex.: MessagesSquare ou MessageCircle do lucide-react).

2.3 Página /comunidade (layout)
Layout recomendado (desktop):
- Coluna esquerda (fixa): lista de canais (canais fixos).
- Coluna do meio: lista de temas (threads) do canal selecionado, com busca e botão “Novo tema”.
- Coluna direita: conteúdo do tema (posts), ou estado vazio “Selecione um tema”.

No mobile:
- Navegação por etapas (semelhante à Mensagens):
  - Tela 1: canais + threads
  - Tela 2: posts do tema (com botão Voltar)

2.4 Componentes novos (propostos)
- src/pages/Comunidade.tsx
  - Controle de estado: channel selecionado, thread selecionado, busca.
  - Responsividade com useIsMobile (já existe).
- src/components/community/ChannelList.tsx
  - Query: list_community_channels()
- src/components/community/ThreadList.tsx
  - Query: list_community_threads(...)
  - Search local + paginação/limit.
- src/components/community/NewThreadDialog.tsx
  - Form: título + texto inicial
  - Mutation: create_community_thread
- src/components/community/ThreadView.tsx
  - Query: get_community_thread + list_community_posts
  - Realtime subscription para posts (INSERT) por thread_id
- src/components/community/NewPostComposer.tsx
  - Input/textarea + botão anexar
  - Mutation: create_community_post
  - Upload de anexos: envia arquivo para storage em path “threadId/postId/<uuid>.<ext>” e depois chama add_community_post_attachment
  - Mostrar lista de anexos enviados no post (chips/links)

2.5 UX de anexos (MVP)
- Aceitar:
  - Imagens: preview inline (thumbnail)
  - Documentos: renderizar como link com nome + tamanho
- Validações:
  - Tamanho máximo por arquivo (definir limite: ex. 10MB ou 20MB)
  - Tipos permitidos (image/*, application/pdf, etc.)
- Importante: armazenar somente URLs/caminhos no DB (já seguimos isso; nunca salvar base64).

Etapa 3 — Seed de canais fixos
Como você quer “canais fixos”, vamos criar os canais por seed inicial no banco.
- Opções:
  A) Criar 5-8 canais padrão no migration (INSERT) — simples e direto.
  B) Criar UI de admin para gerenciar canais — fase 2.
Plano do MVP: opção A, com canais sugeridos (podemos ajustar nomes):
- Geral
- Networking
- Negócios
- Treinos
- Eventos
- Recursos

Etapa 4 — Testes end-to-end (checklist)
4.1 Acesso/permissão
- Usuário aprovado:
  - Entra em /comunidade, vê canais, cria tema, posta, faz upload anexo, outro usuário vê em tempo real.
- Usuário pendente:
  - Não consegue acessar /comunidade (já deve ser bloqueado pelo RequireAuth e regras atuais).
4.2 Segurança
- Verificar que:
  - Um usuário não consegue ler/anexar arquivos fora do seu acesso (storage policy).
  - RPCs não vazam campos sensíveis de profiles; quando profile_visibility bloquear, autor aparece como “Membro” sem avatar.
4.3 Mobile
- Fluxo de navegação (lista -> tema -> voltar) funcionando.

Riscos / pontos de atenção
- Realtime: garantir que o table filter “thread_id=eq.<id>” esteja correto.
- Storage policy: path precisa ser consistente e validável (thread_id/post_id).
- Privacidade: decidir se “private” deve ocultar autor no fórum ou apenas em busca/perfil. No plano acima, vamos respeitar “private” e anonimizar o card do autor para quem não tiver permissão, mas manter o post visível (senão quebra a conversa).

Entregáveis (o que vai aparecer para você)
- Nova aba “Comunidade” no menu.
- Canais fixos (pré-criados) com lista de temas.
- Tela do tema com feed de posts e envio de mensagem.
- Upload de anexos (mídia + documentos) dentro dos posts.
- Atualização em tempo real quando alguém postar no mesmo tema.

Próximas evoluções (fase 2)
- Reações (curtir/emoji) por post.
- Marcar/mention @usuario.
- Fixar tema / trancar tema (admin/mod).
- Busca global por temas e posts.
- Notificações (badge no sidebar) por respostas/menções.
- Moderação: reportar post, remover, ban temporário.

Implementação: sequência sugerida
1) Migration: criar tabelas + RLS + bucket + políticas + RPCs + realtime.
2) Frontend: rota + sidebar + página Comunidade (sem anexos primeiro).
3) Frontend: anexos (upload + registro + render).
4) Realtime: assinatura e invalidação de queries.
5) Testes end-to-end (desktop + mobile).

