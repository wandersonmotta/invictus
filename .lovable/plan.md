
Objetivo
- Tirar a sensação de “PowerPoint/slide” da landing mantendo: fotos, background e estrutura atual.
- Aumentar a percepção “premium Invictus” principalmente nos “quadrados” (painéis), tipografia e CTAs (botões).
- Fazer isso sem mexer no conteúdo (copy), só na apresentação/skin.

O que está acontecendo hoje (por que parece PPT)
- Quase tudo entra dentro de um único componente visual: `.invictus-landing-panel` (um “retângulo” grande por seção).
- Os cards internos (pilares, grupos, etc.) usam borda + fundo translúcido muito “genérico de UI”, e os ícones entram “soltos” (parece template).
- Falta uma assinatura visual consistente para:
  1) títulos de seção
  2) separadores
  3) “metal plates” dos ícones
  4) CTA com acabamento (polish) e presença

Direção aprovada por você
- Estilo dos painéis: Refinar painéis atuais
- Tipografia: Assinatura Invictus
- Detalhes premium: Separadores dourados + Grain sutil + Ícones metálicos + CTAs premium

Plano de implementação (passo a passo)

1) Criar “skin” premium para os painéis da landing (sem virar neon)
Arquivos: `src/styles/invictus-auth.css` (é onde já vivem as regras da landing)
- Evoluir `.invictus-landing-panel` para parecer “vidro real + moldura champagne”:
  - Moldura mais “real” via pseudo-elemento `::after` com gradient champagne (mesma técnica do `.invictus-auth-frame`, porém mais sutil para não ficar “cartão de crédito dourado”).
  - Highlights internos (specular) via `::before` para vender vidro e tirar “cara de caixa”.
  - Grain sutil dentro do painel (bem leve), separado do grain geral da página, para quebrar o aspecto liso “de slide”.
  - Ajustar sombras: menos “box-shadow de template”, mais “profundidade controlada”.

Resultado esperado: os “quadrados” continuam existindo, mas parecem uma peça premium (vidro + metal) e não um card genérico.

2) Dar assinatura Invictus ao cabeçalho de cada seção (título + separador)
Arquivo: `src/components/landing/SectionShell.tsx` + `src/styles/invictus-auth.css`
- Atualizar `SectionShell` para renderizar:
  - Um “eyebrow” opcional (ex.: “INVICTUS / Manifesto / Pilares”) com small caps + tracking (assinatura).
  - Um separador dourado minimalista (linha em gradiente, no mesmo espírito do header do app).
  - Título com classe específica (ex.: `.invictus-landing-title`) para:
    - melhor tracking
    - contraste
    - espaçamento e largura de leitura
- Importante: manter compatível com todas as seções atuais (sem obrigar a passar novos props). A versão mínima pode usar um eyebrow fixo “INVICTUS” ou derivado do próprio título.

Resultado esperado: a landing ganha “editorial structure” sem mudar o layout.

3) Transformar os cards internos (Pilares / O que encontra aqui) em “cards premium” com ícone metálico
Arquivo: `src/components/landing/ManifestoSections.tsx` + `src/styles/invictus-auth.css`
- Criar classes utilitárias específicas da landing, por exemplo:
  - `.invictus-landing-card` (fundo + borda + brilho interno)
  - `.invictus-icon-plate` (plate metálico para ícones)
- Trocar os wrappers atuais dos itens (ex.: `rounded-xl border ... bg-background/25`) para usar essas classes (mantendo o mesmo grid e spacing).
- Ícones:
  - Em vez do ícone dentro de um quadradinho “neutro”, usar uma “plate” metálica com:
    - gradiente discreto (foreground + gold)
    - contorno fino
    - highlight interno
    - leve glow controlado (bem menos que auth-frame)
- Opcional (se ficar bom): um “micro-separador” dentro do card (linha dourada sutil) para dar acabamento.

Resultado esperado: os elementos que hoje parecem “cards de apresentação” viram peças com identidade e acabamento.

4) CTAs premium (principalmente “Quero fazer parte” e botões do topo)
Arquivo: `src/components/landing/WaitlistHero.tsx` + `src/components/ui/button.tsx` (ou classes CSS específicas de landing para não impactar o app todo)
- Manter o componente Button (não inventar outro).
- Abordagem segura para não afetar o app inteiro:
  - Criar um className específico para CTAs da landing (ex.: `.invictus-cta`) aplicado somente na landing.
  - Esse CTA terá:
    - “ring” dourado mais sofisticado (gradient fino)
    - highlight/specular no topo
    - hover com “polish” (aumenta contraste + micro glow, sem jump)
    - estado disabled bem resolvido
- Aplicar essa classe no botão “Quero fazer parte” e no botão de submit do modal da waitlist.

Resultado esperado: o CTA parece “joia” (premium), não botão padrão.

5) Ajustes finos de leitura para tirar “cara de slide”
Arquivos: `src/components/landing/ManifestoSections.tsx` + `src/styles/invictus-auth.css`
- Ajustar largura de texto (line-length) e ritmo:
  - limitar parágrafos longos a uma largura mais “editorial”
  - aumentar um pouco o leading do manifesto
- Aumentar contraste de “muted text” dentro do painel (muito sutil) para parecer mais caro e menos “cinza chapado”.

Checklist de validação (antes de você mostrar pro sócio)
- Desktop:
  - As seções têm um cabeçalho com assinatura + separador dourado sutil
  - Painéis não parecem “caixas”; parecem vidro/metal
  - Ícones em plates metálicos, consistentes entre si
  - CTA “Quero fazer parte” parece premium e chama atenção sem berrar
- Mobile:
  - Nada fica pesado demais (blur/grain controlados)
  - Textos continuam muito legíveis
  - Cards não viram “poluição visual”
- Consistência:
  - Não alterar estilo global do app interno (somente landing)

Arquivos que provavelmente serão alterados
- `src/styles/invictus-auth.css` (novas classes + refinamentos do painel/títulos/cards/cta)
- `src/components/landing/SectionShell.tsx` (estrutura do header da seção)
- `src/components/landing/ManifestoSections.tsx` (trocar classes dos cards e plates de ícone)
- `src/components/landing/WaitlistHero.tsx` (aplicar CTA premium e pequenos ajustes visuais)

Riscos e como vou evitar
- “Ficar dourado demais / parecer template de luxo genérico”
  - Vou usar dourado como acento de precisão (linhas/plates), mantendo grafite como base.
- Performance no mobile (blur/grain pesado)
  - Grain leve, e blur já existente (só ajustar com parcimônia); respeitar prefers-reduced-motion.
- Quebrar consistência com o resto do app
  - Todas as classes novas serão prefixadas e usadas só na landing.

Entrega incremental (para facilitar aprovação do seu sócio)
- Primeiro entrego: painel + cabeçalho de seção (impacto imediato).
- Depois: cards internos + ícones metálicos.
- Por último: CTAs premium (finaliza a sensação “produto caro”).

