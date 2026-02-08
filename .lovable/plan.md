
# Corrigir texto estranho ("thoughtful wheel 16 waves") na resposta da IA

## Problema

O modelo Gemini esta vazando "tokens de pensamento" (thinking tokens) no inicio da resposta. O texto "thoughtful wheel 16 waves" nao e uma resposta real da Ana -- e um artefato interno do modelo que aparece antes da mensagem de verdade.

Alem disso, a base de conhecimento esta sendo injetada com headers markdown (`## Base de Conhecimento`, `### titulo`), o que contradiz a regra de "nada de markdown" e pode confundir o modelo.

## O que sera feito

### 1. Filtrar tokens de pensamento no backend

Adicionar logica na Edge Function para detectar e remover o campo `reasoning_content` ou tokens de "thought" que o Gemini pode retornar antes do conteudo real. O modelo as vezes retorna um campo separado de "thinking" -- vamos ignora-lo completamente.

### 2. Filtrar no frontend tambem (dupla protecao)

Antes de exibir a primeira resposta da IA, aplicar um filtro que remove qualquer texto que apareca antes da saudacao real. Se o conteudo acumulado comecar com palavras sem sentido (nao portugues), limpar ate encontrar texto valido.

### 3. Corrigir a injecao da base de conhecimento

Trocar os headers markdown (`## Base de Conhecimento`, `### titulo`) por texto simples, alinhado com a regra de proibir markdown no prompt.

### 4. Forcar modelo a nao "pensar em voz alta"

Adicionar instrucao explicita no system prompt: "NUNCA inclua pensamentos internos, rascunhos ou texto aleatorio antes da sua resposta. Comece SEMPRE diretamente com sua mensagem para o membro."

## Arquivos a serem modificados

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/support-chat-ephemeral/index.ts` | Remover markdown da injecao de conhecimento, adicionar instrucao anti-thinking no prompt, filtrar thinking tokens do stream |
| `src/components/suporte/SupportAIChatPopup.tsx` | Adicionar filtro de seguranca no frontend para limpar tokens estranhos do inicio da resposta |

## Detalhes Tecnicos

### Edge Function - Mudancas no prompt e injecao

```text
// Injecao de conhecimento SEM markdown:
// Antes: "## Base de Conhecimento\n\n### Titulo (categoria)\nconteudo"
// Depois: "BASE DE CONHECIMENTO:\n\nTitulo (categoria): conteudo"

// Nova instrucao no prompt:
// "NUNCA inclua pensamentos, rascunhos, palavras aleatorias ou qualquer texto
//  antes da sua resposta. Sua primeira palavra deve ser SEMPRE parte da
//  mensagem para o membro."
```

### Edge Function - Filtro de thinking tokens no stream

Ao processar o stream SSE antes de retornar ao cliente, interceptar cada chunk e ignorar deltas que contenham `reasoning_content` ou que venham marcados como "thinking". Tambem passar `temperature: 0.7` para reduzir aleatoriedade.

### Frontend - Filtro de seguranca

Aplicar um regex simples no conteudo acumulado da IA para detectar e remover prefixos sem sentido (palavras em ingles aleatorias como "thoughtful wheel waves") antes de exibir.
