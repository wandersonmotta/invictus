
## Lista de Seguidores/Seguindo - Estilo Instagram

### Objetivo
Ao clicar em "Seguidores" ou "Seguindo" no perfil, abrir um modal com a lista de usuários, como no Instagram:
- Campo de busca no topo
- Lista com avatar circular, username e nome
- Botao de acao (Remover/Seguindo/Seguir)

---

## Arquitetura da Solucao

### 1. Criar duas RPCs no banco de dados

**`list_followers(p_user_id, p_search, p_limit)`**
- Retorna quem segue o usuario especificado
- Campos: user_id, display_name, username, avatar_url, is_following (se eu sigo esse usuario)

**`list_following(p_user_id, p_search, p_limit)`**
- Retorna quem o usuario especificado segue
- Campos: user_id, display_name, username, avatar_url, is_following (se eu sigo esse usuario)

**`remove_follower(p_follower_id)`**
- Permite remover um seguidor do meu perfil
- Apenas o dono do perfil pode remover seus seguidores

### 2. Criar componente `FollowListDialog.tsx`

Novo componente reutilizavel que exibe a lista de seguidores ou seguindo:

```text
+------------------------------------------+
|  Seguidores                           X  |
+------------------------------------------+
|  [Q] Pesquisar                           |
+------------------------------------------+
|  (O) @joaosilva           [ Remover ]    |
|      Joao Silva                          |
+------------------------------------------+
|  (O) @maria.santos        [ Seguindo ]   |
|      Maria Santos                        |
+------------------------------------------+
|  (O) @pedro.lima          [ Seguir ]     |
|      Pedro Lima                          |
+------------------------------------------+
```

Comportamento:
- **Seguidores**: mostra "Remover" se for meu perfil, ou "Seguindo/Seguir" para outros
- **Seguindo**: mostra "Seguindo" (toggle para deixar de seguir) ou "Seguir"
- Campo de busca com debounce de 300ms
- Clique no item navega para o perfil do usuario
- Lista com scroll (max-height)

### 3. Atualizar `Membro.tsx`

Tornar os contadores "Seguidores" e "Seguindo" clicaveis:

```tsx
<button onClick={() => setFollowListOpen("followers")}>
  <div className="font-semibold">{s?.followers_count ?? 0}</div>
  <div className="text-xs text-muted-foreground">Seguidores</div>
</button>

<button onClick={() => setFollowListOpen("following")}>
  <div className="font-semibold">{s?.following_count ?? 0}</div>
  <div className="text-xs text-muted-foreground">Seguindo</div>
</button>
```

---

## Layout Visual (Referencia Instagram)

Modal com titulo centralizado:

```text
+------------------------------------------+
|            Seguidores                 X  |
+------------------------------------------+
|  [         Pesquisar              ]      |
+------------------------------------------+
|  +----+  @moisesvidaloficial  [ Remover ]|
|  |    |  Moises Vidal                    |
|  +----+                                  |
|------------------------------------------|
|  +----+  @jean_susej          [ Remover ]|
|  |    |  Jean Susej                      |
|  +----+                                  |
|------------------------------------------|
|  +----+  @nathiely . Seguir   [ Remover ]|
|  |    |  Nathy Andrade Santos            |
|  +----+                                  |
+------------------------------------------+
```

---

## Arquivos a Modificar/Criar

| Arquivo | Acao |
|---------|------|
| Nova migration SQL | Criar `list_followers`, `list_following`, `remove_follower` |
| `src/components/profile/FollowListDialog.tsx` | Novo componente |
| `src/pages/Membro.tsx` | Adicionar clique nos contadores e renderizar dialog |

---

## Detalhes Tecnicos

### Funcao SQL `list_followers`

```sql
CREATE OR REPLACE FUNCTION public.list_followers(
  p_user_id uuid,
  p_search text DEFAULT ''::text,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  is_following boolean
)
-- Retorna quem segue p_user_id
-- Com indicacao se EU sigo cada pessoa
-- Filtro opcional por nome/username
```

### Funcao SQL `list_following`

```sql
CREATE OR REPLACE FUNCTION public.list_following(
  p_user_id uuid,
  p_search text DEFAULT ''::text,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  is_following boolean
)
-- Retorna quem p_user_id segue
-- Com indicacao se EU sigo cada pessoa
```

### Funcao SQL `remove_follower`

```sql
CREATE OR REPLACE FUNCTION public.remove_follower(p_follower_id uuid)
RETURNS boolean
-- Apenas o dono do perfil pode remover seguidores
-- Deleta o registro de follow onde follower_id = p_follower_id
-- e following_id = auth.uid()
```

### Componente FollowListDialog

```tsx
interface FollowListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  mode: "followers" | "following";
  isMyProfile: boolean;
  onFollowChange?: () => void;
}
```

Fluxo:
1. Abre dialog com titulo "Seguidores" ou "Seguindo"
2. Query busca lista com debounce no campo de pesquisa
3. Cada item mostra avatar, username, nome
4. Botao de acao:
   - Se modo=followers e isMyProfile: "Remover" (chama remove_follower)
   - Senao: "Seguindo" ou "Seguir" (chama toggle_follow)
5. Clique no item navega para /membro/:username

---

## Fluxo de Uso

```text
1. Usuario acessa perfil de outro membro
2. Clica em "523 Seguindo"
3. Modal abre com lista de quem essa pessoa segue
4. Usuario digita "Joao" no campo de busca
5. Lista filtra para mostrar apenas "Joaos"
6. Usuario clica em "Joao Silva"
7. Modal fecha e navega para /membro/@joao.silva
```

---

## Estados do Componente

| Estado | Exibicao |
|--------|----------|
| Carregando | Skeleton ou "Carregando..." |
| Lista vazia | "Nenhum seguidor" ou "Nao segue ninguem" |
| Com busca sem resultados | "Nenhum resultado para..." |
| Erro | "Nao foi possivel carregar" |
| Sucesso | Lista de usuarios |
