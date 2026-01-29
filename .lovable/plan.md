
Objetivo
- Tirar o aspecto “genérico” da navegação lateral e criar um visual 100% Invictus (glass + dourado + metálico), mantendo legibilidade e performance.
- Você escolheu: **sem bloco de marca no topo**, visual **marcante**, e item ativo com **barra dourada + capsule**.

O que vou mudar (resultado esperado)
1) Sidebar com identidade “Invictus”
- Fundo com glass (mais “profundo” que o resto do app), vinheta sutil e uma “aura” dourada bem controlada.
- Borda/recorte premium: linha dourada interna + sombra de profundidade (sem neon).

2) Itens de navegação (o que deixa de ser genérico)
- Estado normal: ícone + texto com leve brilho dourado no hover (sem exagero).
- Estado hover: “sweep” dourado sutil + elevação mínima.
- Estado ativo: 
  - **Barra dourada** na esquerda (indicador forte)
  - **Capsule glass** envolvendo o item (com moldura dourada + highlight metálico)
  - Glow sutil (premium, não chamativo)

3) Experiência quando colapsada (mini)
- Continua com os ícones (como já está).
- Tooltip por item (para não ficar “mudo” quando só tiver ícone).
- Mantém o mesmo destaque de ativo (barra + capsule) adaptado ao tamanho mini.

Exploração do que já existe (base atual)
- `src/components/AppSidebar.tsx`: hoje cada item usa `NavLink` com classes simples e `activeClassName`.
- `src/components/ui/sidebar.tsx`: já oferece `data-active`, estados de colapso e estrutura consistente para estilizar via CSS/Tailwind.
- Tokens já existem em `src/index.css` (gold-soft / gold-hot / glass / sidebar-*).

Implementação (passo a passo)
A) Ajustar a composição da sidebar (AppSidebar)
1. Migrar o highlight de ativo para usar também os estados do componente do Sidebar:
   - Passar `tooltip={item.title}` no `SidebarMenuButton` quando colapsado (ou sempre, já que ele só mostra no collapsed).
   - Informar “ativo” tanto via `NavLink` quanto via `SidebarMenuButton` (para conseguir estilo mais rico com `data-active=true`).
2. Centralizar as classes em 2 “camadas”:
   - Uma classe de “container do item” (capsule) aplicada no `SidebarMenuButton` (ou wrapper).
   - Uma classe de “link interno” aplicada no `NavLink` para tipografia e alinhamento.
3. Garantir acessibilidade:
   - `aria-current="page"` continua.
   - Foco visível com ring dourado já existe via tokens; vamos reforçar.

Arquivos afetados:
- `src/components/AppSidebar.tsx`

B) Criar o “skin Invictus” via CSS (sem mexer na lib)
1. Adicionar classes utilitárias/estilos em `src/index.css` dentro de `@layer components`:
   - `.invictus-sidebar` para o container do Sidebar (glass + aura + borda dourada).
   - `.invictus-sidebar-item` para o item base.
   - `.invictus-sidebar-item--active` (ou via seletores `[data-active=true]`) para:
     - capsule glass
     - barra dourada à esquerda (pseudo-elemento `::before`)
     - highlight metálico (pseudo `::after` com gradiente “champagne/chrome”)
   - `.invictus-sidebar-icon` e `.invictus-sidebar-label` para micro-ajustes (tracking, opacidade, brilho).
2. Estilizar usando seletores já existentes do shadcn sidebar:
   - `[data-sidebar="sidebar"]` para o container.
   - `[data-sidebar="menu-button"][data-active="true"]` para o ativo.
   - `group-data-[collapsible=icon]` para adaptar ao modo colapsado.

Arquivos afetados:
- `src/index.css`

C) Ajustes finos (para ficar “marcante” sem perder classe)
1. Ajustar o “tom do dourado” no ativo:
   - Usar `--gold-hot` para o outline/linha forte e `--gold-soft` para gradientes.
2. Controlar “glow”:
   - Glow apenas no ativo/hover e sempre com opacidade baixa (evitar neon).
3. Garantir que o fundo do item (capsule) não fique transparente demais:
   - A capsule deve ter background real (glass), para não “vazar” e ficar feio (especialmente em dark).

Checklist de validação (o que vamos testar no Preview)
1) Visual
- Sidebar parece “premium”: profundidade + vidro + dourado metálico.
- Item ativo tem claramente: barra dourada + capsule (sem poluir).
- Hover é “vivo”, mas executivo (sem neon).

2) UX
- Com sidebar expandida: texto legível, bom contraste.
- Com sidebar colapsada: tooltips aparecem; ícones continuam claros.
- Navegação entre rotas atualiza o ativo corretamente (ex.: /admin, /mapa, /perfil).

3) Responsivo
- Mobile: sidebar como drawer não perde estilos (sem transparência ruim).
- Toques: áreas clicáveis continuam confortáveis.

Riscos / cuidados
- Evitar excesso de blur e sombras pesadas para não degradar performance em mobile.
- Garantir que o “glass” não deixe o texto com pouco contraste (vamos calibrar opacidades).
- Não quebrar a lógica de colapso do Sidebar (vamos respeitar `data-*` e padrões existentes).

Entrega incremental
1) Aplicar “skin Invictus” no container da sidebar + itens base.
2) Implementar estado ativo (barra + capsule) e hover.
3) Ajustar collapsed (tooltips + estilos adaptados).
4) Polimento: contraste, espessuras, sombras.

Observação (sobre o que você pediu)
- Como você quer “sem bloco de marca”, não vou duplicar logo/nome dentro da sidebar. Toda a assinatura vai vir do material/efeitos do próprio menu (o que deixa mais “clean” e ainda assim único).
