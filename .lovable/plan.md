
Objetivo (o que vamos entregar)
- Criar um “@ de usuário” (handle) que cada membro pode definir no próprio perfil.
- Permitir buscar membros na página **Buscar** exclusivamente pelo @.
- Permitir usar o @ também no **Direct → Nova mensagem** (encontrar pessoas digitando @).

Decisão confirmada com você
- O @ será **salvo no backend com o caractere “@”** (ex.: `@joao.silva`).

Escopo funcional
1) Perfil (Perfil → editar)
- Adicionar campo “@ do usuário” no formulário do perfil.
- Regras de validação (client + server):
  - Obrigatório começar com `@`
  - Somente `a-z`, `0-9`, `.`, `_` (sem espaços)
  - Tamanho sugerido: 4–21 caracteres no total (ex.: `@` + 3 a 20 chars)
  - Case-insensitive para unicidade (não pode existir `@Joao` e `@joao` ao mesmo tempo)
- Ao salvar: persistir no backend; em caso de conflito (já existe), mostrar mensagem “Esse @ já está em uso”.

2) Buscar (página /buscar)
- Trocar o placeholder atual por uma busca simples:
  - Um input “Buscar por @” (aceita com ou sem @; a UI ajuda a formatar)
  - Um botão “Buscar”
  - Resultado:
    - Se encontrado: card com avatar + display_name + @ + cidade/UF (se houver)
    - Se não encontrado: “Nenhum membro encontrado com esse @”
- Importante: só retornar perfis **approved** (aprovados). Mesmo que usuário pendente possa definir @, ele não aparece na busca pública de membros.

3) Direct (Mensagens → Nova mensagem)
- Atualizar a busca do modal “Nova mensagem” para encontrar por:
  - display_name (como hoje)
  - username/@ (novo)
- Exibir o @ no item da lista (abaixo do nome), para facilitar escolher a pessoa certa.

Exploração do que já existe (para encaixar no padrão do projeto)
- O app já usa Lovable Cloud com funções SQL `SECURITY DEFINER` para expor dados “seguros” de perfis aprovados (ex.: `search_approved_members`).
- Atualmente `search_approved_members` só busca por `display_name`.
- A tabela `profiles` não tem coluna para @/username ainda.

Mudanças no backend (Lovable Cloud) — MIGRATION (estrutura)
A) Tabela: `public.profiles`
- Adicionar coluna:
  - `username text null`  (vai armazenar algo como `@joao.silva`)
- Criar constraints e índices:
  - Constraint de formato (imutável, segura para CHECK):
    - `username IS NULL OR username ~ '^@[a-z0-9._]{3,20}$'`
  - Índice único case-insensitive:
    - `CREATE UNIQUE INDEX ... ON public.profiles (lower(username)) WHERE username IS NOT NULL;`
  - Índice para busca rápida (opcional mas recomendado):
    - `CREATE INDEX ... ON public.profiles (username);`

B) Função existente: `public.search_approved_members(p_search, p_limit)`
- Hoje retorna: `(user_id, display_name, avatar_url)` e filtra por display_name.
- Vamos alterar para também retornar `username` e aceitar pesquisa por @.
- Observação técnica importante:
  - Alterar `RETURNS TABLE(...)` muda o tipo de retorno, então vamos fazer como em outras migrações do projeto: **DROP + CREATE OR REPLACE** (ou DROP + CREATE) para evitar erro de “cannot change return type”.
- Novo contrato (proposto):
  - `RETURNS TABLE(user_id uuid, display_name text, username text, avatar_url text)`
- Nova lógica de filtro:
  - Normalizar `p_search` para:
    - se vier sem `@`, prefixar com `@` para comparar com `username`
    - manter também busca por `display_name` para UX (Direct)
  - Filtrar apenas `access_status = 'approved'`
  - Garantir que só usuários autenticados consigam chamar (boas práticas do projeto):
    - usar `WITH me AS (SELECT auth.uid() uid)` e `WHERE me.uid IS NOT NULL`

C) Nova função para a página Buscar (mais “exata”)
- Criar uma função específica para busca por @, retornando um único perfil aprovado (campos “seguros”):
  - Ex.: `public.find_approved_member_by_username(p_username text)`
  - `RETURNS TABLE(user_id uuid, display_name text, username text, avatar_url text, bio text, city text, state text, region text)`
