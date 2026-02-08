

# Plano: Correções e Melhorias no Sistema de Suporte

## Problemas Identificados

1. **Edge Function `support-chat` quebrada** -- usa `supabase.auth.getClaims()` que nao existe. Por isso o chat com IA nao funciona e nenhum ticket escala corretamente.
2. **Falta anexo de arquivos** no chat do usuario (UI nao tem botao de anexar).
3. **Falta indicadores de status de mensagem** (enviado / visualizado).
4. **Falta foto do perfil do atendente** nas mensagens do back-office.
5. **Falta aba de gestao de equipe** no back-office (cadastrar novos atendentes).

---

## 1. Corrigir Edge Function `support-chat`

Substituir `supabase.auth.getClaims(token)` por `supabase.auth.getUser()` (padrao usado em todas as outras edge functions do projeto). Isso vai destravar o chat com IA e permitir que tickets sejam escalados automaticamente quando a IA responde com `[ESCALATE]`.

---

## 2. Anexo de Arquivos no Chat do Usuario

A tabela `support_message_attachments` e o bucket `support-attachments` ja existem no banco. Falta apenas a UI.

**Alteracoes:**
- Adicionar botao de anexo (clip) no `SupportChatView.tsx` (lado do usuario)
- Upload do arquivo para o bucket `support-attachments` via Storage API
- Criar o registro na tabela `support_message_attachments` vinculado a mensagem
- Exibir anexos no `SupportMessageBubble.tsx` (imagens inline, outros arquivos como link)
- Adicionar a mesma funcionalidade no `SuporteAtendimento.tsx` (lado do atendente)

---

## 3. Indicadores de Status de Mensagem

Adicionar coluna `read_at` na tabela `support_messages` para rastrear visualizacao.

**Logica:**
- **Um check** = mensagem enviada (aparece imediatamente ao enviar)
- **Dois checks** (visualizado) = aparece apenas quando o atendente responde (ou seja, quando chega uma mensagem com `sender_type = 'agent'`, todas as mensagens anteriores do usuario sao marcadas como lidas)

**Alteracoes:**
- Migration: adicionar coluna `read_at timestamptz` em `support_messages` + policy de UPDATE para suporte poder atualizar
- No `SuporteAtendimento.tsx`: ao abrir um ticket, marcar mensagens do usuario como lidas (atualizar `read_at`)
- No `SupportMessageBubble.tsx`: exibir icone de check/double-check para mensagens do usuario

---

## 4. Foto do Perfil do Atendente no Back-office

Quando o atendente envia uma mensagem, o `SupportMessageBubble` no lado do usuario mostra um icone generico. Precisamos carregar o perfil do atendente (avatar + nome) para exibir corretamente.

**Alteracoes:**
- No `SupportChatView.tsx`: buscar perfis dos atendentes que enviaram mensagens (via `sender_id` onde `sender_type = 'agent'`)
- Passar `senderAvatar` e `senderName` para o `SupportMessageBubble` nas mensagens de agentes
- Mesma logica no `SuporteAtendimento.tsx` para mostrar o avatar do proprio atendente

---

## 5. Gestao de Equipe de Suporte (Back-office)

Nova aba no sidebar do back-office para o admin de suporte gerenciar a equipe.

**Funcionalidades:**
- Listar atendentes atuais (usuarios com role `suporte`)
- Formulario para cadastrar novo atendente: e-mail, senha, nome completo
- Ao cadastrar, o sistema cria o usuario via edge function (signup), insere a role `suporte`, e exige que o atendente complete seu perfil (nome + foto) no primeiro acesso
- Remover atendente (remover role `suporte`)

**Alteracoes:**
- Nova edge function `manage-support-agents` para criar usuario + atribuir role (precisa service_role)
- Nova pagina `SuporteEquipe.tsx` no back-office
- Adicionar rota e link na sidebar/bottom nav
- RLS: apenas usuarios com role `suporte` + alguma flag de "admin de suporte" ou role `admin` podem gerenciar

---

## Detalhes Tecnicos

### Migration SQL necessaria

```text
-- Adicionar read_at para rastreamento de visualizacao
ALTER TABLE public.support_messages ADD COLUMN read_at timestamptz;

-- Permitir suporte atualizar read_at
CREATE POLICY "Suporte can mark messages read"
  ON public.support_messages FOR UPDATE
  USING (
    has_role(auth.uid(), 'suporte'::app_role) AND
    sender_type = 'user'
  );

-- Remover policy antiga que bloqueia updates
DROP POLICY IF EXISTS "No update messages" ON public.support_messages;
```

### Arquivos a criar/modificar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/support-chat/index.ts` | Corrigir auth (getClaims -> getUser) |
| `src/components/suporte/SupportChatView.tsx` | Adicionar anexos, indicadores de status, carregar perfil do agente |
| `src/components/suporte/SupportMessageBubble.tsx` | Exibir anexos e indicadores de status |
| `src/pages/suporte-backoffice/SuporteAtendimento.tsx` | Adicionar anexos, marcar como lido |
| `src/pages/suporte-backoffice/SuporteEquipe.tsx` | **Novo** - gestao de equipe |
| `supabase/functions/manage-support-agents/index.ts` | **Novo** - criar/remover atendentes |
| `src/components/suporte-backoffice/SuporteLayout.tsx` | Adicionar link "Equipe" no sidebar |
| `src/components/suporte-backoffice/SuporteBottomNav.tsx` | Adicionar item "Equipe" |
| `src/routing/HostRouter.tsx` | Adicionar rota para SuporteEquipe |

### Ordem de execucao

1. Migration (read_at + policy update)
2. Corrigir edge function support-chat
3. Criar edge function manage-support-agents
4. Implementar UI de anexos no chat (usuario + back-office)
5. Implementar indicadores de status
6. Carregar e exibir perfis dos atendentes
7. Criar pagina de gestao de equipe

