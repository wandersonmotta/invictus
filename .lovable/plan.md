
## O que eu vi no mobile (print do preview)
- No topo (top bar), o texto **FRATERNIDADE** está sendo “cortado/escondido” porque o espaço útil do header fica pequeno quando somamos:
  - Botão do menu (hamburguer)
  - Logo
  - Texto “FRATERNIDADE”
  - Sino + menu do usuário
  - Padding e gaps internos

Você pediu especificamente:
- **Não alterar nada no “FRATERNIDADE”** (efeito dourado/estilo do texto como está).
- A correção deve ser **somente encaixe**, reduzindo o que for necessário na **logo** (e, se preciso, espaçamentos do container), para ficar perfeito do desktop ao mobile.

---

## Ajuste proposto (mínimo e seguro)
### 1) Diminuir mais a logo apenas no mobile
**Arquivo:** `src/components/AppLayout.tsx`  
**Mudança:**
- Trocar a altura da logo no mobile de `h-7` para algo menor (ex.: `h-5` ou `h-6`), mantendo `sm:h-9` no desktop/tablet.
- Exemplo de direção (não é o código final, é a intenção):
  - `className="h-6 sm:h-9 ..."` (ou `h-5 sm:h-9` se ainda faltar espaço)

**Por que isso resolve:**
- A logo é o elemento com maior “peso” visual/largura efetiva.
- Diminuir a logo libera espaço sem mexer no texto “FRATERNIDADE”.

---

### 2) Liberar espaço de layout sem mudar a aparência do texto
**Arquivo:** `src/components/AppLayout.tsx`  
**Mudança:**
- Ajustar o container do texto para ocupar o “resto” do espaço disponível corretamente, sem depender de `max-w` fixo.
- Hoje o `GoldHoverText` tem `truncate max-w-[44vw]`, o que pode estar forçando o corte cedo demais.
- A estratégia será:
  1) Colocar o `GoldHoverText` dentro de um wrapper `div` com `flex-1 min-w-0`
  2) Manter `truncate` (caso o espaço fique realmente impossível), mas remover/afrouxar o `max-w` para ele usar o espaço real sobrando.
  
**Importante:**  
Isso não muda o dourado, nem fonte, nem efeito; só muda “quanto espaço ele pode usar” antes de cortar.

---

### 3) Reduzir micro-espaçamentos apenas no mobile (sem mudar design)
**Arquivo:** `src/components/AppLayout.tsx`  
**Mudança:**
- Reduzir levemente o `gap` do grupo esquerdo no mobile:
  - de `gap-3` para `gap-2` no mobile (mantendo `sm:gap-3` no resto)
- Se necessário, reduzir o padding horizontal do header no mobile:
  - de `px-3` para `px-2` no mobile (mantendo `sm:px-4`)

**Por que isso ajuda:**
- Esses pequenos ajustes somam pixels preciosos no mobile e evitam o “FRATERNIDADE” ficar escondido, sem mexer no estilo do texto.

---

## Como eu vou testar (antes de finalizar)
1) Abrir em viewport mobile (390x844).
2) Confirmar visualmente no header:
   - Logo menor no mobile
   - “FRATERNIDADE” aparecendo inteiro (sem ficar escondido)
   - Sino + UserMenu continuam clicáveis e alinhados
3) Conferir também em:
   - Tablet (768x1024)
   - Desktop (1280+)
4) Validar que não houve mudança de comportamento (apenas encaixe).

---

## Resultado esperado
- No celular: logo um pouco menor e tudo encaixado, com **FRATERNIDADE visível**.
- No desktop: exatamente como está hoje (logo grande e header premium), sem alterações perceptíveis.
