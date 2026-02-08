

# Upgrade Premium v2 -- Timing, Footer e Refinamentos

## Problemas identificados

### 1. Animacoes disparando cedo demais
O `useRevealOnScroll` usa `rootMargin: "0px 0px -10% 0px"` e `threshold: 0.15` por padrao. Isso significa que o elemento comeca a revelar quando apenas 15% dele esta visivel, com a margem inferior de apenas 10%. Na pratica, o conteudo "aparece" antes do usuario realmente chegar naquela area. O `SectionShell` usa `-18%` e `0.22`, o que e um pouco melhor mas ainda nao e suficiente.

**Correcao**: Aumentar o `rootMargin` inferior para `-25%` a `-30%` e o `threshold` para `0.3` nos componentes principais (`SectionShell`, `EditorialMedia`, `RevealText`). Isso garante que a animacao so dispara quando o elemento esta realmente visivel e centralizado na tela.

### 2. Footer com link "Entrar" desnecessario
O footer tem um link "Entrar" que o usuario quer remover, mantendo apenas o da topbar.

### 3. Oportunidades premium ainda nao exploradas

Analisando referências de sites como Apple, Stripe, Linear e Porsche Design, identifico 5 melhorias que dariam um salto real de qualidade:

**a) Cursor Glow (Spotlight que segue o mouse)**
Um brilho dourado sutil que segue o cursor sobre os paineis/cards. Nao e um circulo obvio -- e uma luz difusa que ilumina a area ao redor do mouse, como se voce estivesse passando uma lanterna por cima de uma superficie metalica. Efeito usado pela Stripe e Linear.

**b) Magnetic Hover nos botoes CTA**
O botao "Quero fazer parte" se move sutilmente na direcao do cursor quando o mouse se aproxima (dentro de ~40px de distancia). Cria sensacao de que o botao "te puxa". Efeito usado por Apple e agencias premium.

**c) Texto com mascara de gradiente no scroll (Gradient Wipe)**
Os titulos principais de cada secao revelam com um gradiente dourado que "varre" da esquerda para a direita, ao inves de um simples fade-up. O texto comeca com cor transparent e a mascara dourada passa revelando as letras. Efeito inspirado em Apple e Linear.

**d) Scroll Progress Indicator**
Uma linha dourada fina no topo da pagina que cresce conforme o usuario desce, mostrando o progresso. Sutil, elegante, e reforça a identidade gold.

**e) Footer com animacao de entrada propria**
O footer ganha um reveal mais ceremonioso: a linha dourada "acende" de ponta a ponta, depois o conteudo aparece com fade. Sem o link "Entrar".

## Detalhes tecnicos

### Arquivos que serao CRIADOS
- `src/hooks/useCursorGlow.ts` -- Hook que rastreia o mouse e aplica uma variavel CSS com a posicao do cursor em elementos, criando o efeito de spotlight
- `src/hooks/useMagneticHover.ts` -- Hook que aplica deslocamento magnetico (translateX/Y) em um elemento quando o cursor se aproxima
- `src/components/landing/ScrollProgress.tsx` -- Barra fina dourada no topo que mostra progresso do scroll

### Arquivos que serao MODIFICADOS
- `src/components/landing/SectionShell.tsx` -- Aumentar threshold/rootMargin do reveal para disparar mais tarde; integrar cursor glow no painel
- `src/components/landing/EditorialMedia.tsx` -- Aumentar threshold/rootMargin
- `src/components/landing/RevealText.tsx` -- Aumentar threshold/rootMargin
- `src/components/landing/ManifestoSections.tsx` -- Aplicar gradient wipe nos titulos principais
- `src/components/landing/WaitlistHero.tsx` -- Aplicar magnetic hover no CTA "Quero fazer parte"
- `src/components/landing/LandingFooter.tsx` -- Remover link "Entrar"; adicionar reveal animado proprio
- `src/pages/Landing.tsx` -- Integrar ScrollProgress
- `src/styles/invictus-auth.css` -- Novos keyframes (gradient-wipe, cursor-glow radial)

### Performance
- Cursor glow usa CSS custom properties (`--mx`, `--my`) atualizadas via `mousemove` com rAF -- zero repaints extras, apenas repaint do radial-gradient via GPU
- Magnetic hover usa transform (GPU) e so ativa em `(hover: hover) and (pointer: fine)`
- Gradient wipe e CSS puro com `background-clip: text` e animacao de `background-position`
- Scroll progress usa `scrollY / scrollHeight` com rAF, atualiza uma unica variavel CSS
- Todos desabilitados com `prefers-reduced-motion`
- Todos desabilitados no mobile (touch)

### Sem dependencias externas
Tudo com CSS + hooks React nativos.

### Ordem de implementacao
1. Corrigir timing dos reveals (impacto imediato na experiencia)
2. Remover "Entrar" do footer
3. Scroll progress indicator
4. Cursor glow nos paineis
5. Gradient wipe nos titulos
6. Magnetic hover no CTA
7. Footer com reveal proprio

