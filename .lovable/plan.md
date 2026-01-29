
## Objetivo (do jeito que você pediu)
1) **Remover completamente a opção de abrir/fechar a lateral** (sem botão, sem atalho de teclado, sem “mini-collapsed”).  
2) **Diminuir a largura** da sidebar para ~**240px** (desktop), com segurança para telas menores.  
3) **Deixar o visual mais clean**, removendo o “dourado no glaze” e ficando com **fundo grafite/glass neutro** + **borda champagne sutil**.  
4) **No mobile**, a sidebar também fica **fixa** (não drawer).

---

## O que existe hoje (diagnóstico rápido)
- `AppLayout.tsx` tem um `SidebarTrigger` no header (botão de abrir/fechar).
- `SidebarProvider` (em `src/components/ui/sidebar.tsx`) adiciona:
  - **atalho Ctrl/Cmd+B** para toggle
  - **cookie** para lembrar estado
- `AppSidebar.tsx` está usando `collapsible="icon"` e muda de `w-64` para `w-14` via `useSidebar()` (expanded/collapsed).
- `invictus-sidebar.css` ainda tem **radial gradients dourados** no background do container (`gold-soft`, `gold-hot`) — isso é o “glaze dourado” que você quer remover.

---

## Mudanças propostas (alto nível)
### A) Sidebar “sempre aberta” (sem toggle em nenhum lugar)
- Remover o botão do header (`SidebarTrigger`) do `AppLayout.tsx`.
- Ajustar o componente de sidebar (`src/components/ui/sidebar.tsx`) para suportar um modo “fixo”:
  - **desabilitar toggle** (sem atalho Ctrl/Cmd+B, sem rail, sem cookie)
  - manter o estado sempre “expanded”
- Ajustar `AppSidebar.tsx` para **não depender mais de `collapsed`** e usar `collapsible="none"`.

### B) Largura menor e responsiva (sem ficar gigante em telas pequenas)
- No `AppSidebar.tsx`, trocar `w-64` por algo equivalente a **~240px**:
  - `w-[15rem]` (15rem = 240px)
  - e colocar um limitador para telas estreitas: `max-w-[80vw]` (ou similar) para não esmagar o conteúdo.
- Como não haverá modo colapsado, manter **texto sempre visível** (sem esconder labels).

### C) Visual mais clean: sem dourado no “glaze”, só champagne edge sutil
- No `src/styles/invictus-sidebar.css`:
  - Remover/zerar os `radial-gradient(...)` que puxam dourado no container.
  - Manter um glass neutro com blur (graphite) e adicionar apenas:
    - **borda interna champagne leve** (bem sutil, quase “metal escovado”)
    - sombra mais discreta (sem “luxo exagerado”)
- Ajustar o ativo para continuar claro, mas menos “ouro brilhando”:
  - manter a barrinha do ativo, porém com **menos saturação/opacidade** (ou usando `--gold-soft` e opacidade menor).
  - remover o divisor `invictus-gold-line` no final (ou trocar por divisor neutro), porque ele reforça “dourado interno”.

### D) Mobile fixo (sem drawer)
Hoje, no `Sidebar` (em `sidebar.tsx`), quando `isMobile` ele automaticamente vira `Sheet` (drawer). Para ficar fixo:
- Adicionar uma opção no `SidebarProvider` (ex.: `mobileMode: "sheet" | "fixed"`) e, quando `fixed`, o `Sidebar` **não usa Sheet no mobile** — renderiza o container normal.
- Ajustar `AppLayout.tsx` para passar `mobileMode="fixed"`.

---

## Arquivos que serão alterados
1) `src/components/AppLayout.tsx`
   - Remover `SidebarTrigger` do header.
   - Configurar `SidebarProvider` para modo fixo (ex.: `toggleable={false}`, `mobileMode="fixed"`).

2) `src/components/ui/sidebar.tsx`
   - Adicionar props de configuração no `SidebarProvider`, por exemplo:
     - `toggleable?: boolean` (default `true`)
     - `mobileMode?: "sheet" | "fixed"` (default `"sheet"`)
   - Se `toggleable === false`:
     - não registrar o listener do atalho
     - `toggleSidebar()` vira no-op
     - impedir alteração de cookie
     - garantir estado “expanded”
   - Se `mobileMode === "fixed"`:
     - no componente `Sidebar`, quando `isMobile`, renderizar a versão fixa em vez do `Sheet`.

3) `src/components/AppSidebar.tsx`
   - Remover `useSidebar()` e toda lógica de `collapsed`.
   - Trocar para `collapsible="none"`.
   - Largura fixa menor: `className="invictus-sidebar w-[15rem] max-w-[80vw]"` (ajustável).
   - Sempre renderizar labels e section labels.
   - Remover o `invictus-gold-line` do final (ou tornar neutro).

4) `src/styles/invictus-sidebar.css`
   - “Clean pass”:
     - tirar gradientes dourados do background do container
     - deixar apenas glass neutro + borda champagne mínima
     - reduzir presença do dourado no ativo (mais sutil)
     - revisar padding do link para ficar bom com 240px (sem parecer apertado).

(Opcional) `src/index.css`
- Se a classe `.invictus-gold-line` ficar sem uso após remover o divisor, podemos manter (não faz mal) ou limpar depois.

---

## Critérios de aceite (pra você validar rápido)
1) Não existe mais:
   - botão de toggle no topo
   - estado colapsado
   - Ctrl/Cmd+B afetando a sidebar
2) Sidebar fica fixa e com ~240px no desktop.
3) Fundo interno não “doura”; fica grafite/glass **limpo** com borda champagne discreta.
4) Mobile: sidebar aparece fixa (sem drawer).
5) Navegação/ativo continuam claros no `/class` e nas demais rotas.

---

## Riscos/observações (pra não te surpreender)
- **Mobile fixo** pode apertar bastante a área de conteúdo em telas muito pequenas. Por isso vou propor o `max-w-[80vw]` e padding mais eficiente, mas se ficar ruim visualmente, a alternativa mais “padrão premium” é: fixo em tablet e drawer em celular pequeno. (Você pediu fixo em tudo; vou seguir isso.)

---

## Sequência de implementação
1) Implementar “modo fixo” no `SidebarProvider/Sidebar` (`sidebar.tsx`).
2) Remover o trigger e configurar provider no `AppLayout.tsx`.
3) Simplificar `AppSidebar.tsx` (sem collapsed, largura ~240px).
4) Ajustar `invictus-sidebar.css` (clean glaze + borda champagne + ativo mais discreto).
5) Revisar visual no `/class` e mais 2 rotas (ex.: `/`, `/admin`) e também no mobile.

