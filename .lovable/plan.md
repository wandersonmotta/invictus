
# Ajustes no Chat Flutuante de Suporte

## O que muda

### 1. Icone flutuante funciona como toggle (abrir/fechar)
- Clicar no icone abre o chat
- Clicar novamente no icone fecha o chat (em vez de so poder fechar pelo X)
- O icone permanece visivel mesmo com o chat aberto (remover o `hidden` quando `chatOpen`)
- O X dentro do chat continua funcionando normalmente tambem

### 2. Badge de notificacao no icone
- Ja existe no codigo atual e funciona via realtime (linhas 60-64 do SupportChatBubble)
- Nenhuma alteracao necessaria nesse ponto

### 3. Nome alterado para "Ana - Suporte Invictus"
- No header do chat, trocar "Suporte Invictus" para "Ana - Suporte Invictus"

## Detalhes tecnicos

### Arquivo: `src/components/suporte/SupportChatBubble.tsx`
1. Mudar `handleClick` para fazer toggle: `setChatOpen(prev => !prev)` em vez de so `setChatOpen(true)`
2. Zerar unread apenas ao abrir (nao ao fechar)
3. Remover a classe `chatOpen && !isMobile && "hidden"` para que o icone fique sempre visivel

### Arquivo: `src/components/suporte/SupportAIChatPopup.tsx`
1. Linha 196: trocar `Suporte Invictus` para `Ana - Suporte Invictus`
