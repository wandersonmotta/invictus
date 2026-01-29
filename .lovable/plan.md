
## Entendimento do pedido
Você quer a sidebar com:
- **efeito glass/vidro mais evidente** (sem ficar “pesado”)
- **textura mármore** bem sutil (grafite + detalhes dourados)
- **contorno/borda dourada sempre ativa** (não é hover), **clarinha** e **um pouco mais presente** (2ª opção que você escolheu), sem atrapalhar leitura/navegação.

Hoje já existe o “mármore sob o vidro” e um highlight no topo em `src/styles/invictus-sidebar.css`, mas falta um contorno dourado “de verdade”, visível e constante.

---

## Causa provável do “contorno não aparece / fica fraco”
No modo `variant="inset"` a estrutura do Sidebar pode aplicar borda/sombra via classes do componente (no `src/components/ui/sidebar.tsx`), e isso compete com o contorno que queremos (ou deixa ele sutil demais). Além disso, no CSS atual o “champagne edge” é muito leve (`0.03`), então ele quase some, principalmente no light.

---

## Mudanças que vou implementar

### 1) Contorno dourado sempre ativo (mais presente, mas clean)
**Arquivo:** `src/styles/invictus-sidebar.css`

No seletor:
- `.invictus-sidebar [data-sidebar="sidebar"] { ... }`

Vou ajustar o `box-shadow` para incluir um “anel dourado” constante, com aparência premium (não neon), composto por camadas:

- **Anel externo** dourado claro (sempre visível)
- **Um segundo anel** ainda mais suave para dar profundidade (sem glow forte)
- **Borda interna** bem leve (metal polish)

Exemplo do tipo de camadas que vou colocar (conceito):
- `0 0 0 1px hsl(var(--gold-hot) / 0.18)` (contorno sempre ativo)
- `0 0 0 2px hsl(var(--gold-soft) / 0.06)` (presença suave)
- `0 0 0 1px hsl(var(--border) / 0.55) inset` (estrutura clean)
- manter o depth shadow existente (sem exagerar)

Também vou criar/ajustar 1 variável para controlar isso por tema (light/dark), algo como:
- `--sidebar-gold-border-opacity`
para deixar o contorno **clarinho no light** e **um pouco mais presente no dark**.

Resultado: contorno dourado ativo, discreto, sofisticado, sem depender de hover.

---

### 2) “Mais vidro” (glass mais evidente) sem poluir
**Arquivo:** `src/styles/invictus-sidebar.css`

No mesmo seletor, vou refinar a sensação de vidro:
- aumentar levemente o `backdrop-filter` (ou adicionar `saturate(...)` bem controlado)
- ajustar a base do gradiente do fundo para ficar um pouco mais “glass” e menos “card sólido”
- manter o mármore bem sutil para não competir com o menu

A ideia é: o usuário sente que é vidro premium, mas a navegação continua limpa.

---

### 3) Evitar competição com bordas do modo “inset”
**Arquivo:** `src/components/ui/sidebar.tsx`

No branch `collapsible === "none"` você já está adicionando, quando `variant === "floating" || "inset"`:
- `"rounded-lg border border-sidebar-border shadow"`

Como agora o contorno dourado vai morar no CSS do `[data-sidebar="sidebar"]`, essa borda padrão pode:
- “achatar” o dourado
- ou deixar o contorno parecendo duplo

Vou ajustar esse trecho para:
- **manter o `rounded-lg` e o `shadow`**
- **remover/neutralizar o `border border-sidebar-border`** (ou trocar por `border-transparent` se a estrutura exigir borda por layout)

Assim o contorno dourado fica limpo e consistente.

---

### 4) Ajuste fino por tema (dark + light)
**Arquivo:** `src/styles/invictus-sidebar.css`

- No light: contorno dourado **mais clarinho e discreto**, sem “amarelar” tudo.
- No dark: contorno dourado **um pouco mais presente** (como você pediu), com o mármore ainda sutil.

Vou manter as “tuning knobs” já existentes e adicionar a do contorno:
- `--sidebar-marble-opacity` (já existe)
- `--sidebar-top-highlight-opacity` (já existe)
- `--sidebar-gold-border-opacity` (novo)

---

## Checklist de validação (rápido)
1) Em `/perfil` (onde você está agora): contorno dourado aparece constante e leve.
2) Navegar `/buscar`, `/mapa`, `/admin`: nada atrapalha leitura/click.
3) Testar em tela menor (mobile): glass continua bonito, sem ruído.
4) Alternar light/dark: contorno permanece “clarinho” no light e “um pouco mais presente” no dark.
5) Verificar que não existe “borda dupla” (padrão inset + contorno dourado).

---

## Arquivos envolvidos
- `src/styles/invictus-sidebar.css` (principal: glass/mármore + contorno dourado ativo)
- `src/components/ui/sidebar.tsx` (ajuste para não competir com borda padrão do inset)

---

## Observação (para manter 100% clean)
Vou evitar:
- hover glow no contorno
- borda grossa demais
- qualquer “neon” dourado

O objetivo é “executivo”: vidro + mármore sutil + filete dourado constante, controlado.