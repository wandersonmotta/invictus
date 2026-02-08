

# Plano Unificado: Perfil Atendente + Encerramento Bidirecional + Avaliacao + Resumo IA

Este plano consolida as duas solicitacoes anteriores em uma implementacao unica.

---

## Bloco 1 -- Perfil Obrigatorio do Atendente

Quando um novo atendente faz login no back-office pela primeira vez, ele ainda nao tem `first_name`, `last_name` e `avatar_url`. O sistema detecta isso e exibe uma tela de setup obrigatoria.

**O que acontece:**
- O `SuporteLayout` carrega o perfil do atendente logado
- Se faltar nome, sobrenome ou foto, renderiza a tela de setup em vez do conteudo normal
- A tela tem campos de nome, sobrenome e upload de foto com crop circular (reutilizando `AvatarCropDialog`)
- Apos salvar, a tela some permanentemente -- nao ha opcao de editar depois

**Arquivos:**
- Criar `src/components/suporte-backoffice/SuporteProfileSetup.tsx`
- Modificar `src/components/suporte-backoffice/SuporteLayout.tsx`

---

## Bloco 2 -- Foto do Usuario no Proprio Chat

Atualmente o `SupportChatView` nao exibe o avatar do usuario nas mensagens dele.

**Alteracao:**
- Buscar o perfil do usuario logado (`avatar_url`, `display_name`) no `SupportChatView`
- Passar `senderAvatar` e `senderName` nas mensagens com `sender_type === "user"`

**Arquivo:** `src/components/suporte/SupportChatView.tsx`

---

## Bloco 3 -- Encerramento Bidirecional

Tanto o atendente quanto o usuario podem encerrar o ticket. Ambos os lados sincronizam via realtime.

**Lado do usuario (SupportChatView):**
- Botao "Encerrar atendimento" no header, visivel quando status e `assigned` ou `escalated`
- Ao clicar, atualiza o ticket para `status = 'resolved'` e `resolved_at = now()`
- Apos resolver, dispara a geracao do resumo IA e exibe o dialog de avaliacao

**Lado do atendente (SuporteAtendimento):**
- Ja tem o botao "Resolver" -- ao clicar, tambem dispara o resumo IA
- O usuario ve a mudanca via realtime e recebe o dialog de avaliacao

**Arquivos:** `SupportChatView.tsx`, `SuporteAtendimento.tsx`

---

## Bloco 4 -- Sistema de Avaliacao com Estrelas

### Banco de dados (migration)

Nova tabela `support_ratings`:

```text
id          uuid PK
ticket_id   uuid NOT NULL UNIQUE
user_id     uuid NOT NULL
agent_id    uuid (nullable)
rating_resolved  smallint NOT NULL (1-5) -- "O problema foi solucionado?"
rating_agent     smallint NOT NULL (1-5) -- "O atendente foi cordial/ajudou?"
created_at  timestamptz DEFAULT now()
```

RLS:
- Usuario pode inserir propria avaliacao (user_id = auth.uid())
- Usuario pode ver propria avaliacao
- Admin pode ver todas
- Ninguem atualiza ou deleta

### Dialog de avaliacao (usuario)
- Exibido automaticamente quando o ticket muda para `resolved` (por qualquer lado)
- Duas perguntas com estrelas clicaveis (1-5):
  - "O seu problema foi solucionado?"
  - "O atendente foi cordial e ajudou a resolver?"
- Se ja avaliou, nao exibe novamente

**Arquivos:**
- Criar `src/components/suporte/SupportRatingDialog.tsx`
- Modificar `SupportChatView.tsx`

---

## Bloco 5 -- Resumo por IA

### Coluna nova
Adicionar `ai_summary text` na tabela `support_tickets`.

### Edge function: `support-summarize`
- Recebe `{ ticketId }` no body
- Valida autenticacao (dono do ticket, suporte ou admin)
- Busca todas as mensagens do ticket com service role
- Chama Lovable AI (gemini-3-flash-preview) com prompt pedindo:
  - O que o usuario relatou/perguntou
  - O que o atendente/IA respondeu
  - Qual foi a resolucao final
- Salva o resumo no campo `ai_summary` do ticket
- Chamada disparada automaticamente quando o ticket e resolvido (por qualquer lado)

**Arquivos:**
- Criar `supabase/functions/support-summarize/index.ts`
- Adicionar em `supabase/config.toml`

---

## Bloco 6 -- Painel de Avaliacoes no Back-office (Admin)

Nova aba "Avaliacoes" no sidebar, visivel apenas para admin.

**Funcionalidades:**
- Lista de avaliacoes com: nome do usuario, nome do atendente, nota "solucionado", nota "cordialidade", resumo IA, data
- Busca em dois estagios (avaliacoes + perfis separados, conforme padrao do projeto)

**Arquivos:**
- Criar `src/pages/suporte-backoffice/SuporteAvaliacoes.tsx`
- Modificar `SuporteLayout.tsx` e `SuporteBottomNav.tsx` (link admin only)
- Adicionar rota em `HostRouter.tsx`

---

## Detalhes Tecnicos

### Migration SQL

```text
-- Coluna para resumo IA
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS ai_summary text;

-- Tabela de avaliacoes
CREATE TABLE public.support_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  agent_id uuid,
  rating_resolved smallint NOT NULL,
  rating_agent smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own rating"
  ON public.support_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own rating"
  ON public.support_ratings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all ratings"
  ON public.support_ratings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "No update ratings"
  ON public.support_ratings FOR UPDATE USING (false);

CREATE POLICY "No delete ratings"
  ON public.support_ratings FOR DELETE USING (false);
```

### Todos os arquivos a criar/modificar

| Arquivo | Acao |
|---------|------|
| Migration SQL | Tabela `support_ratings` + coluna `ai_summary` |
| `src/components/suporte-backoffice/SuporteProfileSetup.tsx` | **Novo** -- tela de setup obrigatoria do atendente |
| `src/components/suporte-backoffice/SuporteLayout.tsx` | Verificar perfil incompleto + link Avaliacoes (admin) |
| `src/components/suporte-backoffice/SuporteBottomNav.tsx` | Item Avaliacoes (admin) |
| `src/components/suporte/SupportChatView.tsx` | Avatar do usuario, botao encerrar, trigger avaliacao, chamar summarize |
| `src/components/suporte/SupportRatingDialog.tsx` | **Novo** -- dialog de avaliacao com estrelas |
| `src/pages/suporte-backoffice/SuporteAtendimento.tsx` | Chamar summarize ao resolver |
| `src/pages/suporte-backoffice/SuporteAvaliacoes.tsx` | **Novo** -- painel de avaliacoes (admin) |
| `supabase/functions/support-summarize/index.ts` | **Novo** -- gera resumo IA do atendimento |
| `supabase/config.toml` | Adicionar config para `support-summarize` |
| `src/routing/HostRouter.tsx` | Rota para SuporteAvaliacoes |

### Ordem de execucao

1. Migration (tabela `support_ratings` + coluna `ai_summary`)
2. Edge function `support-summarize` + config.toml + deploy
3. Perfil obrigatorio do atendente (`SuporteProfileSetup` + `SuporteLayout`)
4. Avatar do usuario no chat (`SupportChatView`)
5. Encerramento bidirecional (`SupportChatView` + `SuporteAtendimento` chamando summarize)
6. Dialog de avaliacao (`SupportRatingDialog` + integracao no `SupportChatView`)
7. Painel de avaliacoes no back-office (`SuporteAvaliacoes` + navegacao + rota)

