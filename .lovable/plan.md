

# Plano: Adicionar Anexos e Áudio nas Mensagens Diretas

## Visão Geral

Implementar envio de **anexos** (imagens, PDFs, documentos) e **mensagens de áudio** no sistema de mensagens diretas, seguindo o padrão do Instagram:
- Botão de anexo para arquivos/imagens
- Botão de microfone para gravar áudio
- Opção de apagar para todos / apagar para mim nos anexos e áudios

## Estrutura Atual

| Componente | Status |
|------------|--------|
| Bucket `dm-attachments` | Existe |
| Tabela `message_attachments` | Existe |
| Políticas de upload/download | Existe |
| RPC `send_message` retorna `message_id` | Existe |
| RPC `delete_message_for_me` | Existe |

A infraestrutura já está pronta, falta apenas a interface e a lógica de upload.

## Mudanças Técnicas

### 1. Criar componente `AudioRecorder.tsx`

Novo componente para gravação de áudio usando a API `MediaRecorder`:

```text
┌─────────────────────────────────────────────────────────────┐
│  [🎤]  ────────────────────  0:12  [⏹️]                    │
│   Gravando...                                               │
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Pressionar para iniciar gravação
- Barra de progresso com tempo decorrido
- Botão de parar/cancelar
- Limite máximo de 60 segundos
- Formato de saída: WebM (ampla compatibilidade)

### 2. Criar componente `AttachmentPicker.tsx`

Componente para seleção de arquivos:

```text
┌─────────────────────────────────────────────────────────────┐
│  📎 foto.jpg (1.2 MB)                        [❌ Remover]   │
└─────────────────────────────────────────────────────────────┘
```

**Tipos permitidos:**
- Imagens: JPEG, PNG, WEBP, GIF
- Documentos: PDF
- Limite: 20MB por arquivo

### 3. Criar componente `AudioPlayer.tsx`

Player de áudio para exibir mensagens de voz:

```text
┌─────────────────────────────────────────────────────────────┐
│  [▶️]  ●────────────────  0:12 / 0:45                      │
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Play/Pause
- Barra de progresso clicável
- Indicação de tempo atual/total

### 4. Modificar `ChatView.tsx`

Atualizar a área de input:

**Antes:**
```text
┌──────────────────────────────────────────────────────────┐
│  [           Mensagem...           ]  [Enviar]           │
└──────────────────────────────────────────────────────────┘
```

**Depois:**
```text
┌──────────────────────────────────────────────────────────┐
│  [📎]  [           Mensagem...           ]  [🎤/Enviar]  │
└──────────────────────────────────────────────────────────┘
```

**Lógica:**
- Se campo vazio: mostra ícone de microfone para gravar áudio
- Se campo com texto: mostra botão "Enviar"
- Clique no 📎: abre seletor de arquivo
- Clique no 🎤: inicia gravação

**Fluxo de envio com anexo:**
1. Usuário seleciona arquivo(s)
2. Preview aparece acima do input
3. Ao enviar:
   - Chama `send_message` para criar a mensagem (pode ser só com body ou body vazio)
   - Faz upload do(s) arquivo(s) para `dm-attachments/{conversation_id}/{message_id}/`
   - Insere metadados em `message_attachments`

### 5. Modificar `MessageBubble.tsx`

Exibir anexos e áudios junto com a mensagem:

```text
Mensagem com anexo:
┌─────────────────────────────────────────────────────────────┐
│  [🖼️ Imagem]                                               │
│  Olha essa foto!                                           │
│  10:42                                                     │
└─────────────────────────────────────────────────────────────┘

Mensagem de áudio:
┌─────────────────────────────────────────────────────────────┐
│  [▶️]  ●────────────  0:12                                 │
│  10:43                                                     │
└─────────────────────────────────────────────────────────────┘
```

**Query atualizada:**
```sql
SELECT m.*, 
  COALESCE(
    (SELECT json_agg(row_to_json(a.*))
     FROM message_attachments a 
     WHERE a.message_id = m.id), '[]'
  ) as attachments
FROM messages m
WHERE m.conversation_id = $1
```

### 6. Criar função RPC `send_message_with_attachments`

Nova RPC que permite enviar mensagem com body opcional (para áudios sem texto):

```sql
CREATE OR REPLACE FUNCTION send_message_with_attachments(
  p_conversation_id UUID,
  p_body TEXT DEFAULT NULL
)
RETURNS UUID
```

- Permite `p_body` vazio/null (para mensagens só de áudio/anexo)
- Retorna `message_id` para uso no upload

### 7. Atualização do tipo `MessageRow`

```typescript
export type MessageRow = {
  id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  deleted_for?: string[] | null;
  attachments?: {
    id: string;
    storage_path: string;
    content_type: string;
    file_name: string | null;
    size_bytes: number | null;
  }[];
};
```

## Fluxo de Exclusão

A exclusão já funciona para a mensagem toda. Os anexos:
- **Excluir para todos**: `deleted_at` na mensagem esconde tudo
- **Excluir para mim**: `deleted_for` na mensagem esconde tudo

Os arquivos no storage não são deletados imediatamente (soft-delete), permitindo recuperação se necessário.

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/messages/AudioRecorder.tsx` | Criar |
| `src/components/messages/AudioPlayer.tsx` | Criar |
| `src/components/messages/AttachmentPicker.tsx` | Criar |
| `src/components/messages/AttachmentPreview.tsx` | Criar |
| `src/components/messages/ChatView.tsx` | Modificar |
| `src/components/messages/MessageBubble.tsx` | Modificar |
| `supabase/migrations/xxx.sql` | Criar (RPC atualizada) |

## UX Mobile

O comportamento será responsivo:
- Botão de microfone segue padrão "tap to record, tap to stop"
- Prévia de arquivos compacta
- Player de áudio otimizado para toque

