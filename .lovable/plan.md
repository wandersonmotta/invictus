
Objetivo (o que você pediu)
- Adicionar um sino de notificações ao lado do menu do usuário (avatar + nome).
- Exibir um contador (badge) circular amarelo com fonte branca quando houver notificações não lidas.
- Ao clicar no sino, abrir um dropdown “glass” (vidro clean/sophisticated), com a lista de notificações.
- Tipos iniciais de notificação:
  - Curtidas no seu post
  - Comentários no seu post
  - Solicitação/ação de seguir (follow)
  - “Conexão” (quando alguém te segue de volta / vira recíproco)
  - Mensagens (DM) e solicitações de DM (requests)
  - Novo treinamento publicado no Class
- Comportamento aprovado por você:
  - Marcar como lidas ao abrir o dropdown do sino
  - Treinamentos: notificar todos os membros aprovados
  - Ao clicar numa notificação: levar para Feed (post), Perfil, Conversa (DM) e/ou Class conforme o tipo

------------------------------------------------------------
1) Exploração do estado atual (o que já existe hoje)
- Topbar atual: `src/components/AppLayout.tsx` mostra logo + “FRATERNIDADE” à esquerda e `UserMenu` à direita.
- Já existe “glass premium” para dropdowns: classe `.invictus-topbar-menu-glass` em `src/styles/invictus-topbar.css`.
- Backend (Lovable Cloud) já tem tabelas para os eventos que queremos notificar:
  - `feed_post_likes`, `feed_post_comments`, `feed_posts`
  - `follows`
  - `messages`, `conversation_members`, `conversations`
  - `trainings` (Class)
- Já existem RPCs para ações principais (ex.: `toggle_follow`, `send_message`, etc.), então podemos integrar notificações sem mexer na UI principal desses fluxos.

------------------------------------------------------------
2) Estratégia técnica (simples, robusta e escalável)
Vamos implementar notificações persistidas no banco (Lovable Cloud) com:
- 1 tabela central: `public.notifications`
- Triggers no banco para gerar notificações automaticamente quando acontecer:
  - Like, comment, follow, message, aceitação de request, publicação de treino

Motivo de usar triggers:
- Garante que a notificação é criada mesmo que o evento seja inserido por qualquer lugar (RPC, admin, futuramente outra tela).
- Evita depender de “lembrar” de disparar notificação em cada lugar no frontend.

