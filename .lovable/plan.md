
Objetivo do ajuste (o que você pediu)
1) Manter todos os canais que já foram criados.
2) Remover a parte de “tema” (lista de temas + botão “Novo tema”), porque não é necessária.
3) Ao clicar em um canal (Geral/Network/etc), abrir imediatamente a conversa daquele canal e mostrar:
   - feed de mensagens (posts)
   - caixa para digitar/enviar
   - anexos (mídia + documentos), como já está no componente de conversa

Diagnóstico do problema atual (por que “não abre a caixa de mensagens”)
- A tela atual (/comunidade) está estruturada em 3 colunas: **Canais → Temas → Conversa do Tema**.
- A conversa (com a caixa de mensagem) só aparece quando existe `threadId` na rota (`/comunidade/:threadId`).
- Ao clicar em um canal hoje, você só troca `channelId` (coluna de canais), mas não seleciona nenhum `threadId`. Resultado: a coluna de conversa mostra “Selecione um tema” e não aparece a caixa para enviar mensagens.

Mudança de UX (nova navegação)
- O app vai virar “**Canais fixos = salas de chat**”.
- Ao selecionar um canal, o app abre automaticamente a “sala” daquele canal (sem passar por temas).
- Implementação prática (para reaproveitar o backend já feito):
  - Cada canal terá um “thread único” (interno) que representa a conversa daquele canal.
  - A UI não mostrará threads/temas; apenas canais e a conversa.

Como vamos implementar sem mexer no banco
- Já existe RPC `list_community_threads(p_channel_id...)` e `create_community_thread(p_channel_id, p_title, p_body)`:
  1) Ao clicar em um canal, vamos buscar **o primeiro thread** daquele canal (limit 1).
  2) Se existir, navega para `/comunidade/<thread_id>`.
  3) Se não existir (canal novo/sem conversa ainda), cria um thread automaticamente e navega para ele.
- Assim a conversa abre sempre e a caixa de mensagens aparece (porque `CommunityThreadView` depende de `threadId`).

Arquivos que serão alterados (frontend)
1) `src/pages/Comunidade.tsx` (principal)
   - Remover a coluna do meio inteira:
     - `CommunityThreadList`
     - `NewThreadDialog`
   - Layout novo:
     - Desktop: 2 colunas `Canais (320px) + Conversa (flex)`
     - Mobile: segue a lógica atual “lista vs conversa”, mas agora a lista será apenas canais.
   - Lógica nova ao selecionar canal:
     - `ensureChannelThread(channelId)`:
       - chama `list_community_threads` com `p_limit: 1`
       - se retornar thread, navega `/comunidade/<threadId>`
       - se retornar vazio, chama `create_community_thread` com título automático (ex.: `#Geral` ou `Canal: Geral`) e navega
   - Sincronizar canal selecionado quando a pessoa entra direto em `/comunidade/:threadId`:
     - usar `get_community_thread(threadId)` para obter `channel_id` e marcar o canal correto na lista

2) `src/components/community/ChannelList.tsx`
   - Ajustar textos (não falar mais “ver temas”):
     - “Escolha um canal para ver as mensagens.”
   - (Opcional) Melhorar o estado visual do item ativo e manter como já está.

3) `src/components/community/CommunityThreadView.tsx`
   - Ajustar linguagem/labels para “canal” (e não “tema”):
     - Cabeçalho: mostrar `#<channel_name>` como título principal
     - (Opcional) esconder o título do thread para não aparecer como “Tema”
   - Manter a caixa de mensagem e anexos como está (já funciona).

“Print da aba de comunidade”
- Depois das alterações acima, eu vou abrir a rota `/comunidade`, selecionar um canal e capturar um print com:
  - lista de canais à esquerda
  - conversa aberta à direita com a caixa de mensagem visível
- Vou te entregar esse print na conversa (para você validar visualmente).

Critérios de aceite (o que vai estar resolvido)
1) Em `/comunidade`, ao clicar em **Geral/Networking/etc**, abre a conversa do canal imediatamente (sem “temas”).
2) A caixa de mensagem aparece sempre que um canal está selecionado (porque sempre teremos um `threadId`).
3) Upload de anexos continua funcionando na conversa do canal (mídia + documentos).
4) Todos os canais existentes continuam exatamente como foram criados (sem deletar nem renomear no banco).

Testes rápidos (checklist)
- Desktop: clicar em 3 canais diferentes e confirmar que cada um abre uma conversa distinta.
- Mobile: clicar no canal → abre conversa; botão “Voltar” retorna para lista de canais.
- Enviar mensagem e anexar 1 imagem + 1 PDF; abrir anexos em nova aba.
- Realtime: com dois usuários aprovados, enviar mensagem em um canal e confirmar atualização ao vivo.

Riscos/observações
- “Thread único por canal” é uma convenção de UI (não uma restrição do banco). Futuramente, se você quiser voltar com “temas”, o backend já estará pronto; bastaria reativar a coluna do meio.
