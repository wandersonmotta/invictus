
# Plano: Corrigir Status + Adicionar Editar/Excluir Mensagens e Chat

## Resumo dos Problemas

1. **Status não exibe após salvar** - o código salva na base, mas não há exibição dos status de conexões mútuas
2. **Status deve ser visível apenas para seguidores mútuos** - precisa filtrar pela tabela `follows`
3. **Falta editar/excluir mensagem** - opções: editar mensagem própria, excluir para todos, excluir só para mim
4. **Falta excluir chat** - exclui apenas para quem está excluindo (soft-delete por membro)

---

## Mudanças no Banco de Dados

### 1. Alterar tabela `messages` para suportar edição e exclusão

```sql
-- Adicionar colunas para edição e soft-delete
ALTER TABLE messages 
ADD COLUMN edited_at timestamptz DEFAULT NULL,
ADD COLUMN deleted_at timestamptz DEFAULT NULL,
ADD COLUMN deleted_for uuid[] DEFAULT '{}';

-- deleted_at = exclusão para TODOS (só remetente pode)
-- deleted_for = array de user_ids que "excluíram para mim"
```

### 2. Alterar tabela `conversation_members` para excluir chat

```sql
-- Adicionar coluna para "chat excluído" por membro
ALTER TABLE conversation_members
ADD COLUMN hidden_at timestamptz DEFAULT NULL;
```

### 3. Atualizar RLS de `messages`

```sql
-- Permitir UPDATE (editar body e edited_at) apenas para remetente
DROP POLICY "No update messages" ON messages;
CREATE POLICY "Sender can edit own messages" ON messages
FOR UPDATE USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- Permitir soft-delete
DROP POLICY "No delete messages" ON messages;
CREATE POLICY "Sender can delete for all" ON messages
FOR UPDATE USING (auth.uid() = sender_id);
```

### 4. Atualizar RLS de `member_status` para filtrar por mútuo

```sql
-- Substituir policy de SELECT
DROP POLICY "Authenticated can view statuses" ON member_status;
CREATE POLICY "View own or mutual follows statuses" ON member_status
FOR SELECT USING (
  auth.uid() = user_id 
  OR (
    -- mútuo: eu sigo ele E ele me segue
    EXISTS (
      SELECT 1 FROM follows f1
      WHERE f1.follower_id = auth.uid() 
        AND f1.following_id = member_status.user_id
    )
    AND EXISTS (
      SELECT 1 FROM follows f2
      WHERE f2.follower_id = member_status.user_id 
        AND f2.following_id = auth.uid()
    )
  )
);
```

### 5. Criar função RPC para buscar status de conexões mútuas

```sql
CREATE OR REPLACE FUNCTION get_mutual_statuses()
RETURNS TABLE(
  user_id uuid,
  status_text text,
  expires_at timestamptz,
  display_name text,
  avatar_url text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    ms.user_id,
    ms.status_text,
    ms.expires_at,
    COALESCE(p.display_name, 'Membro') AS display_name,
    p.avatar_url
  FROM member_status ms
  JOIN profiles p ON p.user_id = ms.user_id
  WHERE ms.expires_at > now()
    AND (
      -- meu próprio status
      ms.user_id = auth.uid()
      OR (
        -- sigo E sou seguido
        EXISTS (SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = ms.user_id)
        AND EXISTS (SELECT 1 FROM follows WHERE follower_id = ms.user_id AND following_id = auth.uid())
      )
    )
  ORDER BY ms.created_at DESC
  LIMIT 30;
$$;
```

---

## Mudanças no Frontend

### 1. `StatusRow.tsx` - Exibir status de conexões mútuas

- Buscar status via `get_mutual_statuses()` RPC
- Exibir bolhas horizontais (avatar + texto curto)
- Meu status fica destacado com borda dourada
- Ao clicar no status de alguém, abre visualização completa

### 2. Novo componente `MessageBubble.tsx`

- Ao clicar e segurar (ou menu de 3 pontos) na mensagem própria:
  - **Editar** - abre input inline para editar texto
  - **Excluir para todos** - marca `deleted_at`
  - **Excluir para mim** - adiciona meu id em `deleted_for[]`
- Mensagens com `deleted_at` ou onde meu id está em `deleted_for` não são exibidas
- Mensagens editadas mostram "(editada)" ao lado do horário

### 3. `ChatView.tsx` - Menu de opções da conversa

- Adicionar botão de menu (3 pontos) no header
- Opção "Excluir conversa" que:
  - Atualiza `conversation_members.hidden_at = now()` para o membro atual
  - Remove da lista de threads
  - NÃO apaga mensagens nem afeta os outros participantes

### 4. `ThreadList.tsx` - Filtrar conversas ocultas

- A query `get_my_threads` precisa filtrar `WHERE hidden_at IS NULL`

---

## Fluxo Visual

```text
[StatusRow]
  +-------------+  +---------+  +---------+
  | + Seu status|  | João 🔵 |  | Maria 🔵|  <-- bolhas de status mútuos
  +-------------+  +---------+  +---------+

[ChatView - Mensagem própria]
  +---------------------------+
  |  Minha mensagem aqui   ⋮ | <-- 3 pontos abre menu
  +---------------------------+
        ┌──────────────────┐
        │ Editar           │
        │ Excluir p/ todos │
        │ Excluir p/ mim   │
        └──────────────────┘

[ChatView Header]
  ← Conversa                 ⋮
                    ┌──────────────────┐
                    │ Excluir conversa │
                    └──────────────────┘
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar |
| `src/components/messages/StatusRow.tsx` | Modificar (adicionar feed de status) |
| `src/components/messages/MessageBubble.tsx` | Criar (componente de mensagem com menu) |
| `src/components/messages/MessageActions.tsx` | Criar (dropdown menu de ações) |
| `src/components/messages/ChatView.tsx` | Modificar (usar MessageBubble, adicionar menu header) |
| `src/components/messages/ThreadList.tsx` | Modificar (filtrar hidden_at) |
| `src/components/messages/types.ts` | Modificar (adicionar tipos) |

---

## Detalhes Técnicos

### Editar mensagem
```typescript
await supabase
  .from('messages')
  .update({ body: newText, edited_at: new Date().toISOString() })
  .eq('id', messageId)
  .eq('sender_id', meId);
```

### Excluir para todos
```typescript
await supabase
  .from('messages')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', messageId)
  .eq('sender_id', meId);
```

### Excluir para mim
```typescript
await supabase.rpc('delete_message_for_me', { p_message_id: messageId });
-- RPC que faz: UPDATE messages SET deleted_for = array_append(deleted_for, auth.uid()) WHERE id = p_message_id
```

### Excluir conversa (para mim)
```typescript
await supabase
  .from('conversation_members')
  .update({ hidden_at: new Date().toISOString() })
  .eq('conversation_id', conversationId)
  .eq('user_id', meId);
```
