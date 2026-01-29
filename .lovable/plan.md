
## Objetivo
Ajustar o “User menu” do top bar (foto + nome + dropdown “Sair”) para ficar **clean, luxuoso e sofisticado**, removendo o amarelo “chapado” e trazendo:
- **Glass premium** no menu e no hover/ativo do trigger
- **Fade/desvanecer** suave no hover (foto + nome)
- **Metálico dourado** no nome ao hover e principalmente quando o menu estiver aberto (click/ativo)
- Item **“Sair”** com estética metálica dourada e hover glass (sem fundo amarelo)

---

## Diagnóstico (por que está “amarelo” hoje)
- O botão do trigger usa `Button variant="ghost"`, cujo estilo padrão é:
  - `hover:bg-accent hover:text-accent-foreground`
- No tema atual, `--accent` é dourado (`--primary`), então ao passar o mouse o botão fica **amarelo**.
- No dropdown, os itens usam `focus:bg-accent`, o que também dá “amarelo” ao navegar/hover/focus.

---

## Ajuste de Design (o que vamos mudar)
### 1) Trigger (foto + nome)
- **Remover o hover amarelo** do `ghost` com overrides no `className`:
  - trocar `hover:bg-accent` por um **glass escuro sutil**, por exemplo:
    - `hover:bg-[hsl(var(--foreground)_/_0.04)]`
    - `hover:text-foreground`
- Criar um efeito “premium” quando:
  - **hover**: leve desvanecer (opacity) e micro brilho
  - **menu aberto** (`data-state="open"`): metálico dourado e moldura sutil (gold frame controlado)

### 2) Nome metálico sem mexer globalmente no GoldHoverText
Hoje o `GoldHoverText` já nasce com aparência dourada. Para ficar mais “clean” e “executivo”:
- Vamos renderizar o nome com **duas camadas**:
  1) Base (sempre): texto neutro (`text-muted-foreground` ou `text-foreground/90`)
  2) Overlay metálico: `GoldHoverText` ou um novo estilo `invictus-metal-text`
- A overlay fica com `opacity-0` e aparece com transição em:
  - `group-hover:opacity-100`
  - `group-data-[state=open]:opacity-100`

Resultado: em repouso fica sofisticado e discreto; no hover/click vira metálico.

### 3) Foto (avatar) com “fade over”
- No hover do conjunto:
  - `group-hover:opacity-85`
  - `group-hover:saturate-125` (leve)
  - opcional: `group-hover:brightness-110`
- No estado aberto:
  - volta para `opacity-100` e ganha um “ring” dourado sutil para indicar ativo.

### 4) Dropdown (glass verdadeiro, sem transparência feia)
- Em vez de `invictus-surface` no menu, usar `invictus-modal-glass` + `invictus-frame`:
  - Isso dá recorte chamfer + vidro + moldura champagne
- Garantir que o menu não fique “see-through”:
  - `invictus-modal-glass` já tem background e blur bons
  - manter `z-50` e acrescentar `shadow` refinada se necessário

### 5) Item “Sair” metálico dourado
- Remover `focus:bg-accent` (amarelo) sobrescrevendo classes do `DropdownMenuItem`:
  - `focus:bg-[hsl(var(--foreground)_/_0.06)]`
  - `focus:text-foreground`
  - `cursor-pointer`
- Aplicar dourado metálico no texto “Sair” e no ícone:
  - texto: `GoldHoverText` (já ok) ou `invictus-metal-text`
  - ícone: `text-[hsl(var(--gold-hot)_/_0.95)]` e hover com leve glow

---

## Implementação (passo a passo)
### Passo A — Criar classes utilitárias “Invictus Topbar”
**Arquivo:** `src/index.css` (em `@layer components`)
Adicionar 2 classes (nomes sugeridos):
1) `.invictus-topbar-user-trigger`
   - glass no hover
   - transição suave
   - ring/control no estado aberto via atributo:
     - `[data-state="open"]` (Radix coloca no Trigger; com `asChild`, cai no `Button`)
2) `.invictus-metal-text`
   - gradient metálico mais “luxo” (linear, não tão “neon”)
   - `background-clip: text; -webkit-text-fill-color: transparent;`
   - um drop-shadow bem sutil para profundidade

(Alternativa: se preferir, podemos fazer tudo só com Tailwind inline no `UserMenu.tsx`; mas a classe CSS deixa o design consistente e fácil de ajustar.)

### Passo B — Ajustar `UserMenu.tsx` (trigger + label + dropdown)
**Arquivo:** `src/components/UserMenu.tsx`
1) Trocar classes do `Button variant="ghost"`:
   - adicionar `group` e overrides:
     - `hover:bg-[hsl(var(--foreground)_/_0.04)]`
     - `hover:text-foreground`
     - `data-[state=open]:bg-[hsl(var(--foreground)_/_0.05)]`
     - `data-[state=open]:ring-1 data-[state=open]:ring-[hsl(var(--gold-hot)_/_0.30)]`
   - adicionar `rounded-full` e padding mais “premium”
2) Avatar:
   - `className="h-8 w-8 transition ... group-hover:opacity-85 ... group-data-[state=open]:opacity-100"`
   - opcional ring no aberto: `group-data-[state=open]:ring-1 ...`
3) Nome:
   - trocar o `GoldHoverText` atual por um wrapper com:
     - base text (clean) + overlay metálico (aparece no hover/open)
   - manter `hidden sm:block` para não quebrar o mobile
4) Dropdown content:
   - mudar `className` para: `invictus-modal-glass invictus-frame z-50 min-w-52 border-border/40`
5) Dropdown item “Sair”:
   - sobrescrever focus/hover para não amarelar:
     - `focus:bg-[hsl(var(--foreground)_/_0.06)]`
     - `hover:bg-[hsl(var(--foreground)_/_0.05)]`
   - `GoldHoverText` no texto, e ícone dourado.

### Passo C — Garantir consistência do dropdown global (se necessário)
Se houver outros dropdowns ficando amarelos por padrão, poderemos:
- ajustar `src/components/ui/dropdown-menu.tsx` para usar um focus background padrão mais neutro
- ou manter alterações só no `UserMenu` (menor risco)

---

## Critérios de aceite (como você valida)
1) No top bar:
   - Em repouso: **sem amarelo chapado**, aparência clean.
   - Hover em foto/nome: elementos **desvanecem** suavemente e o nome ganha “metal”.
   - Clique para abrir: estado **metálico dourado** claro + ring sutil, e permanece até fechar.
2) Dropdown:
   - Fundo glass chamfer + moldura premium.
   - Item “Sair” não fica amarelo; hover/focus fica glass escuro sutil.
   - Texto e ícone “Sair” dourados metálicos.
3) Responsivo:
   - Em mobile, fica só avatar (e menu), sem quebrar layout.

---

## Arquivos que serão alterados
- `src/components/UserMenu.tsx` (principal)
- `src/index.css` (novas classes de estilo premium para top bar)
- (Opcional, só se precisar padronizar tudo) `src/components/ui/dropdown-menu.tsx`

---

## Observação sobre o screenshot (“Perfil”)
O texto “Perfil” aparece quando o usuário ainda não tem `first_name/last_name` preenchidos. Assim que você salvar Nome/Sobrenome no perfil, o label vira o nome completo.
Se quiser, podemos também trocar o fallback de “Perfil” para algo mais premium (ex.: “Minha conta”) e com estilo neutro.

