

## Correcao definitiva da scrollbar dourada Invictus

### Problema identificado

Existem **dois problemas** impedindo a scrollbar customizada de aparecer:

**1. `@import` em posicao invalida no CSS**

No CSS, declaracoes `@import` DEVEM vir antes de qualquer outra regra CSS. Quando movemos o `@import "./styles/invictus-scrollbar.css"` para DEPOIS do `@tailwind utilities`, o `@tailwind` ja expandiu dezenas de regras CSS. Isso torna o `@import` invalido pela especificacao CSS, e navegadores podem simplesmente ignora-lo -- ou seja, o arquivo da scrollbar nao esta sendo carregado.

**2. `scrollbar-gutter: stable` no `html`**

O `index.css` define `scrollbar-gutter: stable` no `html`, o que reserva espaco para uma scrollbar padrao do sistema. Porem, o app usa layout `h-svh overflow-hidden` no wrapper principal -- o `html` nao faz scroll. Quem faz scroll e o `div` interno com `overflow-y-auto`. Isso pode gerar uma barra cinza fantasma no nivel do `html`.

### Solucao

**Arquivo: `src/main.tsx`** -- importar o CSS da scrollbar diretamente via JS (Vite resolve imports CSS em JS sem problemas de ordem)

- Adicionar `import "./styles/invictus-scrollbar.css"` depois do import de `index.css`

**Arquivo: `src/index.css`** -- duas alteracoes

- Remover a linha `@import "./styles/invictus-scrollbar.css"` (nao sera mais necessaria)
- Remover o bloco `scrollbar-gutter: stable` e o fallback `overflow-y: scroll` do `html`, pois o app usa layout de viewport fixo e nao precisa disso

**Arquivo: `src/styles/invictus-scrollbar.css`** -- sem alteracoes (o CSS ja esta correto com `!important`)

### Detalhes tecnicos

```text
Raiz do problema:
  @import apos @tailwind = @import ignorado pelo navegador
  scrollbar-gutter: stable no html = reserva espaco para scrollbar padrao

Correcao:
  1. Import via main.tsx (JS import, sem restricao de ordem)
  2. Remover scrollbar-gutter do html
  3. CSS da scrollbar permanece inalterado
```

### Teste

Apos as alteracoes, vou abrir o navegador, navegar ate a pagina `/servicos`, rolar a pagina e tirar um screenshot para confirmar que a scrollbar dourada luminosa aparece corretamente.

