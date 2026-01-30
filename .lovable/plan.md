
Contexto (o que você pediu agora)
- Você quer que a identidade visual da landing (background + mídias “tipo gif”) represente homens e mulheres (equilíbrio), em cenas reais de negócios/networking, mantendo o padrão Invictus: cinematográfico, preto e branco, premium, com “toque” dourado discreto.
- Você escolheu:
  - Mídias em loop: Trocar por imagens (não usar vídeo/gif)
  - Estilo do background: Evento/Networking
  - Diversidade: Equilibrado

Diagnóstico rápido do estado atual
- Background da landing hoje depende do componente `LandingBackground` que renderiza um `<picture>` com:
  - `/images/invictus-landing-bg-1920x1080.jpg` (desktop)
  - `/images/invictus-landing-bg-1536x1920.jpg` (mobile)
- As “mídias tipo gif” na landing hoje são vídeos MP4 via `LoopVideo` em:
  - `src/components/landing/ManifestoSections.tsx` (manifesto)
  - `src/components/landing/WaitlistHero.tsx` (waitlist)
- Como você quer trocar por imagens, vamos substituir esses vídeos por imagens estáticas com o mesmo enquadramento/“moldura premium”, mantendo a estética e performance.

Objetivo de implementação (resultado esperado)
1) Background novo (desktop + mobile) com pessoas (homens e mulheres) em ambiente de networking/negócios, P&B cinematográfico, com luz/contraste premium.
2) Substituir os “loops” (vídeos) por imagens editoriais no mesmo padrão (homens e mulheres).
3) Garantir consistência: mesma “família visual” entre desktop e mobile (não parecer duas fotos aleatórias).
4) Garantir que o background apareça sempre (sem regressão do bug de “não aparece”).

Parte A — Gerar os novos assets (IA) no padrão Invictus
A1) Gerar 2 imagens de background (uma pensada para desktop e outra para mobile)
- Desktop (16:9): 3840x2160 (master), depois exportar/otimizar para 1920x1080.
- Mobile (4:5 ou 3:4 com leitura vertical): master em alta (ex.: 3072x4096 ou equivalente), depois exportar/otimizar para 1536x1920.

Prompt base (direção criativa)
- “Cinematic black and white corporate networking event, well-dressed men and women (balanced presence), candid business conversation, subtle luxury atmosphere, shallow depth of field, high contrast, film grain subtle, no text, no logos, no watermarks, editorial photography, premium lighting, Invictus vibe”
Regras:
- Sem texto/logos/marcas/d’água.
- Rosto/pele com aparência realista (evitar uncanny).
- “Equilibrado” = mulheres e homens com presença equivalente.

A2) Gerar 2 imagens “editoriais” para substituir os vídeos (Manifesto e Waitlist)
- Uma imagem para o bloco do Manifesto (16:9).
- Uma imagem para o bloco da Waitlist (16:9).
Mesma linguagem visual (P&B, premium, negócios, mix de gêneros).

A3) Export e otimização
- Salvar como JPG de alta qualidade (ou WEBP se já estiver ok no projeto; se houver dúvidas, manter JPG para compatibilidade máxima).
- Manter nomes previsíveis e versionados para evitar cache agressivo.
  - Sugestão: `invictus-landing-bg-1920x1080-v2.jpg`, `invictus-landing-bg-1536x1920-v2.jpg`
  - E as imagens dos blocos: `invictus-landing-manifesto-media-v1.jpg`, `invictus-landing-waitlist-media-v1.jpg`

Parte B — Integrar os novos backgrounds no app (sem quebrar o fallback)
B1) Atualizar `LandingBackground.tsx`
- Trocar `srcSet/src` para apontar para os novos arquivos “v2”.
- Manter o `<picture>` e o layer fixo (é o fallback mais robusto para mobile).

B2) Garantir que o CSS da landing não “anule” o background
- Revisar `src/styles/invictus-auth.css` para garantir que:
  - `.invictus-landing-page` não esteja com background sólido/overlay que cubra completamente.
  - o z-index do `LandingBackground` (-z-10) esteja efetivamente atrás e não “sumindo” por stacking context inesperado.
- Se necessário, ajustar:
  - `main.invictus-landing-page { position: relative; }`
  - garantir `isolation/isolate` apenas onde não mate o layer fixo.

B3) Diagnóstico rápido no browser (para fechar o bug “não aparece”)
- Confirmar no Network que os arquivos `...-v2.jpg` retornam 200.
- Confirmar no DOM que `LandingBackground` está renderizando e ocupando `fixed inset-0`.
- Se o problema for cache, o “-v2” resolve sem precisar pedir hard refresh.

Parte C — Trocar os “gifs”/loops (vídeos) por imagens premium (homens e mulheres)
C1) Criar um componente simples e consistente (ex.: `EditorialMedia`)
- Responsável por renderizar a imagem com:
  - `AspectRatio 16/9`
  - borda e glass (igual ao que já existia para o vídeo)
  - `loading="lazy"` (exceto se você quiser carregar “eager” no primeiro bloco acima da dobra)

C2) Alterar `ManifestoSections.tsx`
- Substituir `<LoopVideo ... />` por `<img ... />` (via `EditorialMedia`).
- Mantém o layout/spacing e a mesma “moldura”.

C3) Alterar `WaitlistHero.tsx`
- Substituir o `<LoopVideo ... />` por imagem editorial correspondente.
- Mantém o comportamento responsivo (o bloco já está bem dimensionado).

Parte D — QA (checagens obrigatórias antes de você validar)
D1) Visual
- Desktop: background com cena de networking + mix de gêneros visível.
- Mobile: background vertical nítido, sem “estourar” e sem recorte ruim (rosto cortado, etc.).
- Imagens editoriais substituindo os vídeos: consistência total com o background.

D2) Performance
- Sem vídeos = melhora de performance e menos consumo de dados no mobile.
- Garantir que as imagens dos blocos sejam comprimidas e razoáveis em KB/MB.

D3) Acessibilidade
- Background: `aria-hidden` já ok.
- Imagens editoriais: se forem decorativas, `alt=""`. Se tiverem função semântica (provável que não), usar alt descritivo.

Arquivos que serão modificados (escopo)
- `public/images/` (substituir/adicionar novas imagens)
- `src/components/landing/LandingBackground.tsx` (apontar para v2)
- `src/components/landing/ManifestoSections.tsx` (trocar LoopVideo por imagem)
- `src/components/landing/WaitlistHero.tsx` (trocar LoopVideo por imagem)
- (Opcional) criar `src/components/landing/EditorialMedia.tsx` para padronizar o “frame premium” de mídia

Dependências / limitações importantes
- Eu consigo gerar imagens cinematográficas de alta qualidade via IA.
- Eu não gero MP4/gif “real” com pessoas via IA dentro do fluxo atual; como você escolheu “Trocar por imagens”, isso fica resolvido e ainda melhora performance.

Entrega em 2 checkpoints (para você aprovar rápido)
1) Checkpoint 1: Novos backgrounds (desktop + mobile) aplicados na landing e aparecendo 100%.
2) Checkpoint 2: Troca dos “gifs” (vídeos) por imagens editoriais, com mix de gêneros e padrão Invictus.

Critério de sucesso (bem direto)
- Ao abrir “/” no celular e no desktop: fundo aparece sempre e remete claramente a negócios/networking com homens e mulheres.
- Nenhuma seção perde legibilidade.
- Visual fica premium (cinematográfico P&B) e consistente em toda a landing.
