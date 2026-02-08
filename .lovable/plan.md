

# Suporte Invictus -- Chat com IA + Atendimento Humano

## Resumo

Criar um sistema de suporte completo com 3 camadas:

1. **Lado do usuario** (`/suporte`): Botao flutuante de chat + pagina de suporte com historico de tickets
2. **Triagem por IA**: Primeiro atendimento automatizado usando Lovable AI (Gemini) para tirar duvidas e resolver problemas
3. **Back-office de suporte** (`suporte.invictusfraternidade.com.br` / `/suporte-backoffice`): Painel para atendentes humanos gerenciarem tickets escalados

**Ponto chave**: Quando o ticket e escalado para um atendente humano, ele ve TODO o historico de mensagens -- incluindo toda a conversa com a IA -- para ter contexto completo antes de responder.

---

## O que o usuario vai ver

### 1. Pagina `/suporte`
- Botao "Iniciar chat" para abrir um novo ticket
- Lista de tickets anteriores com status (aberto, resolvido, escalado)

### 2. Botao flutuante (bolha de chat)
- Visivel em todas as paginas do app
- Badge com contador de mensagens nao lidas
- Ao clicar, abre o chat do ticket ativo (ou redireciona para `/suporte`)
- Responsivo: canto inferior direito no desktop, acima da nav bar no mobile

### 3. Tela de chat
- Mensagens em tempo real (bolhas estilo WhatsApp)
- Indicador de "digitando..." quando a IA esta respondendo
- Suporte a anexos (imagens, PDFs)
- Primeiro atendimento automatico pela IA
- Botao para "Falar com atendente" apos triagem da IA
- Quando escalado, mostra avatar e nome do atendente humano

---

## O que o atendente vai ver (Back-office)

### 1. Login e acesso
- Subdominio `suporte.invictusfraternidade.com.br` (mesmo padrao do financeiro)
- Login restrito a usuarios com role `suporte`

### 2. Fila de tickets
- Lista de tickets escalados aguardando atendimento
- Filtros: abertos, em atendimento, resolvidos
- Preview da ultima mensagem e dados do usuario

### 3. Tela de atendimento
- **Historico completo desde a primeira mensagem, incluindo todas as mensagens da IA** (com visual diferenciado: bolha cinza com label "IA")
- Chat em tempo real com o usuario
- Painel lateral com perfil do usuario (avatar, nome, plano)
- Suporte a envio de anexos
- Botao para resolver/fechar ticket
- Indicador de "digitando" para ambos os lados

### 4. Aba de treinamento da IA (placeholder)
- Area para adicionar perguntas/respostas ao knowledge base (fase futura)

---

## Detalhes Tecnicos

### Banco de Dados (3 tabelas novas + alteracoes)

**Novo valor no enum `app_role`**: `suporte`

**`support_tickets`**
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `subject` (text, nullable)
- `status` (enum: `open`, `ai_handling`, `escalated`, `assigned`, `resolved`)
- `assigned_to` (uuid, nullable) -- atendente humano
- `escalated_at` (timestamptz, nullable)
- `resolved_at` (timestamptz, nullable)
- `created_at`, `updated_at` (timestamptz)

**`support_messages`** -- armazena TODAS as mensagens (usuario, IA e atendente)
- `id` (uuid, PK)
- `ticket_id` (uuid, FK -> support_tickets)
- `sender_type` (enum: `user`, `ai`, `agent`)
- `sender_id` (uuid, nullable) -- null para IA
- `body` (text, nullable)
- `created_at` (timestamptz)

**`support_message_attachments`**
- `id` (uuid, PK)
- `message_id` (uuid, FK -> support_messages)
- `storage_path`, `content_type`, `file_name`, `size_bytes`
- `created_at` (timestamptz)

**Storage bucket**: `support-attachments`

**Realtime**: Habilitado em `support_tickets` e `support_messages`

**RLS**:
- Usuarios veem apenas seus proprios tickets e mensagens
- Role `suporte` ve todos os tickets escalados/assigned e **todas as mensagens desses tickets** (incluindo as da IA)
- Admins veem tudo

### Edge Function: `support-chat`
- Recebe mensagem do usuario, salva no banco
- Envia historico completo para Lovable AI (google/gemini-3-flash-preview)
- System prompt treinado como atendente virtual Invictus
- Salva resposta da IA como mensagem com `sender_type = 'ai'`
- Detecta pedido de atendente humano e escalona o ticket

### Historico completo no back-office (PONTO PRINCIPAL)
- A query do atendente carrega `support_messages` ordenadas por `created_at ASC` para o ticket
- Cada mensagem tem `sender_type` que determina o visual:
  - `user`: bolha do lado esquerdo com avatar do usuario
  - `ai`: bolha do lado esquerdo com icone de IA e label "Assistente IA"
  - `agent`: bolha do lado direito (propria mensagem do atendente)
- O atendente ve toda a conversa IA-usuario antes de sua primeira resposta
- Nenhuma mensagem e apagada na escalacao -- apenas o status do ticket muda

### Arquivos Novos

**Lado do usuario:**
- `src/pages/Suporte.tsx`
- `src/components/suporte/SupportChatView.tsx`
- `src/components/suporte/SupportChatBubble.tsx`
- `src/components/suporte/SupportMessageBubble.tsx`
- `src/components/suporte/SupportAttachmentPicker.tsx`

**Back-office:**
- `src/pages/suporte-backoffice/SuporteAuth.tsx`
- `src/pages/suporte-backoffice/SuporteDashboard.tsx`
- `src/pages/suporte-backoffice/SuporteAtendimento.tsx`
- `src/components/suporte-backoffice/SuporteLayout.tsx`
- `src/components/suporte-backoffice/SuporteBottomNav.tsx`
- `src/components/suporte-backoffice/TicketList.tsx`
- `src/components/suporte-backoffice/UserProfilePanel.tsx`

**Infraestrutura:**
- `src/hooks/useIsSuporte.ts`
- `src/auth/RequireSuporte.tsx`
- `src/auth/RequireSuporteAuth.tsx`
- `supabase/functions/support-chat/index.ts`

### Arquivos Editados
- `src/lib/appOrigin.ts` -- Adicionar `isSuporteHost`
- `src/routing/HostRouter.tsx` -- Rotas `/suporte` e bloco suporte-backoffice
- `src/components/AppSidebar.tsx` -- Ativar link Suporte
- `src/components/AppLayout.tsx` -- Adicionar `SupportChatBubble`

