
# Plano: Humanizar a IA do Suporte Invictus

## Problema

A IA do suporte responde de forma robotica, usando formatacao markdown (negrito com `**`, listas com `-`, etc.) e linguagem formal demais, como se fosse uma FAQ automatizada. O objetivo e que ela converse como uma pessoa real — uma atendente simpática que conhece bem a plataforma.

## O que sera feito

### 1. Reescrever o system prompt completo

O prompt atual instrui a IA a "usar markdown quando util" e ser "conciso mas completo", o que gera respostas mecanicas. O novo prompt vai:

- **Proibir qualquer formatacao markdown** (sem negrito, italico, listas, titulos)
- Instruir a IA a escrever como se fosse uma mensagem de WhatsApp/chat real
- Usar linguagem natural, informal mas profissional (como uma atendente real falaria)
- Usar emojis com moderacao (como uma pessoa real faria)
- Responder de forma curta e direta, como numa conversa de chat
- Nunca listar funcionalidades de forma mecanica — falar sobre elas naturalmente
- Ter uma personalidade: simpática, acolhedora, que chama o membro pelo nome quando possivel
- Incorporar a base de conhecimento de forma natural, sem parecer que esta lendo um manual

### 2. Novo prompt proposto

O novo prompt vai incluir instrucoes como:

- "Voce e a Ana, atendente da Fraternidade Invictus"
- "Escreva como se estivesse conversando pelo WhatsApp com um amigo profissional"
- "NUNCA use formatacao markdown: nada de **, ##, -, *, listas numeradas"
- "Use frases curtas e naturais. Quebre em paragrafos curtos como numa conversa de chat"
- "Use emojis com moderacao e naturalidade (ex: 😊, 👋, ✅) mas sem exagero"
- "Quando mencionar funcionalidades, fale como se estivesse explicando para um amigo, nao lendo um manual"
- "Adapte seu tom ao do membro: se ele for mais formal, seja um pouco mais formal; se for descontraido, seja descontraida tambem"

### 3. Arquivo a ser modificado

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/support-chat-ephemeral/index.ts` | Reescrever `BASE_SYSTEM_PROMPT` com prompt humanizado, proibir markdown, dar personalidade |

### 4. Nenhuma mudanca no frontend

O frontend ja renderiza texto puro (whitespace-pre-wrap). Ao remover o markdown das respostas, o resultado visual ja sera limpo automaticamente.

## Detalhes Tecnicos

A mudanca e exclusivamente no system prompt da Edge Function `support-chat-ephemeral`. O novo prompt tera aproximadamente 3x mais instrucoes de estilo/tom para garantir que o modelo realmente se comporte como uma pessoa, incluindo:

- Exemplos concretos de como responder (few-shot)
- Proibicao explicita de padroes roboticos
- Instrucoes para adaptar tom ao contexto
- Nome e personalidade definidos para a atendente
