
Objetivo
- Trocar de fato a imagem da “Lista de espera” para a variação C (v3c) no Preview do editor, e impedir que o app “caia” silenciosamente para a imagem antiga.

Diagnóstico (com base no que vi no código e no seu relato)
- O componente `WaitlistHero.tsx` já aponta para `invictus-landing-waitlist-media-color-v3c.jpg` como “primary”.
- Porém existe um fallback automático para `invictus-landing-waitlist-media-color.jpg`.
- Se a variação C falhar por qualquer motivo (arquivo corrompido, erro de bundling, HMR não atualizou, etc.), o `onError` troca para o fallback — e você vê exatamente “a imagem antiga” (que é o que você descreveu no Preview).
- Hoje esse erro pode estar acontecendo sem você perceber, porque não estamos exibindo nenhum indicador visual; e o console do Preview pode não estar mostrando o log na sua captura.

O que vou implementar (para fazer “agora” de forma 100% verificável)
1) Instrumentação de debug (temporária, clara e visual)
   - Ajustar `WaitlistHero.tsx` para:
     - Usar `onLoad` e `onError` recebendo o evento do `<img>` (não só uma função sem args).
     - Registrar no console qual URL real carregou (`event.currentTarget.currentSrc`) e qual falhou.
     - Mostrar um “chip” pequeno (apenas no ambiente de desenvolvimento/preview) indicando:
       - “Imagem: v3c” quando carregar a principal
       - “Imagem: fallback” se cair para a antiga
   - Isso elimina dúvida: vamos ver com certeza qual arquivo o browser está usando.

2) Tornar o fallback mais seguro (evitar loops e estados desatualizados)
   - Ajustar a lógica do `onError` para não depender de um `mediaSrc` possivelmente “stale” no closure.
   - Exemplo de comportamento desejado:
     - Se falhar com a primary → troca para fallback uma única vez.
     - Se falhar com fallback → não fica alternando; apenas mantém e exibe um aviso no console.

3) Confirmar se o problema é “arquivo v3c” (e não cache)
   - Depois da instrumentação, vamos olhar:
     - Se o chip mostrar “fallback”, então a v3c realmente está falhando em carregar.
     - Se mostrar “v3c” mas você ainda “vê a antiga”, então o arquivo v3c pode estar igual/errado (conteúdo não atualizado) ou a seção que você está olhando não é a mesma instância.

4) Se v3c estiver falhando: corrigir a causa
   Vou aplicar uma das correções abaixo (a que fizer sentido depois do passo 3):
   - (A) Regerar/reescrever a variação C (mesmo enquadramento) e salvar como um novo asset (ex.: `...-v3d.jpg`) para garantir que:
     - o arquivo não está corrompido
     - o bundler gere um hash novo
     - o browser nunca reaproveite nada antigo
   - (B) Trocar o formato para PNG/WebP (se necessário) e manter o mesmo visual.
   - (C) Se o problema for tamanho/decodificação, eu otimizo (reexport) com compressão mais segura.

5) Garantir que a “troca” é visível imediatamente no Preview
   - Após a correção, vou manter o chip/console por um momento para você confirmar visualmente.
   - Assim que estiver certo, eu removo o chip de debug (mantendo apenas um `onError` discreto).

O que eu preciso de você (bem objetivo) durante o processo
- Assim que eu adicionar o “chip”, você me confirma o que aparece nele:
  - “Imagem: v3c” ou “Imagem: fallback”.
- Se der “fallback”, a gente resolve na mesma sequência regenerando a C (v3d) e apontando o `WaitlistHero` para ela.

Arquivos que serão alterados
- `src/components/landing/WaitlistHero.tsx` (debug + lógica robusta de load/error)
- (Opcional) `src/components/landing/EditorialMedia.tsx` (se eu precisar passar mais dados do evento, mas hoje ele já aceita `onLoad/onError`)
- (Opcional) `src/assets/invictus-landing-waitlist-media-color-v3d.(jpg|png|webp)` (se a v3c estiver com problema e precisarmos substituir por uma versão “nova de verdade”)

Risco/impacto
- Impacto visual: mínimo. A mudança permanente é só garantir que a imagem correta carregue.
- O “chip” é temporário e só para validação no Preview; removo ao final.

Critério de pronto
- No Preview do editor:
  - o chip indica “Imagem: v3c (ou v3d)”
  - a imagem exibida é a nova (handshake homem + mulher, auditório ao fundo)
  - a logo Invictus continua como overlay perfeito no “telão” (como você aprovou).
