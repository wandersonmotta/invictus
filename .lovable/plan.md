
# Plano: Chat IA Flutuante sem Ticket + Treinamento de IA no Back-office

## Resumo das Mudancas

O fluxo de suporte muda fundamentalmente:

1. **Botao flutuante abre um popup/drawer de chat com a IA** -- nao navega para /suporte e nao cria ticket
2. **Conversa com IA e efemera** -- sem historico, sem ticket, sem persistencia
3. **Ticket so e criado quando a IA escala para atendente** -- a IA decide quando oferecer atendente humano
4. **Remover botao "Falar com atendente"** do header do chat do usuario
5. **Pagina /suporte mostra apenas tickets reais** (escalados) -- sem botao "Iniciar chat"
6. **Nova secao "IA" no back-office (admin only)** para inserir treinamentos/knowledge base

---

## Bloco 1 -- Chat Flutuante com IA (Popup/Drawer)

### O que muda no `SupportChatBubble`
Atualmente o botao flutuante navega para `/suporte`. Agora ele vai abrir um popup (desktop) ou drawer (mobile) com um mini-chat inline.

### Novo componente: `SupportAIChatPopup`
- **Desktop**: Popover/dialog fixo no canto inferior direito (~400x500px), estilo WhatsApp Web
- **Mobile**: Drawer (vaul) subindo da parte de baixo, ~90vh de altura
- Chat completamente efemero: mensagens ficam apenas no state React (useState)
- Sem criar ticket, sem persistir no banco
- Input + mensagens + indicador "IA digitando..."
- Ao fechar, o historico some

### Comunicacao com a IA
- Cria uma nova edge function `support-chat-ephemeral` que:
  - NAO cria ticket
  - NAO salva mensagens no banco
  - Recebe o array de mensagens no body (historico vem do client state)
  - Tambem recebe treinamentos do banco (busca `ai_training_entries` ativas e injeta no system prompt)
  - Faz streaming SSE da resposta igual ao `support-chat` atual
  - Se a resposta contem `[ESCALATE]`, retorna um header especial ou campo no SSE indicando escalacao
- Quando IA escala:
  - O frontend cria o ticket automaticamente (`support_tickets` com status `escalated`)
  - Salva todas as mensagens efemeras no banco como historico do ticket
  - Navega para `/suporte/{ticketId}`
  - O atendente no back-office ve todo o contexto da conversa com a IA

### System prompt atualizado
- Remover a regra de "se o membro pedir para falar com atendente"
- A IA tenta resolver sozinha
- Apos 3-4 tentativas sem sucesso, a IA pergunta se o membro gostaria de falar com um especialista
- Se o membro confirmar, a IA retorna `[ESCALATE]`
- A IA nunca sugere atendente humano logo de cara

---

## Bloco 2 -- Pagina /suporte (Apenas Tickets Reais)

### Mudancas em `Suporte.tsx`
- Remover botao "Iniciar chat" (nao cria mais ticket manualmente)
- Lista apenas tickets com status `escalated`, `assigned` ou `resolved`
- Filtrar tickets `ai_handling` da lista (se algum existir por legado)
- Mensagem vazia: "Nenhum atendimento registrado" (em vez de "clique em iniciar chat")

---

## Bloco 3 -- Remover Escalacao Manual do SupportChatView

### Mudancas em `SupportChatView.tsx`
- Remover o botao "Falar com atendente" do header (o que tinha `handleEscalate`)
- Manter botao "Encerrar" para tickets `assigned`/`escalated`
- O chat view agora so e acessado quando ja existe um ticket real

---

## Bloco 4 -- Treinamento da IA (Admin Only no Back-office)

### Banco de dados (migration)

Nova tabela `ai_training_entries`:

```text
id            uuid PK
title         text NOT NULL (titulo do treinamento)
content       text NOT NULL (conteudo/instrucoes para a IA)
category      text (ex: "plataforma", "servicos", "planos")
active        boolean DEFAULT true
created_at    timestamptz
updated_at    timestamptz
created_by    uuid (admin que criou)
```

RLS:
- Admin pode CRUD completo
- Ninguem mais acessa (a edge function usa service role)

### Nova pagina: `SuporteIATreinamento.tsx`
- Acessivel apenas por admin
- Lista de treinamentos com titulo, categoria, status (ativo/inativo)
- Botao para adicionar novo treinamento (dialog com titulo, categoria, conteudo textarea grande)
- Opcao de editar e ativar/desativar cada entrada
- Oculta para usuarios com role `suporte` (apenas admin ve)

### Integracao com a IA
- A edge function `support-chat-ephemeral` busca todos os `ai_training_entries` ativos
- Concatena o conteudo no system prompt como secao "Base de Conhecimento"
- A IA usa essas informacoes para responder com mais precisao

---

## Detalhes Tecnicos

### Migration SQL

```text
CREATE TABLE public.ai_training_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'geral',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.ai_training_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage training entries"
  ON public.ai_training_entries FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### Edge function: `support-chat-ephemeral`

```text
supabase/functions/support-chat-ephemeral/index.ts
- Recebe { messages: [{role, content}] } no body
- Autentica o usuario via JWT
- Busca ai_training_entries ativas com service role
- Monta system prompt = SYSTEM_PROMPT base + "\n\n## Base de Conhecimento\n" + conteudos
- Chama Lovable AI com streaming
- Retorna SSE stream para o client
- Apos stream completo, verifica se contem [ESCALATE] e retorna trailer/final event
```

### Arquivos a criar/modificar

| Arquivo | Acao |
|---------|------|
| Migration SQL | Tabela `ai_training_entries` |
| `supabase/functions/support-chat-ephemeral/index.ts` | **Novo** -- chat IA efemero sem ticket |
| `supabase/config.toml` | Adicionar config para `support-chat-ephemeral` |
| `src/components/suporte/SupportAIChatPopup.tsx` | **Novo** -- popup/drawer de chat flutuante |
| `src/components/suporte/SupportChatBubble.tsx` | Abrir popup em vez de navegar |
| `src/pages/Suporte.tsx` | Remover botao "Iniciar chat", filtrar tickets ai_handling |
| `src/components/suporte/SupportChatView.tsx` | Remover botao "Falar com atendente" |
| `src/pages/suporte-backoffice/SuporteIATreinamento.tsx` | **Novo** -- painel de treinamento IA (admin) |
| `src/components/suporte-backoffice/SuporteLayout.tsx` | Adicionar link "IA" (admin only) |
| `src/components/suporte-backoffice/SuporteBottomNav.tsx` | Adicionar item "IA" (admin only) |
| `src/routing/HostRouter.tsx` | Adicionar rota SuporteIATreinamento |

### Ordem de execucao

1. Migration (tabela `ai_training_entries`)
2. Edge function `support-chat-ephemeral` + config.toml + deploy
3. `SupportAIChatPopup` (componente de chat flutuante efemero)
4. `SupportChatBubble` (abrir popup em vez de navegar)
5. `Suporte.tsx` (remover botao iniciar, filtrar lista)
6. `SupportChatView.tsx` (remover botao "Falar com atendente")
7. `SuporteIATreinamento.tsx` (painel admin)
8. Navegacao + rotas (SuporteLayout, SuporteBottomNav, HostRouter)
