

## Correção do Sistema de Mensagens (Direct)

Vou resolver os 4 problemas que você identificou:

### Problema 1: Membro fantasma "Membro" aparece na lista de seleção

**Diagnóstico**: A função `search_approved_members` retorna TODOS os perfis aprovados, incluindo perfis sem nome preenchido (que aparecem como "Membro" por padrão). O perfil `cab4930c-f275-4079-a89f-b1e97a0a4898` no banco tem `display_name = null` e `username = null`.

**Solução**: Modificar a função `search_approved_members` para excluir perfis que não têm nem `display_name` nem `username` preenchidos.

### Problema 2: Lista de "Nova mensagem" mostra qualquer membro (não só mútuos)

**Diagnóstico**: A função `search_approved_members` atualmente retorna qualquer membro aprovado, sem verificar se existe conexão mútua. Você quer que só apareçam pessoas que você segue E que te seguem.

**Solução**: Criar uma nova função `search_mutual_connections` que filtra apenas conexões mútuas (seguem um ao outro) para usar no diálogo de Nova Mensagem.

### Problema 3: Histórico reaparece ao iniciar conversa com pessoa que já excluiu

**Diagnóstico**: Quando você clica em "Nova mensagem" com a Joyce, a função `create_conversation` encontra a conversa existente (mesmo que você tenha marcado `hidden_at`) e retorna o ID dela. O problema é que:
1. A conversa é "re-descoberta" (retorna ID existente)
2. O `hidden_at` NÃO é limpo
3. Mas as mensagens antigas continuam visíveis porque o chat carrega todas mensagens da conversa

**Solução**:
1. Modificar `create_conversation` para, ao re-descobrir conversa oculta, limpar o `hidden_at` (reativar a conversa)
2. Quando a conversa é reativada, marcar todas as mensagens antigas como "excluídas para mim" automaticamente, para que você comece do zero (comportamento Instagram)

### Problema 4: Mensagem "Excluir para todos" ainda mostra placeholder

**Diagnóstico**: Atualmente o `MessageBubble` mostra "Mensagem excluída" quando `deleted_at` está preenchido. Você quer que a mensagem suma completamente (como Instagram).

**Solução**: Modificar o `MessageBubble.tsx` para retornar `null` quando `deleted_at` está preenchido, em vez de mostrar o placeholder.

---

## Arquivos a serem modificados

### 1. Nova migration SQL

Criar migration com:

```text
1. CREATE FUNCTION search_mutual_connections(p_search, p_limit)
   - Retorna apenas conexões mútuas
   - Exclui perfis sem nome E sem username

2. UPDATE FUNCTION create_conversation()
   - Ao encontrar conversa DM existente:
     - Se hidden_at do usuário atual está preenchido:
       - Limpar hidden_at (reativar conversa)
       - Marcar TODAS mensagens antigas como deleted_for do usuário
   - Isso faz com que ao reabrir, o histórico comece do zero
```

### 2. `src/components/messages/NewMessageDialog.tsx`

- Trocar de `search_approved_members` para `search_mutual_connections`
- Só conexões mútuas aparecem na lista de seleção

### 3. `src/components/messages/MessageBubble.tsx`

- Remover o bloco que mostra "Mensagem excluída"
- Quando `deleted_at` está preenchido, retornar `null` (mensagem some completamente)

---

## Resumo das mudanças de comportamento

| Cenário | Antes | Depois |
|---------|-------|--------|
| Quem aparece em "Nova mensagem" | Qualquer membro aprovado | Apenas conexões mútuas |
| Perfis sem nome/username | Aparecem como "Membro" | Não aparecem |
| Excluir conversa → reabrir | Histórico reaparece | Começa do zero |
| "Excluir para todos" | Mostra "Mensagem excluída" | Some totalmente |
| Outra pessoa envia msg após você excluir | Não reaparecia | Reaparece na caixa (hidden_at limpo) |

