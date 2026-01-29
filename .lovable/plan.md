
## O que você pediu (interpretação)
Você gostou de ter “algo por trás” na sidebar, mas quer:
- **um dourado com gradiente misturado com preto/grafite**
- **bem sutil**
- com sensação de **vidro / mármore** (efeito “pedra polida” por baixo do glass)
- aparecendo **no fundo + um leve realce no topo**
- funcionando **no dark e no light**

## Onde mexer (baseado no código atual)
O visual do container da sidebar está centralizado em:
- `src/styles/invictus-sidebar.css`
  - `.invictus-sidebar [data-sidebar="sidebar"]` (background principal)
  - `::before` (camada de highlights/edge)
  - `::after` hoje está `content: none;` (pode virar a nova camada “mármore”)
Os tokens de cor existentes já ajudam:
- `src/index.css`: `--gold-soft`, `--gold-hot`, `--card`, `--background`, `--foreground`, `--glass`

## Estratégia visual (como vamos “fazer mármore” sem imagem)
Vamos criar um “mármore” usando **camadas de gradientes** (barato, sem assets):
1) **Base glass neutra** continua (para não voltar o glaze feio)
2) **Camada “mármore” (bem sutil)** em um pseudo-elemento (provavelmente `::after`)
   - 2–3 `radial-gradient(...)` dourados muito leves (cantos/topo)
   - 1–2 `radial-gradient(...)` grafite/escuro para simular “veios”
   - 1 `linear-gradient(...)` suave para orientar o fluxo do mármore
   - `mix-blend-mode: soft-light` (ou `overlay`) + `opacity` baixa
3) **Realce no topo** integrado no `::before`
   - uma faixa leve de highlight (tipo “luz no vidro”)
4) **Champagne edge** permanece, mas calibrada para não “banhar” de ouro.

## Mudanças planejadas (passo a passo)

### 1) Adicionar “marble overlay” na sidebar (invictus-sidebar.css)
Arquivo: `src/styles/invictus-sidebar.css`

- Manter o background atual do container como base:
  - `background: linear-gradient(180deg, hsl(var(--card) / var(--glass)) 0%, hsl(var(--card) / 0.16) 100%);`

- Trocar `.invictus-sidebar [data-sidebar="sidebar"]::after` de `content: none;` para uma camada ativa:
  - `content: ""`
  - `position: absolute; inset: 0; border-radius: inherit; pointer-events: none;`
  - `opacity`: alvo “Sutil” (ex.: 0.35–0.55, ajustável)
  - `mix-blend-mode: soft-light` (primeira tentativa) para ficar “dentro do vidro”
  - `filter: blur(0.2px)` (opcional e mínimo) para “polir” sem pesar
  - `background` com stack tipo:
    - `radial-gradient(120% 90% at 15% 10%, hsl(var(--gold-hot) / 0.10), transparent 55%)`
    - `radial-gradient(120% 90% at 90% 20%, hsl(var(--gold-soft) / 0.08), transparent 60%)`
    - `radial-gradient(120% 110% at 40% 80%, hsl(var(--foreground) / 0.08), transparent 65%)` (veio escuro)
    - `linear-gradient(135deg, transparent 0%, hsl(var(--gold-hot) / 0.06) 35%, transparent 70%)`
  - Isso cria o “mármore” sem virar “glaze dourado”.

### 2) Realce no topo (invictus-sidebar.css)
Ainda em `src/styles/invictus-sidebar.css`, reforçar o `::before` para “Fundo + topo”:
- manter a borda champagne sutil
- adicionar um highlight concentrado no topo (bem discreto), ex.:
  - `radial-gradient(120% 60% at 50% 0%, hsl(var(--gold-soft) / 0.10), transparent 55%)`
- manter `opacity` controlada para não competir com o conteúdo do menu

### 3) Ajuste específico para Light theme (fallback)
Como você pediu “Dark + light”, vamos garantir que no `:root` (light) o efeito não fique estranho:
- No light, `--card`/`--background` são claros, então dourado pode “aparecer demais”.
- Vamos fazer o overlay no light usar opacidades menores (no próprio CSS via seletor do tema), ex.:
  - `:root .invictus-sidebar [data-sidebar="sidebar"]::after { opacity: ... menor }`
  - `.dark .invictus-sidebar ... { opacity: ... um pouco maior }`
Sem criar novos tokens obrigatórios (mas se precisar, podemos adicionar 1–2 custom properties para facilitar “tuning”).

### 4) Checagens de legibilidade (ativo/hover)
Depois do novo fundo:
- Validar contraste de:
  - `.invictus-sidebar-item[data-active="true"]` (fundo ativo)
  - cor dos textos (`.invictus-sidebar-label`) e ícones
- Se o fundo “mármore” fizer o item ativo perder leitura, ajustamos:
  - aumentar levemente o `background` do ativo (ex.: 0.03 → 0.04/0.05)
  - ou reduzir a opacidade do overlay só atrás da lista (opção avançada)

## Arquivos que serão alterados
- `src/styles/invictus-sidebar.css` (principal; é onde o efeito vai nascer)
(Opcional, se precisarmos de “tuning tokens”)
- `src/index.css` (somente se a gente decidir criar variáveis do tipo `--sidebar-marble-opacity` para controlar fácil)

## Critérios de aceite (bem objetivos)
1) Sidebar mantém o “fundo com vida”, mas:
   - **não parece glaze dourado**
   - é **sutil** e “dentro do vidro”
2) Dá sensação de **mármore/vidro** (veios suaves + dourado discreto)
3) Existe um **leve highlight no topo**
4) Continua legível (texto/ícones/ativo) no `/buscar` e em outras rotas
5) No tema claro, o efeito existe mas é **mais discreto** (sem estourar contraste)

## Testes que vou fazer/te pedir para validar
- Desktop: navegar `/buscar`, `/mapa`, `/perfil` e conferir legibilidade
- Mobile (modo fixo): conferir se o fundo não “polui” numa tela menor (opacidade pode precisar -10% no mobile)
- Tema claro: forçar light e confirmar que não fica “amarelado demais”
