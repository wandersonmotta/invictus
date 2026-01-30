
Objetivo (agora)
- Substituir a imagem `invictus-landing-waitlist-media-color-v3d.jpg` por uma versão 100% fotográfica/cinematográfica no padrão Invictus, seguindo fielmente a referência enviada (evento real, luz quente, bokeh, textura de pele real, sem aparência de animação/CGI).
- Manter a logo Invictus exatamente como está hoje (overlay no código), sem qualquer texto/elemento “inventado” dentro da imagem.

O que eu vi no projeto (para alinhar)
- O card “Lista de espera” usa `waitlistMediaPrimary` importando `src/assets/invictus-landing-waitlist-media-color-v3d.jpg`.
- Existe fallback para `invictus-landing-waitlist-media-color.jpg` caso a imagem principal falhe.
- O overlay da logo Invictus é feito por código (ótimo, porque evita artefatos de IA na imagem).

Estratégia de correção (sem “palhaçada” e sem mexer no layout)
1) Usar sua referência como guia real (não como “inspiração vaga”)
   - Vou usar a imagem enviada (o screenshot com o homem e a mulher apertando as mãos, evento ao fundo, luz quente e desfoque) como referência direta para recriar uma mídia no mesmo estilo.

2) Gerar uma imagem nova com padrão “foto de câmera / evento real”
   - Vou gerar (ou editar a partir da referência) com um modelo de maior qualidade (Nano banana pro: `google/gemini-3-pro-image-preview`) para aumentar realismo.
   - Parâmetros de direção visual (o que vou “forçar” na geração):
     - Fotorealismo: textura de pele natural, poros leves, cabelo real, sombras coerentes, sem contornos “pintados”.
     - Cinematográfico: luz quente de salão, highlights suaves, contraste premium, leve grão de filme (muito sutil), profundidade de campo curta (bokeh realista).
     - Composição: handshake em primeiro plano, pessoas ao fundo desfocadas, clima de networking/evento.
     - Sem texto, sem logos, sem lettering, sem “placas” ou “nomenclatura” na imagem.
     - Evitar aparência “3D/CGI/anime/ilustrada”: vou incluir negativas explícitas contra cartoon/illustration/CGI/Unreal look.

3) Aplicar no projeto sem mexer em código (ou com mudança mínima)
   Opção A (preferida para estabilidade imediata)
   - Sobrescrever o arquivo existente `src/assets/invictus-landing-waitlist-media-color-v3d.jpg` com a nova imagem fotográfica.
   - Vantagem: não precisa alterar `WaitlistHero.tsx` e você vê a troca instantânea no Preview.

   Opção B (fallback caso o Preview “teime” em cache)
   - Criar um novo asset `...-v3e.jpg` e trocar o import em `WaitlistHero.tsx`.
   - Vantagem: força hash novo no build e elimina qualquer cache/HMR preso.

4) Garantias de qualidade (checklist antes de te pedir opinião)
   - Confirmar no Preview:
     - A imagem está realmente fotográfica (nada de animação).
     - Não existe texto/artefato gerado.
     - A logo overlay está perfeita e legível por cima (como hoje).
     - O enquadramento funciona bem dentro do 16:9 do `EditorialMedia`.

5) Limpeza opcional (para manter o projeto enxuto)
   - Se `src/assets/waitlist-reference.png` não for mais necessário depois da aprovação final, posso remover esse arquivo do projeto (é só referência interna).

Como você valida (bem objetivo)
- Você abre a home no Preview e olha o card “Lista de espera”.
- Me responde apenas:
  1) “Agora está 100% foto real / cinematográfica?” (sim/não)
  2) “Aprovo ou ajusta: (luz mais quente / mais close / menos close / mais bokeh / menos bokeh)”

Detalhes técnicos (para garantir que não vai quebrar nada)
- Arquivos envolvidos:
  - `src/assets/invictus-landing-waitlist-media-color-v3d.jpg` (será substituído) ou `v3e.jpg` (novo).
  - `src/components/landing/WaitlistHero.tsx` (somente se precisarmos trocar de v3d para v3e).
- O overlay da logo Invictus continuará intacto (não entra na imagem gerada).
- Mantém fallback existente: se a mídia nova falhar por qualquer motivo, o app cai para a imagem estável antiga (sem travar a tela).

Riscos e mitigação
- Risco: a IA ainda “puxar” para um look ilustrado.
  - Mitigação: usar modelo de maior qualidade + prompt com negativas explícitas +, se necessário, gerar 2–3 variações e escolher a mais realista.
- Risco: cache/HMR não refletir.
  - Mitigação: usar Opção B com `v3e` e troca de import para forçar atualização.

Entrega esperada
- Card da “Lista de espera” com imagem no mesmo padrão da referência (realista, premium, cinematográfica), sem texto inventado, com a logo Invictus overlay perfeita.
