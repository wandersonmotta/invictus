
Objetivo
- No Feed, permitir clicar no avatar/nome/@ do autor para abrir o perfil público dele.
- Em /perfil, adicionar uma aba “Ver como fica” com um layout estilo Instagram, exibindo: avatar, nome, @, bio, expertises em chips e grid de posts com visualizador.
- No perfil público: manter “Seguir + Mensagem” para outros membros (como já existe em /membro/:username) e, quando for o próprio usuário, mostrar “Editar perfil” levando para /perfil.

Contexto encontrado no projeto (estado atual)
- Já existe rota de perfil público: /membro/:username (src/pages/Membro.tsx) com layout tipo Instagram, bio, contadores, grid e viewer.
- O Feed renderiza cada post em src/components/feed/FeedPostCard.tsx e hoje não tem link no header (avatar/nome/@).
- O perfil do usuário (/perfil) hoje é focado em edição (ProfileForm) e sessão, mas não tem um preview “instagram-style”.
- A bio e expertises já são campos no profiles e já aparecem em /membro/:username (bio aparece; expertises ainda não estão em chips no layout do Membro).

Decisão do usuário (confirmada)
- “Perfil estilo Instagram”: Abas dentro de /perfil.
- “Cliques no Feed”: Tornar clicável (avatar/nome/@).
- Elementos desejados: Seguir + Mensagem (para outros), Editar perfil (meu), Grid + visualizador, Expertises em chips.

Plano de implementação (frontend)
1) Tornar autor do post clicável no Feed
   - Arquivo: src/components/feed/FeedPostCard.tsx
   - Alterações:
     - Importar Link e/ou useNavigate do react-router-dom.
     - Transformar o bloco do cabeçalho (avatar + nome + @) em um link clicável quando post.author_username existir.
       - URL: `/membro/${encodeURIComponent(post.author_username.replace(/^@/, ""))}`
     - Se author_username for null:
       - Manter como texto/sem link (sem navegação).
     - Ajustar classes (cursor-pointer, hover/focus states) para ficar “instagram-like” e acessível (focus-visible, aria-label).
   - Resultado: no Feed, tocar no avatar/nome/@ abre o perfil público do autor.

2) Criar “view de perfil estilo Instagram” para o próprio usuário (reutilizável)
   - Objetivo: renderizar um layout semelhante ao de src/pages/Membro.tsx, mas para “meu perfil”, sem depender de :username na URL.
   - Abordagem:
     - Criar um componente novo (ex.: src/components/profile/MyPublicProfilePreview.tsx ou src/pages/MeuPerfilPreviewSection.tsx) que:
       - Recebe userId (do AuthProvider).
       - Faz query no backend para pegar meus dados (profiles) via SELECT (permitido pela RLS “Users can view own profile”):
         - Campos: display_name, username, avatar_url, bio, city, state, expertises, profile_visibility (se necessário para UI).
       - Faz query dos meus posts:
         - Reaproveitar RPC list_profile_feed_posts (como em Membro.tsx) com p_user_id = meu userId.
         - Reutilizar createSignedUrl para thumbs e viewer (mesmo padrão do Membro.tsx).
       - Renderiza:
         - Header: avatar grande, display_name, @
         - Contadores:
           - Para “meu perfil”, podem ser carregados usando o mesmo RPC get_follow_stats com p_user_id = meu userId (para followers/following).
           - “Posts” = quantidade do retorno do RPC de posts (ou um contador do backend se existir; por agora, tamanho do array).
         - Ações:
           - Botão “Editar perfil” que navega para /perfil (ou alterna para a aba “Editar” diretamente).
         - Bio (texto) e Expertises em chips:
           - Renderizar expertises como badges/chips (ex.: usando componente Badge ou classes utilitárias), com wrap.
         - Grid de posts + visualizador:
           - Mesmo comportamento do /membro/:username (Dialog + ReelsMedia + CommentsDrawer + Curtir).
   - Observação importante:
     - Não exibir e-mail (não faz parte do profiles e já está mascarado no /perfil).
     - Manter somente informações “públicas” (bio, @, nome, avatar, city/state, expertises).

3) Adicionar abas em /perfil: “Editar perfil” e “Ver como fica”
   - Arquivo: src/pages/Perfil.tsx
   - Alterações:
     - Introduzir Tabs (já existe em src/components/ui/tabs.tsx e é usado no Feed).
     - Estrutura sugerida:
       - Aba 1: “Editar perfil” -> renderiza <ProfileForm userId={user.id} /> (como hoje).
       - Aba 2: “Ver como fica” -> renderiza o novo componente de preview “instagram-style” do próprio usuário.
     - Manter as seções atuais (Alterar senha e Sessão) dentro da aba “Editar perfil” (para não poluir o preview).
     - Opcional: Se quiser, um botão “Ver como fica” pode também estar dentro do formulário para alternar de aba (UX).

4) Expertises em chips no perfil público (outros membros também)
   - Arquivo: src/pages/Membro.tsx
   - Alterações:
     - Abaixo da bio (ou abaixo do bloco de localização), renderizar p.expertises como chips/badges quando existir.
     - Mantém consistência com o preview do próprio usuário.

5) Polimento de UX (Instagram feel)
   - Hover/press feedback nos links do Feed (subtle underline/opacity).
   - Loading states:
     - Usar Skeleton (já existe src/components/ui/skeleton.tsx) para avatar/nome/grid enquanto carrega (opcional, mas recomendado).
   - Estados vazios:
     - Sem posts: mostrar “Ainda não há posts” na aba preview.
   - Mobile:
     - Garantir que o header de perfil quebre bem (stack em coluna, botões com largura total quando necessário).

Plano de validação (teste end-to-end)
- Feed:
  - Abrir /feed, clicar no avatar/nome/@ de um post com @ definido e verificar que abre /membro/:username correto.
  - Testar post cujo author_username esteja vazio (se existir) e confirmar que não navega.
- Perfil:
  - Ir em /perfil:
    - Aba “Editar” continua salvando bio/expertises.
    - Aba “Ver como fica” mostra a bio e expertises em chips imediatamente após salvar (pode exigir refresh/refetch; vamos alinhar para refetch ao salvar).
- Perfil público:
  - Em /membro/:username confirmar que expertises agora aparecem como chips.
  - Abrir um post no grid e validar viewer, curtidas e comentários.

Notas técnicas (para implementação)
- Sincronização após salvar perfil:
  - O ProfileForm hoje salva via upsert e mantém estado local, mas a aba preview precisa refazer fetch para refletir mudanças.
  - Solução: após “Perfil salvo”, invalidar queries do react-query relacionadas ao perfil (ex.: queryKey ["my-profile", userId] e a query do preview), ou passar um callback onSaved para disparar refetch/invalidate.
- Roteamento:
  - Usar Link para navegação no Feed (melhor acessibilidade) com fallback quando não houver username.
- Reuso de código:
  - Reaproveitar ao máximo o código de viewer/grid de src/pages/Membro.tsx para não duplicar lógica e manter comportamento idêntico.

Entregáveis
- FeedPostCard com header clicável para perfil.
- /perfil com Tabs: Editar | Ver como fica.
- Componente de preview do próprio perfil (instagram-style) com grid + viewer + chips.
- /membro/:username exibindo expertises em chips.
