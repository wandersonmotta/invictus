
Objetivo (próximo nível, do jeito que você descreveu)
- Fazer a landing ficar “premium de verdade”: mais clean, mais sofisticada, com hierarquia visual forte (quem entra sente exclusividade).
- Corrigir a qualidade ruim do background no mobile: trocar por uma imagem nova em alta resolução (4K) gerada por IA, com versões otimizadas.
- Parar o “mexer ruim” do fundo ao rolar: fundo 100% estático (sem parallax/attachment fixed).
- Dar impacto com animação: os painéis/“quadrados” entram conforme a pessoa desce, e os itens internos entram em sequência (stagger), sem poluir.
- Manter performance boa no mobile.

O que eu vi no código (pontos que explicam o problema)
1) O fundo da landing está em CSS como background-image (invictus-landing-page) e, em telas >= 768px, existe:
   - background-attachment: fixed (isso cria o “parallax”/efeito de deslocamento no scroll).
   Mesmo que seja “sutil”, em alguns devices fica com sensação “ruim”/bugada.

2) O fundo atual usa um único arquivo: /images/invictus-landing-bg.jpg
   - Quando o arquivo não é grande/otimizado para retina/mobile moderno, a imagem “estoura”/pixeliza, principalmente em telas altas (mobile) e com scaling.

3) As animações de entrada já existem via useRevealOnScroll (IntersectionObserver) aplicado no SectionShell:
   - Hoje: a seção entra toda de uma vez.
   - Você pediu: seção + stagger interno (itens entram em sequência para dar impacto editorial).

Decisões aprovadas (pela sua última resposta)
- Background: estático + overlay animado (sutil)
- Conteúdo animado: seção + stagger interno
- Imagem 4K: gerar nova (IA)

Plano de implementação (passo a passo)

Parte A — Background 4K (novo), responsivo e “parado”
A1) Gerar um novo background 4K com IA (visual executivo/corporativo)
- Vou gerar 1 imagem principal com “cara de Invictus”:
  - Preto e branco cinematográfico (arquitetura corporativa, pessoas de terno/negócios, editorial)
  - Detalhes dourados discretos (nada chamativo)
  - Sem texto, sem elementos óbvios “de banco de imagem”
- Entregável: 1 arte “hero background” que funciona bem em desktop e mobile (composição pensada para corte vertical também).

A2) Criar versões otimizadas (sem perder qualidade)
- A partir da imagem master, vou criar variações de tamanho (mesmo visual, só resolução diferente):
  - 3840px (4K) para desktop grande
  - 2560px para desktop normal/retina
  - 1440px para tablet
  - 1080px para mobile (ainda alta qualidade)
  - (Opcional) versões .webp se estiver ok para o projeto; caso contrário, JPG alta qualidade bem comprimido
- Isso reduz peso e melhora carregamento no mobile.

A3) Trocar o CSS para usar image-set (resolução certa por device)
- Atualizar .invictus-landing-page para usar image-set() no background:
  - o navegador escolhe automaticamente a imagem mais adequada (ex.: 1x/2x, ou por tamanho).
- Ajustar:
  - background-position pensado para manter rosto/área principal do fundo em foco no mobile.
  - background-size: cover (mantém o impacto)
  - background-attachment: scroll (sempre) para ficar totalmente estático.
- Remover/alterar o @media(min-width:768px) que hoje aplica “fixed”.

Critério de sucesso dessa parte
- No celular, a imagem fica nítida (sem “lavar”, sem pixel).
- Rolou a página: o fundo não “mexe”/não dá sensação de bug.

Parte B — Overlay animado “luxo” (sem mexer a foto)
B1) Criar um overlay sutil por cima do background (sem parallax)
- Vamos manter a imagem parada e colocar um pseudo-elemento por cima (ex.: ::before) na .invictus-landing-page com:
  - film grain / noise bem sutil (ou uma textura via gradiente)
  - vignette suave
  - leve variação de opacidade/posição (animação lenta, quase imperceptível)
- Objetivo: dar vida premium sem “mexer a imagem” e sem tirar legibilidade.

B2) Garantir acessibilidade e performance
- Respeitar prefers-reduced-motion: se o usuário preferir reduzir movimento, o overlay fica estático (sem animation).
- Animação lenta (ex.: 10–16s) e apenas em opacity/transform leve, para não travar mobile.

Critério de sucesso dessa parte
- Sensação de “cinema”/editorial, mas sem distração.
- Não piorar o tempo de carregamento nem o scroll.

Parte C — Animação de entrada com stagger interno (impacto editorial)
C1) Manter a animação da seção (já existe) e acrescentar o stagger dos itens dentro
- Hoje o SectionShell aplica reveal.className na <section>.
- Vou evoluir para:
  1) Seção anima (fade/slide) como base.
  2) Elementos internos marcados (ex.: cards, bullets, colunas) entram em sequência com delays leves.

C2) Como implementar o stagger sem bagunçar o layout
Opção escolhida: classe utilitária de stagger que funciona “por seção”
- Criar uma classe CSS do tipo:
  - .invictus-stagger > * { animation-delay: var(...) } com nth-child
- Aplicar .invictus-stagger apenas nos containers certos (grid de pilares, grupos, listas) para não animar “tudo indiscriminadamente”.
- Aplicar apenas quando a seção já estiver “visible” no hook.