------------------------------------------------------------
3) Banco de dados: tabelas + RLS + funções + triggers
3.1) Criar tabela `public.notifications`
Campos (proposta):
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null` (destinatário)
- `actor_id uuid null` (quem causou o evento: quem curtiu/comentou/seguiu/enviou mensagem)
- `type text not null` (ex.: 'feed_like', 'feed_comment', 'follow', 'connection', 'dm_message', 'dm_request', 'dm_request_accepted', 'class_new_training')
- `entity_id uuid null` (post_id, training_id, etc. dependendo do tipo)
- `conversation_id uuid null` (para DM)
- `created_at timestamptz not null default now()`
- `read_at timestamptz null`
- `data jsonb not null default '{}'::jsonb` (para extras: preview do comentário, etc.)

Índices:
- `(user_id, read_at, created_at desc)` para badge e listagem rápida
- `(user_id, created_at desc)` para paginação

3.2) RLS (segurança)
- Ativar RLS na tabela.
- Políticas:
  - SELECT: usuário só vê `notifications.user_id = auth.uid()`
  - UPDATE: usuário só pode marcar como lida as próprias (`user_id = auth.uid()`)
  - INSERT/DELETE: bloqueado direto (false). Notificações serão criadas via triggers com `security definer` quando necessário.

3.3) Funções RPC (para o frontend consumir)
- `count_unread_notifications()` -> retorna bigint
- `list_my_notifications(p_limit int, p_before timestamptz null)`:
  - retorna lista com:
    - dados da notificação
    - dados do ator (join em `profiles` por `actor_id`) para mostrar avatar + nome
- `mark_notifications_read(p_before timestamptz)`:
  - marca como lidas (read_at=now()) todas as notificações do usuário com `created_at <= p_before` e `read_at is null`
  - será chamada ao abrir o dropdown (conforme sua preferência)

3.4) Triggers que geram notificações
A) Likes (curtidas)
- Trigger AFTER INSERT em `public.feed_post_likes`
- Buscar autor do post (feed_posts.author_id) e notificar:
  - Se `NEW.user_id != author_id` então criar notificação para `author_id` com:
    - type='feed_like'
    - actor_id=NEW.user_id
    - entity_id=NEW.post_id

B) Comments (comentários)
- Trigger AFTER INSERT em `public.feed_post_comments`
- Notificar o autor do post (se não for auto-comentário)
  - type='feed_comment'
  - data pode conter `comment_preview` (primeiros 80 chars) para ficar “instagram-like”

C) Follow
- Trigger AFTER INSERT em `public.follows`
- Notificar o `following_id`:
  - type='follow'
  - actor_id=follower_id
- E detectar “conexão” (recíproco):
  - Se já existir o inverso (following_id -> follower_id), criar notificação extra para `follower_id`:
    - type='connection'
    - actor_id=following_id

D) Mensagens (DM)
- Trigger AFTER INSERT em `public.messages`
- Para cada membro da conversa (conversation_members) diferente do sender:
  - criar notificação type='dm_message' para aquele membro
  - preencher `conversation_id`
- Para “Solicitações” (requests):
  - Se existir lógica de folder='requests' e accepted_at null para o destinatário, podemos também criar type='dm_request' no momento correto.
  - Como a criação/roteamento de requests acontece via RPC de criação de conversa, a versão mais segura é:
    - (opção 1) trigger no próprio INSERT de messages + checar status do destinatário (accepted_at is null) e então usar type='dm_request'
    - (opção 2) adicionar notificação dentro do RPC `create_conversation` (mas isso depende do fluxo atual)
  - Durante implementação vamos escolher a que encaixar melhor com o que já existe em migrations/RPCs (sem quebrar o sistema).

E) Aceitar solicitação de DM
- Trigger AFTER UPDATE em `public.conversation_members`
- Quando `accepted_at` mudar de null -> not null:
  - notificar os outros membros da conversa:
    - type='dm_request_accepted'
    - actor_id = user_id que aceitou
    - conversation_id = conversation_id

F) Novo treinamento publicado (Class)
- Trigger AFTER INSERT/UPDATE em `public.trainings`
- Condição:
  - novo treino inserido com `published=true`, OU
  - update onde published mudou de false -> true
- Para todos os perfis aprovados (profiles.access_status='approved'):
  - criar notificação type='class_new_training'
  - entity_id=training.id
  - actor_id pode ser null (sistema) ou o admin que publicou (se existir esse dado). Para o MVP: actor_id null e texto “Novo treinamento no Class”.

Observação de performance:
- Inserir uma notificação por usuário é ok para base pequena/média. Se crescer muito, podemos migrar para um modelo “broadcast” + tabela de leituras. Mas para o MVP, manter simples.

------------------------------------------------------------
4) Frontend: sino + dropdown glass + badge + navegação
4.1) Criar componente `NotificationBell`
- Local sugerido: `src/components/notifications/NotificationBell.tsx` (nova pasta `notifications/`)
- UI:
  - Ícone `Bell` (lucide-react)
  - Badge:
    - círculo pequeno
    - fundo amarelo (token do ouro, ex.: `--gold-hot`)
    - texto branco
    - número: 1–99, e “99+” acima disso
  - Abertura:
    - usar `DropdownMenu` (Radix) como já está no `UserMenu`
    - aplicar classe `invictus-topbar-menu-glass` para o dropdown ficar consistente e não “see-through”
    - z-index alto (Radix já usa z-50; manter/garantir)

4.2) Listagem das notificações dentro do dropdown
- Mostrar as últimas 15–20:
  - avatar do ator (quando existir)
  - texto amigável (instagram-like), exemplos:
    - “Fulano curtiu sua publicação”
    - “Fulano comentou: ‘…’”
    - “Fulano começou a te seguir”
    - “Você e Fulano agora são conexões”
    - “Nova mensagem de Fulano”
    - “Novo treinamento publicado no Class”
  - horário relativo (ex.: “2 min”, “1 h”, “ontem”) usando date-fns
- Estado vazio: “Sem novidades por enquanto.”

4.3) Marcar como lidas ao abrir (conforme sua escolha)
- Quando `DropdownMenu` abrir:
  - chamar `mark_notifications_read(now())`
  - invalidar/refetch das queries:
    - unread count
    - list

4.4) Navegação ao clicar em uma notificação (conforme o tipo)
- feed_like / feed_comment:
  - navegar para `/feed` e abrir o post alvo (MVP: rolar até o post se estiver no retorno; etapa 2: modal “post detail” por id)
- follow / connection:
  - navegar para `/membro/:username` (precisamos do username do ator; resolveremos via join no RPC list_my_notifications)
- dm_message / dm_request / dm_request_accepted:
  - navegar para `/mensagens/:conversationId`
- class_new_training:
  - navegar para `/class` (etapa 2: destacar o treino específico)

4.5) Inserir o sino na Topbar
- Editar `src/components/AppLayout.tsx`:
  - no lado direito, antes do `UserMenu`, adicionar `<NotificationBell />`
  - manter espaçamento sutil (gap pequeno) e estética clean.

4.6) Estilo visual (Instagram + Invictus)
- O sino deve ser discreto (ghost/clean), com hover glass suave.
- Badge amarelo com texto branco, bem pequeno (estilo Instagram).
- Dropdown: usar o mesmo “glass premium” do menu do usuário.
- Garantir fundo sólido o suficiente (não transparente).

------------------------------------------------------------
5) Testes + “tirar print” (verificar e validar)
Depois de implementar, vamos fazer um checklist end-to-end (e eu mesmo vou capturar screenshots no preview):

5.1) Teste do badge (não lidas)
- Criar evento de notificação (ex.: curtir um post com outra conta, ou mandar mensagem)
- Confirmar:
  - badge aparece com o número correto
  - ao abrir o sino, badge zera (marca lidas ao abrir)

5.2) Teste do dropdown
- Visual: glass bonito, sem “see-through”, cantos arredondados, z-index ok (não fica atrás de nada)
- Lista: avatar/nome/tempo corretos

5.3) Teste de clique e deep-link
- Clicar em notificação de:
  - feed (leva para feed)
  - perfil (leva para /membro/…)
  - DM (leva para /mensagens/:id)
  - Class (leva para /class)

5.4) Prints
- Print 1: topbar mostrando sino + badge ao lado do UserMenu
- Print 2: dropdown aberto com 3–5 notificações (estilo vidro)

------------------------------------------------------------
6) Entregáveis (o que será alterado/criado)
Backend (migração SQL)
- Criar `public.notifications`
- Criar RLS policies
- Criar RPCs:
  - `count_unread_notifications`
  - `list_my_notifications`
  - `mark_notifications_read`
- Criar triggers:
  - likes/comments/follows/messages/conversation_members/trainings

Frontend
- Novo componente: `NotificationBell`
- Ajuste no header: `AppLayout.tsx`
- Pequenas utilidades de formatação de texto/tempo (se necessário) reutilizando `date-fns`

------------------------------------------------------------
7) Observações e próximos passos (sem travar o MVP)
- “Eventos” e “novidades” gerais (além de treino) podem entrar como tipos adicionais depois (ex.: announcements/admin posts).
- Se a base de usuários crescer muito, a notificação de treino para “todos aprovados” pode virar “broadcast” para reduzir inserts. Não é necessário agora.

Pronto para implementar assim: primeiro o banco (tabelas+triggers+RPC), depois o sino na topbar com dropdown glass e badge, e por fim os testes/prints.