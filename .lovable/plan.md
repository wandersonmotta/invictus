
Objetivo
- Substituir o “I” (monograma) por uma logo em PNG (que você vai enviar) e colocar o texto “FRATERNIDADE” ao lado, mantendo a estética “Monograma + molduras” e luxo impactante.
- Aplicar a mesma identidade também na Sidebar (topo) e trocar o favicon pelo mesmo PNG.
- Implementar um efeito premium no texto “FRATERNIDADE”: o dourado “acende” exatamente na região onde o mouse passa.

O que falta para eu executar
- Você ainda vai enviar o PNG final da logo (arquivo separado). Assim que chegar, eu consigo:
  1) copiar para o projeto (assets/public),
  2) plugar no header + sidebar,
  3) gerar/atualizar o favicon.

Exploração (estado atual)
- Header atual (src/components/AppLayout.tsx):
  - Renderiza um círculo “I” com classe invictus-monogram
  - Textos: “Invictus” e “FRATERNIDADE”
- Sidebar atual (src/components/AppSidebar.tsx):
  - Mostra “Invictus” em SidebarGroupLabel
  - Linha dourada decorativa ao final
- index.html:
  - Não tem <link rel="icon"...>; hoje provavelmente usa o public/favicon.ico padrão do Vite

Decisões já confirmadas (a partir das suas respostas)
- Usar outro PNG (você vai enviar)
- Aplicar em: topo (header), sidebar e favicon
- Tamanho: médio (presença premium sem exagero)
- Texto: manter somente “FRATERNIDADE” e criar efeito dourado “onde o mouse está em cima”

Abordagem de implementação (quando o PNG chegar)
1) Adicionar o arquivo de logo ao projeto
- Criar pasta src/assets (não existe hoje) e copiar o PNG para lá, por exemplo:
  - src/assets/invictus-logo.png
- Motivo: em componentes React, importar via ES module dá melhor bundling e cache-busting.

2) Trocar o monograma do header pela logo PNG + texto “FRATERNIDADE” (AppLayout)
- Em src/components/AppLayout.tsx:
  - Substituir o <span className="invictus-monogram ...">I</span> por:
    - <img src={logo} ... /> (logo importada de src/assets)
  - Remover o texto “Invictus” do header
  - Manter apenas “FRATERNIDADE” ao lado da logo
  - Ajustar espaçamento para “tamanho médio”:
    - Header height continua h-12
    - Logo com altura ~36px (equivalente visual ao “médio”)
    - Largura auto (preserva proporção)
  - Garantir que fique bonito em sidebar colapsada/expandida e em mobile.

3) Efeito premium no texto “FRATERNIDADE” (dourado no ponto do mouse)
- Criar um pequeno componente reutilizável, por exemplo:
  - src/components/GoldHoverText.tsx
- Como funciona (técnico, mas robusto e leve):
  - Renderiza um <span> com:
    - text color base (muted-foreground)
    - background em “radial-gradient” dourado cujo centro acompanha o mouse (CSS var)
    - background-clip: text e color: transparent para mostrar o gradiente dentro do texto
  - Eventos:
    - onMouseMove: calcula a posição X dentro do elemento (0–100%) e seta style={{ "--x": "42%" }}
    - onMouseLeave: volta para um “x” neutro (ex: 50%) e reduz o brilho
- Resultado: o dourado “aparece” exatamente onde o mouse está passando, como você pediu (não apenas um hover genérico).

4) Aplicar logo no topo da Sidebar (AppSidebar)
- Em src/components/AppSidebar.tsx:
  - Substituir “Invictus” no SidebarGroupLabel por um bloco “brand”:
    - Logo (mesma importação do asset)
    - Texto opcional “FRATERNIDADE” (somente quando não estiver colapsada)
  - Garantir que no modo colapsado:
    - Mostre só o ícone/logo centralizado e com bom padding
- Manter a linha dourada e os estados ativos atuais (já estão bons: ring-primary/25).

5) Atualizar favicon com a mesma logo
- Copiar o PNG para public/ (para ser servido direto), por exemplo:
  - public/favicon.png
- Atualizar index.html adicionando:
  - <link rel="icon" href="/favicon.png" type="image/png" />
- Observação: favicon pode precisar de um PNG quadrado para ficar perfeito. Se sua logo for muito “wide”, eu posso:
  - criar um favicon separado recortando para um ícone (ex: círculo dourado com “I” ou símbolo do brasão), se você preferir.
  - Caso você queira exatamente a logo “wide” como favicon, ainda funciona, mas pode ficar pequeno/ilegível na aba.

6) Ajustes finos de “impacto premium”
- Aplicar um micro “halo” na logo (sem exagerar):
  - drop-shadow suave dourado no img (apenas no header/sidebar)
- Garantir contraste e legibilidade:
  - “FRATERNIDADE” com tracking alto (já existe) + efeito dourado no hover
- Checar que não cria transparências ruins em menus/dropdowns (manter fundos sólidos onde precisa).

Critérios de aceitação (o que você vai validar)
- No / (Mapa), ao abrir o Preview, o topo mostra:
  - logo PNG + “FRATERNIDADE” apenas (sem “Invictus”)
- Ao passar o mouse sobre “FRATERNIDADE”, o dourado “segue” o mouse no texto (efeito localizado).
- Sidebar:
  - topo exibe logo; texto aparece somente quando não colapsada
- Favicon:
  - aparece como a nova logo (ou variação escolhida) na aba do navegador

Riscos e mitigação
- PNG muito grande/pesado:
  - Otimizar (sem perder qualidade) e limitar dimensões via CSS
- Favicon ilegível por ser retangular:
  - Propor um favicon “ícone” alternativo (quadrado) se necessário

Próximo passo
- Você enviar o PNG final da logo (arquivo separado). Assim que eu receber, eu implemento exatamente os passos acima (header + sidebar + favicon + efeito “gold follow” no FRATERNIDADE).
