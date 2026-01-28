
Objetivo (o que você pediu)
- Criar uma tela inicial “Home” que será a primeira coisa que o usuário vê (antes do mapa).
- Manter a aba “Mapa” e a tela do mapa exatamente como está hoje (mesmo layout e conteúdo), só mudando para uma rota própria.
- Na Home vamos deixar blocos prontos para vocês alimentarem com informações “full time”: bem-vindo, avisos, eventos, destaques, etc. (por enquanto como placeholders, mas já com estrutura bonita).

Decisão confirmada
- Home será em “/” (raiz).
- O Mapa deixa de ser “/” e passa a ser “/mapa”.

Mudanças previstas (frontend)
1) Rotas (src/App.tsx)
- Criar uma nova página `Home` e renderizá-la em `path="/"`.
- Mover o componente atual do mapa (hoje `Index`) para `path="/mapa"`.
- Manter as demais rotas (`/buscar`, `/mensagens`, `/perfil`, `/admin`) exatamente como estão.
- Ajustar importações necessárias.

2) Sidebar / Menu (src/components/AppSidebar.tsx)
- Adicionar um item “Home” apontando para `/` (novo primeiro item).
- Alterar o item “Mapa” para apontar para `/mapa` (sem mudar o título “Mapa” nem o ícone atual, a não ser que você queira).
- Conferir o comportamento “ativo” do item do menu:
  - Hoje o código compara `currentPath === path`. Isso funciona bem para rotas simples.
  - Garantir que “Home” só fique ativo quando estiver exatamente em “/”.
  - Garantir que “Mapa” fique ativo quando estiver em “/mapa”.

3) Página Home (novo arquivo, ex.: src/pages/Home.tsx)
Conteúdo proposto (placeholder, mas já com cara “premium” e pronto para receber dados):
- Header:
  - Título grande “Home” ou “Bem-vindo”
  - Subtítulo curto: “Últimas atualizações, avisos e eventos da Fraternidade.”
- Grade de cards (usando os componentes existentes e o estilo “invictus-surface invictus-frame” que vocês já usam):
  - Card 1: “Bem-vindo”
    - Texto curto e editável futuramente
  - Card 2: “Acontecendo agora”
    - Lista de 2–4 itens fake/placeholder (para vocês trocarem depois)
  - Card 3: “Próximos eventos”
    - Placeholder com data/local (mock)
  - Card 4: “Avisos”
    - Placeholder (ex.: “Atualização importante…”, “Reunião…”, etc.)
- Observação: vamos montar a estrutura para depois plugar com dados do backend quando vocês quiserem atualizar em tempo real.

4) Ajuste do “Return to Home” no 404 (src/pages/NotFound.tsx)
- Hoje o 404 tem um link que aponta para “/”.
- Como “/” agora é a Home, isso continua correto; apenas vamos trocar o texto de “Return to Home” para “Voltar para Home” (opcional) para ficar consistente com o app em PT-BR.

O que NÃO vai mudar (garantias)
- A tela do Mapa (atual Index) não será redesenhada nem “mexida”; ela só será acessada via `/mapa`.
- A aba “Mapa” continua existindo no menu lateral.
- Nenhuma outra tela (Buscar, Mensagens, Perfil, Admin) muda de conteúdo.

Critérios de aceitação (como você valida no Preview)
- Ao abrir o app, a primeira tela exibida é a Home (com os cards “bem-vindo / acontecendo / eventos / avisos”).
- Ao clicar em “Mapa” no menu, abre exatamente o mesmo conteúdo que existia antes (agora em `/mapa`).
- Rotas existentes continuam funcionando.
- No 404, o botão/link de voltar leva para a Home.

Próximos incrementos (para quando você quiser)
- Transformar os blocos da Home em conteúdo dinâmico (avisos/eventos) alimentado pelo backend (com permissões por usuário).
- Adicionar destaque de “Evento do dia” e um carrossel de cards.
- (Quando tivermos login) redirecionar automaticamente o usuário logado para Home e controlar acesso a certas abas.

Checklist técnico (para implementação)
- [ ] Criar `src/pages/Home.tsx`
- [ ] Atualizar `src/App.tsx` (rotas + imports)
- [ ] Atualizar `src/components/AppSidebar.tsx` (navItems: Home + Mapa em /mapa)
- [ ] Ajustar `src/pages/NotFound.tsx` (texto do link, opcional)
- [ ] Testar navegação: /, /mapa, /buscar, /mensagens, /perfil, /admin, rota inexistente

Sequência de entrega
1) Implementar Home + rotas
2) Ajustar Sidebar (Home e Mapa)
3) Revisar layout e responsividade da Home
4) Teste end-to-end de navegação

Impacto/risco
- Mudança de URL do mapa: o endereço antigo “/” deixa de ser “Mapa” e vira “Home”. Se alguém tiver salvo “/” esperando ver o mapa, agora verá a Home (é exatamente o comportamento desejado para “tela inicial”). O mapa passa a ser “/mapa”.
