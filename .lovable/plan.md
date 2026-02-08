
# Plano: Historico da IA nos tickets + Triagem + Distribuicao automatica + Presenca de agentes

## Problemas e funcionalidades

### 1. BUG: Historico da conversa com IA nao aparece no ticket

**Causa raiz**: Quando o ticket e escalado no `SupportAIChatPopup.tsx`, o codigo tenta inserir todas as mensagens (incluindo as da IA com `sender_type: "ai"`) direto pelo cliente. Porem, a politica RLS da tabela `support_messages` so permite o usuario inserir mensagens com `sender_type = 'user'`. As mensagens da IA sao silenciosamente rejeitadas.

**Solucao**: Mover a logica de escalacao para uma Edge Function que usa service role, permitindo inserir tanto mensagens do usuario quanto da IA no banco de dados.

### 2. Classificacao de prioridade por triagem da IA

Ao escalar um ticket, a IA analisa o conteudo da conversa e atribui automaticamente uma prioridade:

- **Urgente** (vermelho): Problemas criticos como pagamento, acesso bloqueado, dados perdidos
- **Moderado** (amarelo): Duvidas que precisam de atencao mas nao sao criticas
- **Baixo** (verde): Perguntas gerais, curiosidades, solicitacoes simples

A prioridade aparece como badge colorido na fila de tickets do dashboard.

### 3. Presenca de agentes (online/offline/em atendimento)

Criar uma tabela `support_agent_presence` com heartbeat para rastrear quem esta online. Os agentes enviam um "ping" a cada 30 segundos. Se o ultimo ping tem mais de 60 segundos, o agente e considerado offline.

No dialog de transferencia e no dashboard, mostrar o status de cada agente: "Online", "Em atendimento" (tem ticket assigned), "Offline".

### 4. Distribuicao automatica e igualitaria de tickets

Quando um ticket e escalado, em vez de ficar na fila sem dono, a IA (via Edge Function) distribui automaticamente para o agente online com menos tickets ativos. A distribuicao e igualitaria: se tem 3 agentes e 10 tickets, vai ~3-4 para cada.

O gerente de suporte tambem entra na distribuicao como atendente.

### 5. Auto-transferencia por timeout (12-15 min)

Criar um mecanismo de verificacao periodica (via cron ou polling no frontend). Se um ticket esta "assigned" e a ultima mensagem do agente tem mais de 15 minutos, o ticket e automaticamente transferido para o proximo agente online disponivel.

Para isso, vamos usar um cron job via `pg_cron` (trigger periodico no banco) OU um check no frontend do dashboard com polling a cada 60 segundos que chama uma Edge Function de redistribuicao.

---

## Detalhes tecnicos

### Migration SQL

```text
-- Prioridade nos tickets
ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'auto_assigned';

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'baixo'
  CHECK (priority IN ('urgente', 'moderado', 'baixo'));

-- Tabela de presenca
CREATE TABLE public.support_agent_presence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline')),
  last_heartbeat timestamptz NOT NULL DEFAULT now(),
  active_ticket_count int NOT NULL DEFAULT 0
);

ALTER TABLE public.support_agent_presence ENABLE ROW LEVEL SECURITY;

-- Suporte e admin podem ver presenca
CREATE POLICY "Suporte can view presence"
  ON public.support_agent_presence FOR SELECT
  USING (has_role(auth.uid(), 'suporte'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Agentes podem atualizar propria presenca
CREATE POLICY "Agents can upsert own presence"
  ON public.support_agent_presence FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Habilitar realtime na tabela de presenca
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_agent_presence;
```

### Edge Function nova: `support-escalate`

Responsavel por:
1. Receber o historico da conversa efemera com a IA
2. Criar o ticket no banco (com service role)
3. Inserir todas as mensagens (user + IA) sem restricao de RLS
4. Usar IA para classificar a prioridade (urgente/moderado/baixo)
5. Distribuir automaticamente para o agente online com menos tickets
6. Retornar o ticketId criado

### Edge Function nova: `support-auto-redistribute`

Chamada periodicamente (a cada 60s via polling do dashboard do gerente):
1. Buscar tickets "assigned" onde a ultima resposta do agente tem mais de 15 minutos
2. Para cada um, transferir para o proximo agente online disponivel com menos tickets
3. Inserir mensagem de sistema informando a transferencia automatica

### Hook novo: `useAgentPresence`

Envia heartbeat a cada 30 segundos para `support_agent_presence` via upsert. Roda em todos os componentes do back-office de suporte. Ao desmontar (fechar aba), marca como offline.

### Mudancas no frontend

| Arquivo | Mudanca |
|---------|---------|
| `SupportAIChatPopup.tsx` | Trocar inserts diretos pela chamada a `support-escalate` Edge Function |
| `SuporteDashboard.tsx` | Mostrar badge de prioridade (cores), ordenar por prioridade |
| `TransferTicketDialog.tsx` | Mostrar status online/offline/em atendimento de cada agente em tempo real |
| `SuporteLayout.tsx` | Integrar hook de heartbeat de presenca |
| `SuporteAtendimento.tsx` | Sem mudancas estruturais (ja funciona) |

### Fluxo completo de escalacao (novo)

```text
1. Usuario conversa com IA no popup efemero
2. IA detecta necessidade de escalar -> inclui [ESCALATE]
3. Frontend chama Edge Function support-escalate com historico
4. Edge Function:
   a. Cria ticket
   b. Salva todas as mensagens (user + IA) via service role
   c. Chama IA para classificar prioridade
   d. Busca agentes online na tabela de presenca
   e. Distribui para o agente com menos tickets ativos
   f. Atualiza assigned_to e status = "assigned"
5. Retorna ticketId ao frontend
6. Frontend redireciona usuario para /suporte/:ticketId
```

### Fluxo de redistribuicao automatica por timeout

```text
1. Dashboard do gerente faz polling a cada 60s -> chama support-auto-redistribute
2. Edge Function busca tickets assigned ha mais de 15 min sem resposta do agente
3. Para cada ticket expirado:
   a. Busca agente online com menos tickets (excluindo o atual)
   b. Atualiza assigned_to
   c. Insere mensagem de sistema: "Ticket transferido automaticamente (timeout)"
4. Dashboard atualiza em tempo real via realtime
```

### Arquivos a serem criados

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/support-escalate/index.ts` | Edge Function de escalacao com classificacao e distribuicao |
| `supabase/functions/support-auto-redistribute/index.ts` | Edge Function de redistribuicao por timeout |
| `src/hooks/useAgentPresence.ts` | Hook de heartbeat de presenca |
| Migration SQL | Tabela de presenca + coluna priority nos tickets |

### Arquivos a serem modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/suporte/SupportAIChatPopup.tsx` | Chamar `support-escalate` em vez de inserts diretos |
| `src/pages/suporte-backoffice/SuporteDashboard.tsx` | Badge de prioridade, ordenar, polling de redistribuicao |
| `src/components/suporte-backoffice/TransferTicketDialog.tsx` | Mostrar status de presenca dos agentes |
| `src/components/suporte-backoffice/SuporteLayout.tsx` | Ativar hook de presenca |
| `supabase/config.toml` | Registrar novas Edge Functions |
