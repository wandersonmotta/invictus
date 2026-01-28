
Objetivo
- Redesenhar o site para ficar “mobile-first” sem trocar a navegação (manter menu lateral/drawer), melhorando legibilidade, espaçamento, tamanhos de toque e comportamento do layout em telas pequenas.

O que já existe hoje (estado atual)
- Layout base: `AppLayout` com header sticky (h-12) + `SidebarProvider`/`SidebarInset`.
- Sidebar do shadcn:
  - Desktop: fixa/colapsável.
  - Mobile: vira `Sheet` (drawer) com largura fixa `SIDEBAR_WIDTH_MOBILE = 18rem`.
- Páginas já usam Tailwind responsivo em alguns pontos (`sm:grid-cols-2`, `lg:grid-cols-3`, `p-4 md:p-6`), porém:
  - Tipografia e header podem ficar “apertados” no mobile.
  - Alvos de toque (botões/tabs/inputs) podem ficar pequenos.
  - Alguns layouts (carrosséis, tabelas/listas, cards longos) precisam de padrões consistentes para “não estourar” e manter leitura.

Escopo da primeira entrega (conforme suas escolhas)
- Navegação mobile: manter “Menu lateral (atual)”.
- Prioridade: “Refino responsivo” (sem reestruturar tudo).
- Controles maiores no celular.

O que será feito (visão do usuário)
1) No celular, o app terá:
   - Header mais confortável (altura e espaçamento maiores), com o botão do menu mais fácil de clicar.
   - Paddings e espaçamentos padronizados entre telas.
   - Títulos e textos com tamanhos adaptativos (sem “gigante” e sem “miúdo”).
   - Cards e listas com áreas de toque maiores e melhor quebra de linha.
2) A sidebar no celular abrirá como drawer mais largo e “usável” (largura proporcional à tela), com itens mais altos para toque.

Mudanças técnicas propostas (por arquivo / área)

A) Base responsiva (tokens + utilitários)
Arquivos:
- `src/index.css` (ou camada @layer components/ base)
Ações:
- Criar utilitários/padrões para mobile:
  - “Safe area” e padding coerente (ex.: `pb-safe`, `pt-safe` se necessário).
  - Ajustar estilos globais para evitar overflow horizontal acidental (ex.: `body { overflow-x: hidden; }` se estiver ocorrendo).
- Criar classes utilitárias do projeto para layout e tipografia, por exemplo:
  - `.page` (spacing vertical consistente)
  - `.page-header` (gap e alinhamento padronizados)
  - `.h1`, `.lead` (tipografia responsiva)
Observação:
- Isso reduz a repetição e mantém todas as páginas com o mesmo “feeling” no mobile.

B) AppLayout (header + container)
Arquivo:
- `src/components/AppLayout.tsx`
Ações:
- Aumentar área de toque e conforto no mobile:
  - Header: de `h-12` para algo como `h-14` no mobile e `h-12` no desktop, ou manter `h-14` geral.
  - `SidebarTrigger`: garantir tamanho mínimo de toque (>=44px) no mobile (ex.: `h-10 w-10` em `sm`/mobile).
- Melhorar espaçamento do conteúdo:
  - Conteúdo: hoje `p-4 md:p-6`; manter, mas revisar para:
    - `p-4 sm:p-5 md:p-6` (ou similar) e ajustar `space-y` nos headers das páginas.
- Garantir que o header não “coma” espaço útil:
  - Revisar altura + sticky para não reduzir leitura.

C) Sidebar mobile (drawer) mais “app-like”
Arquivo:
- `src/components/ui/sidebar.tsx`
Ações:
- Melhorar usabilidade do drawer no celular:
  - Aumentar a largura do drawer de um valor fixo (18rem) para algo proporcional como `min(20rem, 85vw)` ou `85vw` (mantendo limites).
  - Aumentar altura dos itens de menu no mobile (ex.: `h-11`/`h-12`) e padding interno.
  - Garantir contraste e fundo sólido em menus/overlays (evitar transparência excessiva).
- Verificar se o drawer tem fechamento intuitivo:
  - Hoje o botão default do Sheet está oculto (`[&>button]:hidden`). Manteremos isso se o overlay fechar com toque fora; caso atrapalhe, adicionaremos um “Fechar” acessível dentro do drawer (sem duplicar `SidebarTrigger` no header).

