
## O que eu entendi (com base no seu print + sua explicação)
Você quer um visual mais “vidro/transparente sofisticado” na sidebar (inclusive na área do contorno), e:
1) **contorno dourado**: mais claro (“champagne”), **bem fino** e **visível** (clean, sem grosseria).
2) **fundo da sidebar**: mais translúcido (parecendo vidro real, não “card” opaco).
3) **item ativo**: destaque “premium” no estilo **capsule glass** (sem ficar pesado, mas chamando atenção).

No print atual, o dourado quase não aparece porque o contorno está sendo feito só com `box-shadow inset` muito sutil e ele “some” no conjunto (vidro + fundo escuro + borda interna do próprio componente). A solução mais confiável e “premium” é usar **borda por pseudo-elemento com máscara (gradient border)** — igual ao que já existe na base do projeto em `.invictus-auth-frame::after` no `src/index.css`. Isso dá um contorno fininho e sempre visível, sem precisar engrossar.

---

## Mudanças que vou implementar

### 1) Contorno dourado “champagne”, fino e visível (sem grosso)
**Arquivo:** `src/styles/invictus-sidebar.css`

- Manter um `box-shadow` bem leve para profundidade (sem depender dele para “ser o contorno”).
- Criar **um contorno real** via `::after` com:
  - `padding: 1px;` (borda fina e clean)
  - `background: linear-gradient(...)` (champagne: gold-soft/gold-hot bem controlados)
  - máscara para “cortar o centro” (`-webkit-mask` / `mask-composite: exclude`), deixando só o aro.
- Esse contorno fica **sempre ativo**, com opacidade ajustada para ficar **mais claro** (menos amarelo/forte) e ainda **visível**.

Também vou criar “knobs” (variáveis) específicos para o contorno:
- `--sidebar-frame-opacity` (opacidade geral do aro)
- `--sidebar-frame-soft` / `--sidebar-frame-hot` (força do gradiente)

E ajustar separadamente para `.dark` (ligeiramente mais presente, mas ainda “champagne”).

---

### 2) Fundo mais translúcido (vidro real) e mais sofisticado
**Arquivo:** `src/styles/invictus-sidebar.css`

Hoje o fundo usa `--card` (que, no dark, é mais “sólido”). Para ficar vidro de verdade:
- Trocar o gradiente base de `--card` para **`--background` com alpha baixo** (mais transparente).
- Exemplo de direção estética (conceito):
  - topo: `hsl(var(--background) / 0.18~0.24)`
  - base: `hsl(var(--background) / 0.10~0.14)`
- Manter `backdrop-filter` com blur/saturate, mas calibrar para não “leitoso”.
- Deixar o mármore mais “de luxo”: reduzir um pouco contraste do grafite e manter brilho bem controlado (sem competir com o texto).

Resultado esperado: dá para “sentir” o fundo por trás, sem perder legibilidade.

---

### 3) Item ativo com “capsule glass” (premium) + contorno fino dourado
**Arquivo:** `src/styles/invictus-sidebar.css`

Hoje o ativo tem:
- leve fundo e uma barrinha dourada à esquerda.

Vou evoluir para “capsule glass”:
- No `.invictus-sidebar-item[data-active="true"]`:
  - aplicar um **fundo glass** (mais translúcido que o hover)
  - adicionar **um aro fininho** (também via pseudo-elemento com máscara, ou via inset suave)
- Manter a barrinha esquerda, mas mais elegante (menos “marcador”, mais “filete”).
- Ajustar ícone + texto:
  - texto um pouco mais claro
  - ícone com contraste maior
  - sem neon, sem brilho exagerado

Importante: vou reorganizar os pseudo-elementos para não conflitar:
- Usar o `::after` do item para o **aro** (border premium)
- Mover a barrinha para um `::before` no `.invictus-sidebar-link` (porque o link já existe e é estável), evitando “briga” de pseudo-elementos.

---

### 4) Garantir que o contorno não seja “comido” pelo layout
**Arquivo:** `src/components/ui/sidebar.tsx`

Você já tem `p-2` no wrapper quando `collapsible="none"` e `variant="inset"`/`"floating"` (isso ajuda o contorno a “respirar”).
Vou apenas **confirmar/ajustar** se:
- o `rounded-lg` está sendo aplicado no elemento certo (o `[data-sidebar="sidebar"]` interno)
- não há nenhuma borda do próprio componente voltando a competir (principalmente em outros branches/variants)

---

## Como vou validar (com print no preview)
1) Abrir `/buscar` e conferir:
   - aro dourado aparece claramente, mas fino (1px) e claro (champagne)
   - vidro mais translúcido (dá para perceber o background do app por trás)
2) Trocar rota (/perfil, /mapa, /admin) e verificar consistência.
3) Verificar o item ativo:
   - “capsule glass” visível e sofisticado
   - sem perder legibilidade
4) Checar responsivo: o efeito não pode ficar “sujo” no mobile.

---

## Arquivos envolvidos
- `src/styles/invictus-sidebar.css` (principal: vidro + contorno + ativo capsule)
- `src/components/ui/sidebar.tsx` (ajuste fino estrutural, se necessário, para garantir que o contorno sempre renderize)

---

## Observações de estilo (para ficar exatamente como você pediu)
- Contorno: **mais claro**, **mais fino**, **sempre ativo**, sem hover-glow.
- Fundo: mais “transparentão”/vidro real, sem parecer “card sólido”.
- Ativo: “capsule glass” com contorno dourado fininho (chama atenção com elegância).
