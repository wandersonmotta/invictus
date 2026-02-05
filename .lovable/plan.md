

## Adicionar Opção de Excluir Postagem do Feed

### Contexto Atual

O sistema já possui:
- RLS policy `Feed posts deletable` que permite o autor apagar seu próprio post:
  ```sql
  Using: is_approved() AND auth.uid() IS NOT NULL AND author_id = auth.uid()
  ```
- Cascade delete configurado: quando um `feed_post` é apagado, automaticamente remove `feed_post_media`, `feed_post_likes` e `feed_post_comments`
- Não existe função RPC nem interface para exclusão de posts

### Objetivo

Permitir que o autor exclua sua publicação (como no Instagram):
- Excluir do feed = exclui do perfil também
- Opção acessível no modal de visualização do post
- Confirmação antes de excluir
- Feedback visual após exclusão

---

## Arquitetura da Solução

### 1. Criar função RPC `delete_feed_post`

Função para exclusão segura do post com verificação de autoria:

```sql
CREATE OR REPLACE FUNCTION public.delete_feed_post(p_post_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_author uuid;
  v_deleted boolean := false;
BEGIN
  -- Verificar autenticação
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Verificar aprovação
  IF NOT public.is_approved() THEN
    RAISE EXCEPTION 'Not approved';
  END IF;
  
  -- Verificar que é o autor
  SELECT author_id INTO v_author
  FROM public.feed_posts
  WHERE id = p_post_id;
  
  IF v_author IS NULL THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
  
  IF v_author <> auth.uid() THEN
    RAISE EXCEPTION 'Not the author';
  END IF;
  
  -- Apagar o post (cascade cuida do resto)
  DELETE FROM public.feed_posts WHERE id = p_post_id;
  
  RETURN true;
END;
$$;
```

### 2. Atualizar `PostCommentsPanel.tsx`

Adicionar botão de "Excluir publicação" no painel lateral quando o usuário é o autor:

- Mostrar botão com ícone de lixeira
- Ao clicar, abrir AlertDialog de confirmação
- Após confirmar, chamar RPC e fechar modal
- Invalidar queries do feed e perfil

### 3. Atualizar `FeedPostViewerDialog.tsx`

Passar `authorUserId` para o `PostCommentsPanel` para detectar se é o autor:

```tsx
<PostCommentsPanel
  postId={post.post_id}
  authorUserId={post.author_user_id}  // ← Novo prop
  ...
/>
```

### 4. Callback de exclusão

Adicionar callback `onPostDeleted` para fechar o modal e atualizar a lista:

```tsx
// No FeedPostCard e Membro.tsx
onPostDeleted={() => {
  setViewerOpen(false);
  // Lista será atualizada via invalidateQueries
}}
```

---

## Interface Visual

No `PostCommentsPanel`, quando o usuário é o autor:

```text
┌─────────────────────────────────────┐
│  [Avatar]  Thiago Silva             │
│            @thiago.silva            │
├─────────────────────────────────────┤
│  [Curtir (5)]          [🗑️ Excluir] │  ← Botão de excluir
├─────────────────────────────────────┤
│  Comentários...                     │
└─────────────────────────────────────┘
```

AlertDialog de confirmação:

```text
┌─────────────────────────────────────┐
│  Excluir publicação?                │
│                                     │
│  Esta ação não pode ser desfeita.   │
│  Sua publicação será removida do    │
│  feed e do seu perfil.              │
│                                     │
│  [Cancelar]    [Excluir]            │
└─────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| Nova migration SQL | Criar função `delete_feed_post` |
| `src/components/feed/PostCommentsPanel.tsx` | Adicionar botão de excluir e AlertDialog |
| `src/components/feed/FeedPostViewerDialog.tsx` | Passar `authorUserId` e `onPostDeleted` |
| `src/components/feed/FeedPostCard.tsx` | Passar `onPostDeleted` callback |
| `src/pages/Membro.tsx` | Passar `onPostDeleted` para fechar modal e atualizar lista |

---

## Fluxo de Exclusão

```text
1. Usuário abre sua publicação (no Feed ou Perfil)
2. Vê botão "Excluir" no painel lateral
3. Clica em "Excluir"
4. AlertDialog aparece: "Excluir publicação?"
5. Usuário confirma
6. RPC `delete_feed_post` é chamado
7. Post é removido do banco (cascade apaga mídia, likes, comentários)
8. Modal fecha
9. Lista do feed/perfil é atualizada (invalidateQueries)
10. Toast: "Publicação excluída"
```

---

## Detalhes Técnicos

### Verificação de autoria no frontend

```tsx
// PostCommentsPanel.tsx
const isAuthor = myUserId && authorUserId && myUserId === authorUserId;

{isAuthor && (
  <Button 
    variant="ghost" 
    size="sm"
    className="text-destructive hover:text-destructive"
    onClick={() => setConfirmDeleteOpen(true)}
  >
    <Trash2 className="h-4 w-4 mr-1" />
    Excluir
  </Button>
)}
```

### Mutation de exclusão

```tsx
const deletePostMutation = useMutation({
  mutationFn: async () => {
    const { error } = await supabase.rpc("delete_feed_post", { p_post_id: postId });
    if (error) throw error;
  },
  onSuccess: async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["feed_posts"] }),
      qc.invalidateQueries({ queryKey: ["profile_feed"], exact: false }),
      qc.invalidateQueries({ queryKey: ["my-profile-feed"], exact: false }),
    ]);
    toast({ title: "Publicação excluída" });
    onPostDeleted?.();
  },
});
```

