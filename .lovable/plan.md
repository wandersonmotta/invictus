
Objetivo
- Corrigir o erro ao publicar “invalid_storage_path_post”.
- Manter vídeos no padrão Reels (9:16).
- Ajustar fotos/imagens para recorte obrigatório em 1080x1350 (aspect 4:5) e refletir isso no visual do feed.
- Manter “Início/Fim” para vídeos como já está (recorte aplicado na reprodução), sem alterar o arquivo enviado.

Diagnóstico do erro (por que acontece)
- No frontend, o upload está indo para um caminho com um postId gerado no navegador:
  - path = `${me}/${postId}/${uuid}-${filename}`
- No backend, a função `public.create_feed_post(p_caption, p_media)` cria um post NOVO com ID próprio (`v_post_id := insert ... returning id`) e depois valida que o caminho do arquivo contém esse `v_post_id`.
- Como o `postId` do caminho é diferente do `v_post_id` gerado no backend, a validação falha e retorna:
  - `invalid_storage_path_post`

Decisão confirmada (usuário)
- Corrigir adotando “Frontend define ID” (o navegador gera o postId e o backend usa esse mesmo ID).
- Recorte de fotos obrigatório, mas fluxo de recorte manual por item (o usuário clica em “Recortar imagem” em cada foto).

Plano de implementação

1) Backend (migração no banco)
1.1) Alterar assinatura do RPC `public.create_feed_post`
- De:
  - `create_feed_post(p_caption text, p_media jsonb) returns uuid`
- Para:
  - `create_feed_post(p_post_id uuid, p_caption text, p_media jsonb) returns uuid`

1.2) Inserir o post usando o ID fornecido pelo frontend
- Dentro da função:
  - `v_post_id := p_post_id`
  - Validar `p_post_id`:
    - não pode ser null
    - deve ser UUID válido (tipo já garante)
  - Fazer insert:
    - `insert into feed_posts(id, author_id, caption) values (p_post_id, auth.uid(), ...)`
    - Se já existir o mesmo `id`, lançar erro (para evitar duplicidade/replay).

1.3) Validar caminhos de mídia usando o `p_post_id` (não mais o ID gerado no banco)
- Para cada item em `p_media`, continuar validando:
  - segmento 1 (authorId) == auth.uid()
  - segmento 2 (postId) == p_post_id
- Isso elimina o erro `invalid_storage_path_post` porque o backend e frontend passam a usar o mesmo postId.

1.4) Compatibilidade
- Atualizar o frontend para chamar o RPC com o novo parâmetro `p_post_id`.
- (Opcional, recomendado) Manter uma função “alias” temporária seria possível, mas como o app já está em MVP, a opção mais segura é atualizar direto o frontend e o RPC, evitando duas versões.

2) Frontend — Publicação (corrigir chamada + fluxo de recorte)
2.1) Ajustar `NewFeedPostDialog.tsx` para chamar o RPC com `p_post_id`
- Hoje:
  - `supabase.rpc("create_feed_post", { p_caption, p_media })`
- Vai virar:
  - `supabase.rpc("create_feed_post", { p_post_id: postId, p_caption: caption, p_media: uploaded })`

2.2) Tornar recorte de fotos obrigatório (manual por item)
- Adicionar um estado por item de mídia, ex.:
  - `requiresCrop: boolean` (true para image/*)
  - `isCropped: boolean` (inicia false para imagens; true para vídeos)
- Regras:
  - Se existir qualquer imagem com `isCropped === false`, bloquear “Publicar” e mostrar mensagem clara:
    - “Recorte obrigatório: recorte todas as fotos antes de publicar.”
- Ao salvar no `FeedImageCropDialog`:
  - substituir o arquivo original pelo arquivo recortado (como já faz)
  - marcar `isCropped: true`
  - manter o botão “Recortar imagem” para re-recortar (se o usuário quiser ajustar).

2.3) Ajustar o recorte das imagens para 1080x1350 (4:5)
- Em `FeedImageCropDialog.tsx`:
  - trocar `aspect` de `9/16` para `4/5`
  - trocar `outputWidth/Height` para `1080/1350`
  - atualizar o texto/descrição para “formato 4:5 (1080x1350)”.
- Em `cropImage.ts`, já existe suporte a `outputWidth/outputHeight`, então só precisamos usar os novos valores.

2.4) Garantir que nomes de arquivo continuem seguros
- Manter a sanitização do nome do arquivo (já existe) para evitar “Invalid key”.
- Confirmar que o `path` não contém caracteres proibidos (deve estar ok após sanitização).

3) Frontend — Exibição (padrão Reels para vídeo, 4:5 para foto)
3.1) Atualizar `ReelsMedia.tsx` (ou componente equivalente) para usar aspect ratio por tipo
- Vídeo: 9:16 (Reels)
- Imagem: 4:5 (Instagram feed)
- Estratégia simples:
  - detectar pelo `content_type` e aplicar classes/layout diferentes (ex.: `aspect-[9/16]` vs `aspect-[4/5]`)
  - manter comportamento atual do trim do vídeo (start/end) sem mudanças.

4) Verificação end-to-end (passos de teste)
4.1) Teste de publicação (principal)
- Abrir /feed → “Nova publicação”
- Selecionar 1 imagem:
  - clicar “Recortar imagem”
  - salvar
  - publicar
- Confirmar que:
  - não aparece mais `invalid_storage_path_post`
  - o post aparece no feed
  - a imagem está em 4:5

4.2) Teste com vídeo (Reels)
- Selecionar 1 vídeo mp4/webm
- Definir início/fim
- Publicar
- Confirmar no feed:
  - player 9:16 (Reels)
  - reprodução inicia no trim_start e pausa no trim_end

4.3) Teste misto (imagem + vídeo)
- Confirmar que:
  - imagens exigem recorte antes de publicar
  - vídeos não exigem recorte
  - upload e publicação funcionam para múltiplos arquivos

Observações técnicas importantes
- O erro atual é 100% consistente com a validação do RPC: ele compara o postId do caminho com o ID recém-criado no banco. A correção é alinhar o ID (frontend define e backend usa).
- A política de storage “insert” continua correta (segmento 1 do path precisa ser o userId), não precisa mudar.
- O recorte “obrigatório” será implementado no frontend (UX). Como reforço adicional, se quisermos máxima segurança, podemos registrar (no futuro) metadados `width/height` e validar se imagem final está 4:5, mas isso é etapa 2 e não é necessário para resolver o bug de publicação agora.

Arquivos que serão alterados (quando você aprovar a implementação)
- Migração SQL (nova) ajustando `public.create_feed_post(...)`
- `src/components/feed/NewFeedPostDialog.tsx` (passar p_post_id e tornar recorte obrigatório para imagens)
- `src/components/feed/FeedImageCropDialog.tsx` (4:5 + 1080x1350)
- `src/components/feed/ReelsMedia.tsx` (imagem 4:5, vídeo 9:16)

Critério de aceite
- Publicação funciona sem erro.
- Imagens só publicam após recorte (manual por item), gerando arquivo 1080x1350.
- Vídeos permanecem com visual Reels 9:16 e trim de reprodução funcionando.