C3) Onde aplicar para dar o efeito que você quer (“vai aparecendo os quadrados”)
- Cada SectionShell:
  - O painel “entra” primeiro.
  - Em seguida, dentro do painel, os blocos entram (colunas/cards/bullets).
- Locais ideais:
  - Pillars (os 4 cards entram em sequência)
  - WhatYouFindHere (3 grupos entram em sequência; e dentro de cada grupo, os 2 itens podem ter micro-delay)
  - WhoIsFor (2 colunas entram; e os bullets podem entrar com delay curto)
  - FinalWarning (card entra e textos internos entram em sequência leve)

Critério de sucesso dessa parte
- Ao rolar, a página “ganha vida” e parece uma apresentação editorial.
- Sem exagero e sem “poluição”.

Parte D — Hierarquia tipográfica “premium”: subtítulos e destaques
Você comentou que vários pontos não estão destacando como deveriam (ex.: “Você pertence se”).
Eu vou padronizar por seção (subtítulos), como você aprovou.

D1) Padronizar subtítulos (H3) para sempre “parecer importante”
- Criar um estilo consistente para subtítulos dentro das seções da landing:
  - fonte um pouco maior
  - negrito
  - tracking leve (executivo)
  - e, quando fizer sentido, uma “linha dourada” discreta ou ícone pequeno (sem infantilizar)

Exemplos de alvos diretos no ManifestoSections.tsx (já existem):
- “Nossa visão”
- “Você pertence se”
- “Não é para quem”
- “Liderança”
- “Regra de permanência”

D2) Ajustar contraste e legibilidade (sem deixar “cinza demais”)
- Reduzir uso de muted-foreground em blocos longos quando necessário (manter para descrições curtas).
- Garantir que frases-chave usem text-foreground/90 ou text-foreground.

Critério de sucesso dessa parte
- Subtítulos saltam aos olhos e guiam a leitura.
- A landing fica “cara de produto caro” (hierarquia clara, sem excesso).

Parte E — Revisão visual estratégica (posicionamento de mídia e “clean premium”)
E1) Reposicionar o vídeo (se mantivermos) para ser “estratégico” e não competir com o texto
- No screenshot atual, o vídeo está na coluna “Nossa visão” e chama atenção, mas pode parecer “bloco a mais” em vez de um detalhe editorial.
- Ajuste pro próximo nível:
  - tratar vídeo como “insert editorial”: menor que um card, com moldura mais fina, e alinhado de forma a apoiar o texto, não dominar.
  - no mobile: vídeo menor, acima de um trecho-chave (não entre parágrafos demais).

E2) Ajustar padding/ritmo dos painéis para “respirar”
- Manter painéis premium, mas com:
  - menos elementos competindo (linhas divisórias só onde precisa)
  - espaçamento mais consistente entre blocos

Arquivos que serão alterados/criados (escopo)
1) CSS
- src/styles/invictus-auth.css
  - Trocar o background da landing para image-set com imagens novas
  - Remover background-attachment: fixed da landing
  - Adicionar overlay animado no background (pseudo-elemento + keyframes)
  - Adicionar utilitários de stagger (classes)

2) Landing components
- src/components/landing/ManifestoSections.tsx
  - Aplicar “stagger interno” nos grids e listas
  - Padronizar subtítulos (H3) com classe/estilo consistente
  - Ajustar posicionamento do vídeo para ficar editorial/estratégico

- src/components/landing/WaitlistHero.tsx
  - Ajustar posicionamento do vídeo para ficar estratégico e premium (mobile menor, desktop equilibrado)
  - Garantir que o CTA continue sendo o foco

3) Assets
- public/images/
  - Adicionar a nova imagem 4K e variações otimizadas (múltiplos tamanhos)
  - (Opcional) adicionar uma versão poster/thumbnail para fallback

Checklist de validação (QA)
1) Mobile (principal)
- Fundo nítido (sem pixel) e sem “mexer” ao rolar.
- Conteúdo aparece com impacto (seção + stagger), mas sem travar.
- Vídeos aparecem menores no mobile e não “comem” a tela.

2) Desktop
- Fundo continua premium e estático.
- Overlay animado é perceptível só como “vida”, não como efeito chamativo.
- Layout respira: leitura fácil, hierarquia forte.

3) Acessibilidade / preferências
- prefers-reduced-motion: sem animações (ou mínimo necessário).
- Texto sempre legível sobre o background.

4) Regressão
- Modal da lista de espera continua perfeito (abrir/fechar, envio).
- Rotas /auth e /reset-password continuam com identidade própria (sem afetar).

Entregas em etapas (para você aprovar visual rápido)
- Etapa 1: Novo background 4K + image-set + remover “mexer ruim”
- Etapa 2: Overlay animado sutil (film grain/vignette)
- Etapa 3: Seção + stagger interno (impacto ao rolar)
- Etapa 4: Ajuste fino de posicionamento da mídia + tipografia (subtítulos com presença)

Observação importante (para ficar realmente “nível produto caro”)
O maior salto de percepção de valor aqui vai vir de:
1) Background 4K bem escolhido (composição certa para mobile)
2) Fundo parado + overlay “cinema”
3) Ritmo editorial (stagger + subtítulos fortes)
Isso cria aquela sensação imediata: “tem direção, tem curadoria, é seleto”.
