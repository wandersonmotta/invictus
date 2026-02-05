
# Plano: Não Mostrar Conversas Sem Mensagens na Lista

## Problema Identificado

Quando o usuário inicia uma nova conversa selecionando um contato mas não envia nenhuma mensagem, a conversa é criada no banco de dados e aparece na lista de threads. O comportamento esperado é que conversas só apareçam após pelo menos uma mensagem ser enviada (similar ao Instagram).

**Evidência no banco:**
- Conversa criada em 05/02/2026 com `last_message_at: NULL` e `message_count: 0`
- Esta conversa está aparecendo na lista mesmo sem ter mensagens

## Solução

Modificar a função `get_my_threads` no banco de dados para filtrar conversas onde `last_message_at IS NULL`. Assim, apenas conversas com pelo menos uma mensagem aparecem na lista.

## Mudanças Técnicas

### Migração SQL

Atualizar a função `get_my_threads` adicionando um filtro na query:

```sql
WHERE me.uid IS NOT NULL
  AND cm.user_id = me.uid
  AND cm.folder = p_folder
  AND cm.hidden_at IS NULL
  AND c.last_message_at IS NOT NULL  -- Nova condição
```

A mudança será aplicada no JOIN da CTE `agg` para garantir que apenas conversas com mensagens sejam retornadas.

## Fluxo Corrigido

```text
┌─────────────────────────────────────────────────────────────┐
│         USUÁRIO CLICA "NOVA MENSAGEM"                       │
│           Seleciona contato → Cria conversa                 │
└─────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
    Não envia mensagem           Envia mensagem
          │                           │
          ▼                           ▼
   last_message_at = NULL     last_message_at = now()
          │                           │
          ▼                           ▼
   NÃO APARECE na lista       APARECE na lista ✓
```

## Resultado Esperado

- Conversas só aparecem na lista após envio da primeira mensagem
- Conversas "fantasmas" (criadas mas sem mensagens) ficam invisíveis
- Se o usuário enviar uma mensagem depois, a conversa passa a aparecer normalmente
