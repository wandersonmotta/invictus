
## Objetivo (o que você quer agora)
1) **Voltar o “efeito por trás” na sidebar**, mas em um padrão **clean + sofisticado** (vidro/mármore com dourado + grafite bem sutil).
2) Corrigir o motivo de “não estar funcionando” (hoje o efeito pode não estar aparecendo por um detalhe estrutural do componente).
3) Aproveitar e remover o warning de **ref**/Tooltip que está vindo do `SidebarMenuButton` (isso também ajuda a estabilizar UI e evita comportamentos estranhos).

---

## Diagnóstico (por que o mármore pode não aparecer)
Seu CSS está mirando especificamente:

- `.invictus-sidebar [data-sidebar="sidebar"]`
- e seus pseudo-elementos `::before` / `::after`

Só que no arquivo `src/components/ui/sidebar.tsx`, quando você usa:
- `collapsible="none"`

o componente `Sidebar` **retorna um `<div>` “direto” sem o wrapper interno com `data-sidebar="sidebar"`**.

Trecho atual (simplificado):
- `if (collapsible === "none") return <div className="...">{children}</div>;`

Ou seja:
- **não existe** nenhum elemento com atributo `data-sidebar="sidebar"` nesse modo,
- então seu CSS do mármore **não encontra alvo**, e o fundo “especial” não aparece.

Isso explica perfeitamente o “não está funcionando”.

---

## Diagnóstico extra (warning de ref no console)
Nos logs do usuário aparece:
- `Warning: Function components cannot be given refs... Check the render method of SidebarMenuButton`

Isso acontece porque `SidebarMenuButton` está envolvendo com Tooltip mesmo quando a sidebar **nunca vai colapsar** (estado não chega a “collapsed”), então o Tooltip acaba sendo “trabalho extra” e pode tentar passar `ref` para algo que não aceita em algum cenário.

Como sua sidebar está fixa e `collapsible="none"`, tooltip nesse caso é dispensável (ou deve ser ativado apenas quando realmente necessário).

---

## O que vou implementar (mudanças)
### 1) Garantir `data-sidebar="sidebar"` também no modo `collapsible="none"` (fix principal)
**Arquivo:** `src/components/ui/sidebar.tsx`

- Ajustar o branch do `collapsible === "none"` para renderizar um container interno com:
  - `data-sidebar="sidebar"`
  - `className` equivalente ao wrapper usado nas outras variantes (onde o CSS já funciona)

Duas opções equivalentes (vou escolher a mais consistente com o resto do componente):
- **Opção A (recomendada):** manter o `<div>` externo como “casca” e criar um `<div data-sidebar="sidebar">` interno que recebe `children`.
- **Opção B:** colocar `data-sidebar="sidebar"` no próprio `<div>` do branch.

Resultado: o CSS do mármore volta a “encaixar” sem mudar seus seletores.

---

### 2) Tornar Tooltip do `SidebarMenuButton` condicional (fix do warning e robustez)
**Arquivo:** `src/components/ui/sidebar.tsx`

No `SidebarMenuButton`, hoje ele sempre faz:
- se `tooltip` existe, ele envolve em `<Tooltip> ... </Tooltip>`, e só esconde o TooltipContent via `hidden=...`.

Vou mudar a lógica para:
- se `state !== "collapsed"` **ou** `isMobile`, **retornar só o botão** (sem Tooltip wrapper).
- Tooltip só existe quando:
  - `state === "collapsed"` e `!isMobile`

Isso elimina o warning de `ref` e deixa o componente mais “à prova de bala”, principalmente agora que a sidebar não colapsa.

---

### 3) Ajuste do `AppSidebar` para não pedir tooltip quando não faz sentido (opcional, mas bom)
**Arquivo:** `src/components/AppSidebar.tsx`

Como `collapsible="none"`, os textos estão sempre visíveis, então tooltip é redundante.
Vou:
- remover `tooltip={item.title}` (ou condicioná-lo, se você quiser manter por algum motivo específico).

Mesmo que a etapa (2) já resolva, isso reduz complexidade.

---

### 4) Refinar o “mármore/vidro” para ficar mais “padrão sofisticado” (sem ficar feio)
**Arquivo:** `src/styles/invictus-sidebar.css`

Seu efeito atual já está muito na direção certa (camadas + `soft-light` + opacidades por tema). O refinamento aqui será mais “tuning” do que reinvenção:

- Garantir que `::before` (top highlight) seja:
  - bem discreto
  - com “cara de vidro” (highlight concentrado e suave)
- Ajustar o `::after` (mármore) para:
  - dourado mais “champagne” (menos saturação percebida via opacidade)
  - veios grafite mais suaves (menos “mancha”)
  - manter `mix-blend-mode: soft-light` (ou testar `overlay` se necessário, mas soft-light costuma ser o mais elegante)
- Calibrar opacidades:
  - Light: mais baixo
  - Dark: um pouco mais presente, mas ainda sutil

Importante: depois que o `data-sidebar="sidebar"` voltar a existir, você provavelmente vai ver que “funciona” imediatamente — aí a gente só lapida o visual.

---

## Arquivos que serão alterados
1) `src/components/ui/sidebar.tsx`
   - Renderizar `data-sidebar="sidebar"` também em `collapsible="none"`.
   - Tooltip do `SidebarMenuButton` só quando `collapsed` e desktop.

2) `src/components/AppSidebar.tsx`
   - Remover/condicionar `tooltip` (para manter clean e evitar wrapper desnecessário).

3) `src/styles/invictus-sidebar.css`
   - Ajustes finos no overlay mármore + highlight topo (mantendo clean + sofisticado).

---

## Critérios de aceite (objetivos)
1) A sidebar volta a ter “algo por trás”:
   - vidro/mármore com dourado + grafite
   - **sutil**, sem “banho dourado”
2) O efeito aparece no **dark e no light** (mais discreto no light).
3) Sem warning de `ref` no console relacionado ao `SidebarMenuButton`.
4) Tudo continua legível (labels/ícones/ativo) e clicável.

---

## Como vamos validar (rápido e prático)
1) Recarregar a página e checar visual na `/` e `/buscar`.
2) Alternar light/dark (mesmo que o app default seja dark) para confirmar o fallback.
3) Confirmar no console:
   - não aparece mais o warning “Function components cannot be given refs… SidebarMenuButton”.
4) Confirmar que o fundo “mármore” realmente está atrás do menu (sem afetar clique/scroll).

---

## Observação importante
O “não está funcionando” aqui é quase certamente por **estrutura HTML diferente** no modo `collapsible="none"` (faltava o `data-sidebar="sidebar"`), não por causa do seu CSS do mármore em si. Depois do fix estrutural, o CSS que você já aprovou deve “entrar” imediatamente.
