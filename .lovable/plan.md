

# Aviso Final -- Destaque Premium de Alto Impacto

## Conceito

Inspirado em marcas de luxo como Rolls-Royce, Audemars Piguet e convites exclusivos de memberships premium (Soho House, Amex Centurion), o "Aviso Final" vai se tornar um **momento cinematografico** na pagina -- um bloco que "quebra" o ritmo visual e forca o visitante a parar e ler.

Referencia: sites de relojoaria de luxo usam um "statement card" isolado com moldura dourada mais intensa, tipografia maior e um efeito de luz que diferencia aquele bloco de todo o resto da pagina. Vamos aplicar essa tecnica aqui.

## O que muda visualmente

1. **Moldura dourada reforçada** -- O card atual usa `invictus-auth-surface invictus-frame` (sutil). Vai passar a usar `invictus-auth-surface invictus-auth-frame`, que e a moldura dourada mais intensa do sistema (borda champagne com glow always-on), a mesma usada na tela de login.

2. **Linhas douradas decorativas** -- Duas linhas horizontais douradas (gradiente 90deg) acima e abaixo do card, animadas com reveal (scaleX de 0 a 1), criando um efeito de "moldura aberta" que emoldura o bloco no espaço.

3. **Titulo com gradiente dourado** -- O "Aviso final" passa de `text-xl font-semibold` branco para um texto com gradiente dourado via `background-clip: text`, maior (`text-2xl sm:text-3xl`) e com tracking mais aberto para sensacao de exclusividade.

4. **Frase final em destaque dourado** -- A ultima frase ("Isso e INVICTUS...") usa o componente `GoldHoverText` com o efeito dourado que segue o mouse, ja existente no projeto.

5. **Animacao de reveal dedicada** -- O bloco inteiro usa `useRevealOnScroll` para aparecer com fade-in + translateY suave, dando peso ao momento.

6. **Eyebrow label** -- Um badge "INVICTUS" discreto acima do titulo (como nas outras secoes), usando o token `--gold-hot` para manter consistencia.

## Detalhes tecnicos

### Arquivo modificado: `src/components/landing/ManifestoSections.tsx`

Apenas a funcao `FinalWarning` sera reescrita:

- Importar `useRevealOnScroll` e `GoldHoverText`
- Adicionar linhas douradas decorativas (divs com gradiente animado)
- Trocar classe do Card de `invictus-frame` para `invictus-auth-frame` (moldura mais intensa)
- Titulo com gradiente dourado via estilo inline (`background-clip: text`)
- Aumentar tipografia do titulo para `text-2xl sm:text-3xl`
- Frase final com `GoldHoverText`
- Padding mais generoso (`p-8 sm:p-10 lg:p-12`)
- Wrap com `useRevealOnScroll` para animacao de entrada

Nenhum arquivo CSS novo. Nenhuma dependencia nova. Apenas reutilizando os tokens e classes premium que ja existem no design system.

