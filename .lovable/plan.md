
Objetivo (o que vai mudar de verdade)
- A sidebar deixar de parecer “um skin genérico” e ganhar uma assinatura Invictus própria, com linguagem visual consistente e repetível (um “padrão”), sem depender de glow exagerado.
- Direção escolhida: Executivo preciso + Title Case + ícones metálicos apenas no ativo + ativo forte / hover discreto.

Diagnóstico do “estranho / genérico” (por que está parecendo IA)
- Hoje o item é basicamente “rounded + glow + barra”: é um padrão comum em muitos templates.
- Falta um “motivo” (motif) repetido que seja só da Invictus (ex.: recorte, friso, placa metálica, microdetalhes).
- Tipografia/ícone não têm hierarquia suficiente (tamanho/spacing/ritmo) e o ativo não cria um “selo” visual memorável.

Resultado visual proposto (assinatura Invictus)
1) Motif exclusivo: “Recorte Invictus” (executivo + robusto)
- Em vez de pill genérico, o item vira uma “placa” com cantos chanfrados (chamfer) via clip-path, e um microfriso interno (specular) que dá cara de metal/vidro.
- A barra dourada vira parte do objeto (um “trilho” embutido) e não só um before colado.

2) Ícone metálico no ativo (de verdade, sem gambiarra de stroke-gradient)
- Criar um “icon plate” (uma plaquinha atrás do ícone) que só aparece no item ativo:
  - Base glass + borda champagne (gradiente dourado) + highlight metálico.
  - O ícone em si fica com cor mais clara e uma sombra sutil, mas o “metálico” vem da placa (fica muito mais premium e controlável).
- Isso cria uma marcação memorável: “ativo = ícone em medalhão/placa”, sem virar heráldico (continua executivo).

3) Tipografia robusta (Title Case com ritmo)
- Aumentar um pouco o tamanho e ajustar o line-height, mas principalmente:
  - Inserir um “subtle tracking” (bem pequeno) e um peso consistente.
  - Ajustar o alinhamento vertical e o espaçamento entre ícone e texto para ficar com cara de produto grande (SaaS premium), não template.

4) Hover discreto, porém “caro”
- Remover sensação de “efeito por efeito”: nada de sweep visível.
- Hover passa a ser:
  - leve lift (quase imperceptível),
  - um micro realce no friso interno (specular),
  - e um aumento mínimo de contraste do texto/ícone.
- Mantém o “executivo preciso” e ainda assim dá feedback.

Mudanças técnicas (arquitetura / como vamos fazer)
A) Ajustes no markup para permitir o “icon plate” e o recorte
Arquivo: src/components/AppSidebar.tsx
- Envolver o ícone em um wrapper dedicado:
  - <span className="invictus-sidebar-iconWrap"><item.icon ... /></span>
  - Isso permite desenhar a plaquinha via CSS (pseudo-elements) sem depender do SVG.
- (Opcional, mas recomendado) Passar tooltip como objeto para podermos aplicar skin no tooltip:
  - tooltip={{ children: item.title, className: "invictus-tooltip" }}
  - Assim, o modo colapsado também fica “Invictus”, não padrão.

B) Reescrever o skin da sidebar com 1 sistema de tokens interno + 1 motif claro
Arquivo: src/styles/invictus-sidebar.css
1) Container: dar “robustez” sem exagero
- Criar um background com:
  - vinheta mais controlada,
  - microtextura (grid/diagonal muito sutil usando gradients) para virar assinatura,
  - e borda interna com “champagne edge” (mais metal, menos glow).
- Garantir performance: nada de animações pesadas; manter blur em um nível só.

2) Item: “Invictus Cut Plate”
- Trocar bordas arredondadas genéricas por recorte:
  - clip-path polygon com cantos chanfrados (e fallback para border-radius normal se necessário).
- Inserir:
  - friso interno (specular line) via ::before em estado normal (quase invisível),
  - e reforço no ativo.

3) Ativo: forte, exclusivo, legível
- Ativo = 3 camadas:
  - (i) cápsula/placa glass com recorte,
  - (ii) trilho/barra dourada embutida (mais “hardware”, menos glow),
  - (iii) icon plate metálico atrás do ícone.
- Controlar brilho: glow mínimo; o “luxo” vem do contraste, recorte e friso.

4) Ícones e letras
- Estado normal:
  - ícone um pouco maior (para “robusto”), opacidade bem calibrada.
  - label com Title Case e melhor proporção.
- Estado ativo:
  - label com cor dourada suave (sem neon),
  - ícone com contraste melhor e drop-shadow mínimo,
  - icon plate entra para dar “assinatura”.

C) Garantias de UX / estados
- Manter:
  - aria-current
  - foco visível (focus-visible ring com dourado)
  - collapsed: texto some, tooltip aparece, ativo continua identificável mesmo só com o ícone e a barra.

Checklist de validação (o que você vai perceber imediatamente)
1) Visual
- A sidebar “assina” o app: recorte + friso + placa do ícone = identidade.
- O item ativo fica memorável sem virar carnaval.
- Nada parece “um template genérico com dourado”.

2) Usabilidade
- Ainda é rápida e legível.
- Em modo colapsado, dá para navegar sem adivinhar (tooltips com skin).

3) Consistência Invictus
- Mesmos tokens gold-soft/gold-hot + glass, mas com forma e detalhes próprios.

Escopo (arquivos que vou editar)
- src/components/AppSidebar.tsx
- src/styles/invictus-sidebar.css
- (Possível ajuste pequeno) src/index.css apenas se eu precisar adicionar uma classe de tooltip no layer components (idealmente fica só no invictus-sidebar.css, como já está importado).

Riscos / mitigação
- clip-path pode variar em alguns browsers: vou manter border-radius como fallback e usar recorte de forma conservadora.
- Excesso de detalhe pode pesar: vou limitar a microtextura a opacidades muito baixas e sem animação.

Entrega em etapas (para você conseguir aprovar pelo “feeling”)
1) Reestruturação do item (wrapper do ícone + base de tipografia).
2) Aplicar “Invictus Cut Plate” (recorte + friso).
3) Ativo forte com trilho dourado embutido + icon plate metálico.
4) Ajustar hover para discreto e premium.
5) Skin do tooltip (se você topar; é rápido e dá acabamento de produto).

Critério de sucesso (objetivo final)
- Você bate o olho e pensa: “isso é Invictus”, não “shadcn com dourado”.
- E principalmente: o ativo/ícone vira um elemento de linguagem visual, não só um efeito.