- Regras:
  - Normalizar `p_username`: se não começar com `@`, prefixar `@`
  - Comparação case-insensitive (ex.: `lower(p.username) = lower(p_username_norm)`)
  - Apenas `access_status = 'approved'`
  - Apenas quando autenticado

Mudanças no frontend (React)
1) `src/components/profile/ProfileForm.tsx`
- Incluir `username` no `profileSchema` com zod:
  - aceitar vazio (null) ou string válida `^@[a-z0-9._]{3,20}$`
  - trim e normalização:
    - se usuário digitar sem `@`, o front pode auto-adicionar `@` ao sair do campo (blur) ou no submit
    - converter para lowercase (para padrão consistente)
- No loadProfile:
  - incluir `username` no select do perfil
  - preencher o input com o valor salvo
- No payload de upsert:
  - incluir `username`
- Tratamento de erro de unicidade:
  - se vier erro de “duplicate key” (índice unique), mostrar toast: “Esse @ já está em uso”.

2) `src/components/messages/NewMessageDialog.tsx`
- Atualizar `MemberRow` para incluir `username`.
- Continuar usando `supabase.rpc("search_approved_members", ...)`, mas:
  - a função agora retorna `username`, então vamos renderizar também:
    - Nome
    - Embaixo: `@...` (muted)
- Melhorar UX:
  - placeholder “Buscar por nome ou @”
  - se o usuário digitar `joao`, a busca ainda pode achar por display_name
  - se digitar `@joao`, acha direto por username

3) `src/pages/Buscar.tsx`
- Substituir o placeholder “Em breve” por:
  - Input “@ do usuário”
  - Botão “Buscar”
  - Um card de resultado (ou estado vazio)
- Implementação sugerida:
  - `useState` para o texto
  - `useQuery` (TanStack Query) para chamar `find_approved_member_by_username`, com `enabled` quando o input tiver tamanho mínimo
  - Exibir estados: carregando / encontrado / não encontrado / erro
- Observação de privacidade/segurança:
  - A página não deve expor informações além do necessário (usar somente o retorno seguro da função).

Validações e segurança (importante)
- Client-side: zod no ProfileForm para feedback imediato.
- Server-side:
  - CHECK constraint de regex (formato do @).
  - Índice unique em lower(username).
  - Funções `SECURITY DEFINER` retornando apenas campos permitidos e sempre com exigência de usuário autenticado.
- Sem uso de `dangerouslySetInnerHTML`.
- Sem interpolar input em SQL dinâmico (tudo via parâmetros).

Testes (critérios de aceite)
1) Perfil
- Usuário consegue salvar `@meu.user_1`.
- Se tentar salvar um @ inválido (ex.: `@meu user`), recebe erro.
- Se tentar salvar um @ já usado, recebe mensagem clara.

2) Buscar
- Buscar por `@meu.user_1` encontra o perfil aprovado correto.
- Buscar por `meu.user_1` (sem @) também encontra (normalização).
- Buscar por @ inexistente mostra “não encontrado”.
- Usuário pendente não aparece no resultado.

3) Direct
- Em “Nova mensagem”, digitar `@meu.user_1` lista o membro.
- Digitar pelo nome ainda funciona como antes.

Arquivos que serão modificados
- Backend (migrações):
  - `supabase/migrations/<nova_migration>.sql` (adicionar coluna + índices + funções)
- Frontend:
  - `src/components/profile/ProfileForm.tsx`
  - `src/components/messages/NewMessageDialog.tsx`
  - `src/pages/Buscar.tsx`

Riscos / cuidados
- Alterar assinatura de `search_approved_members` exige cuidado (DROP + recriar) para não quebrar chamadas.
- Como `profiles` tem RLS restritiva, a página Buscar precisa obrigatoriamente usar a nova função “segura” para ler perfis aprovados.
- Garantir que o @ salvo com “@” não gere inconsistências na UI (vamos sempre exibir exatamente o que está salvo, e normalizar input do usuário).

Sequência de implementação (ordem)
1) Criar migration: coluna `profiles.username`, constraints/índices, atualizar `search_approved_members`, criar `find_approved_member_by_username`.
2) Atualizar `ProfileForm` para ler/salvar username.
3) Atualizar `NewMessageDialog` para exibir e buscar por username.
4) Implementar a UI real de `/buscar` consumindo a função por @.
5) Testar end-to-end (perfil → salvar @ → buscar → direct).