D) Padrão de tipografia e “touch targets” nas telas
Arquivos alvo:
- `src/pages/Home.tsx`
- `src/pages/Index.tsx` (Mapa)
- `src/pages/Buscar.tsx`
- `src/pages/Mensagens.tsx`
- `src/pages/Perfil.tsx`
- `src/pages/Class.tsx`
- `src/pages/Admin.tsx`
- `src/pages/Auth.tsx` e `src/pages/ResetPassword.tsx`
Ações (padrão aplicado em todas):
- Títulos:
  - Ajustar `text-2xl` para algo responsivo (ex.: `text-xl sm:text-2xl`) para evitar “quebra feia” em telas menores.
- Parágrafos/descrições:
  - Garantir legibilidade com `text-sm` no mobile e `md:text-sm` (ou manter) e melhorar `leading`.
- Botões/inputs/tabs:
  - Aumentar altura padrão no mobile:
    - Botões principais: `h-11`/`h-12` no mobile (ex.: via variante/classe no uso).
    - TabsList/TabsTrigger: mais altos e com padding maior.
    - Inputs/Select/Textarea: `h-11` no mobile quando aplicável.
- Cards e listas:
  - Aumentar padding interno em cards no mobile quando o conteúdo for “clicável”.
  - Melhorar quebras: aplicar `min-w-0`, `break-words`, `truncate` onde necessário.
- Evitar overflow horizontal:
  - Revisar seções com `-mx-4 px-4 overflow-x-auto` (Class) para garantir que não apareça scroll horizontal fora do carrossel.

E) Ajustes específicos por tela (refino)
1) Class (`src/pages/Class.tsx`)
- Carrossel:
  - Ajustar largura dos cards no mobile (ex.: manter 168px mas revisar gaps/padding e área de toque).
  - Tornar o card clicável com área maior (padding/rounded) e reforçar “tap”.
- Header:
  - Melhorar espaçamento e tipografia no mobile.

2) Admin (`src/pages/Admin.tsx`)
- Tabs e formulários:
  - TabsList: garantir que não “esprema” no mobile e tenha altura de toque maior.
  - Botões “Remover”: aumentar área de toque no mobile sem ficar visualmente pesado.
  - Linhas de listagem: garantir `min-w-0` + truncates corretos (já existe em parte) e aumentar padding em mobile.

3) Auth / ResetPassword
- Ajustar card para “mobile comfy”:
  - Reduzir densidade visual, aumentar altura do botão e inputs.
  - Garantir que o modal de “Esqueceu a senha?” caiba bem em telas pequenas (padding e largura).

Critérios de aceite (checklist de QA)
1) Layout
- Não existe scroll horizontal “involuntário” em nenhuma tela comum.
- Header não cobre conteúdo e mantém leitura boa no mobile.
2) Navegação
- No mobile, o botão de menu é fácil de tocar e o drawer abre com largura confortável.
- Itens da sidebar no mobile têm toque fácil e não ficam “apertados”.
3) Telas principais
- Home/Mapa/Buscar/Mensagens/Perfil/Class/Admin: títulos, cards e botões não ficam pequenos e não quebram layout.
4) Acessibilidade básica
- Controles principais com altura mínima de toque (meta: ~44px) no mobile.
- Contraste preservado no tema dark + gold.

Plano de implementação (sequência)
1) Auditoria rápida de estilos e “pontos de quebra” (mobile 320–390px, tablet 768px, desktop).
2) Atualizar `AppLayout` (header + padding do conteúdo) e validar todas as rotas.
3) Ajustar `sidebar.tsx` para drawer mobile com largura proporcional e itens maiores.
4) Aplicar padrão de tipografia/spacing nas páginas (headers, botões, tabs, cards).
5) Ajustes finos nas telas “mais densas” (Admin, Class, Auth/Reset).
6) Revisão final em 3 tamanhos (mobile/tablet/desktop) e correção de overflow.

Notas técnicas (para manter consistência)
- Evitar criar novos sistemas de navegação (conforme pedido).
- Preferir classes Tailwind responsivas e utilitários reutilizáveis ao invés de custom CSS espalhado.
- Manter a identidade visual (dark + dourado + glass) e reforçar legibilidade no mobile.

O que eu preciso de você (nenhum bloqueio, só confirmação visual depois)
- Depois de implementar, você vai testar visualmente em:
  - Mobile (390x844), tablet (768x1024), desktop (1366x768)
  - E me dizer qual tela ainda parece “apertada” para ajustarmos.

