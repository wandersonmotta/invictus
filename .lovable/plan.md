
## Objetivo (sem mudar visual/funcionalidade)
1) Remover o “travamento”/atraso no primeiro carregamento da landing (rota “/”), principalmente sensação de “carregando fontes”.
2) Adicionar um hover desktop “puxando pra frente” (3D lift) **somente** nos cards de:
   - “Nossa mentalidade (pilares)”
   - “O que você encontra aqui”
3) Fazer um checkup e aplicar otimizações de performance gerais (desktop/tablet/celular) sem sacrificar nada.

---

## Diagnóstico (o que provavelmente está causando o “travamento” no primeiro load)
Hoje a landing está “limpa”, mas o bundle inicial ainda pode estar pesado por dois motivos principais:

1) **Rotas importadas de forma eager (sem lazy loading)**
   - Em `src/App.tsx`, todas as páginas (Mapa, Feed, Comunidade, etc.) são importadas no topo.
   - Isso força o build a colocar muita coisa no JS inicial, mesmo quando o usuário só abriu “/”.
   - “Travamento de fontes” normalmente é sintoma de:
     - JS pesado bloqueando thread principal no início
     - CSS grande sendo parseado no começo
     - Reflow/paint atrasado (parece que “texto muda” ou “liga depois”)

2) **CSS do Leaflet está sendo carregado globalmente**
   - `src/index.css` importa `leaflet/dist/leaflet.css` sempre, mesmo na landing.
   - Leaflet CSS é relativamente grande e pode influenciar parse + carregamento de assets (ícones), impactando o primeiro paint.

Não há indícios de fontes externas (Google Fonts) sendo carregadas; então o “efeito fonte travando” é quase certamente “custo inicial” (JS/CSS) e não “font download”.

---

## Estratégia de otimização (prioridade alta, baixo risco)
### A) Code-splitting por rota (reduz muito o JS inicial)
**O que faremos**
- Transformar páginas pesadas em `React.lazy()` com `Suspense`:
  - Mapa (`Index`/`/mapa`) é prioridade (Leaflet).
  - Feed, Comunidade, Mensagens, Class, Admin, Buscar, Membro também podem entrar.
- Manter a landing como eager (carrega instantaneamente).

**Por que melhora**
- O usuário que entra em “/” vai baixar e executar bem menos JS.
- Menos bloqueio da thread principal = menos “travada” na renderização do texto.

**Arquivos**
- `src/App.tsx` (trocar imports diretos por lazy imports e envolver com `<Suspense>` em cada route ou em um wrapper)

**Fallback visual**
- Usar um fallback discreto (ex.: “Carregando…”) com estilo Invictus (sem mudar layout da landing).
- Importante: não mexer na estética; o fallback só aparece ao navegar para rotas lazy.

---

### B) Carregar CSS do Leaflet somente quando o mapa abrir
**O que faremos**
- Remover `@import "leaflet/dist/leaflet.css";` de `src/index.css`.
- Importar Leaflet CSS dentro do módulo do mapa (ex.: `src/components/map/MemberMap.tsx` ou a página `src/pages/Index.tsx`), para que o CSS entre apenas no chunk do mapa.

**Por que melhora**
- Reduz CSS parse no primeiro load da landing.
- Evita puxar assets (imagens do Leaflet) antes do usuário precisar.

**Arquivos**
- `src/index.css` (remover import do Leaflet)
- `src/components/map/MemberMap.tsx` (adicionar `import "leaflet/dist/leaflet.css";`)
  - Opcional: mover também `invictus-map.css` e `invictus-map-pins.css` para ficarem “map-only” (avaliar tamanho; se forem leves, não é obrigatório).

---

## Animação “puxar pra frente” no hover (somente desktop)
### Requisito
- Apenas desktop (mouse), sem afetar mobile/tablet touch.
- Aplicar nos cards:
  - “Nossa mentalidade (pilares)”
  - “O que você encontra aqui”
- Efeito: levantar, vir para frente (3D), com transição suave.

### Implementação
**O que faremos**
1) Criar uma variante de card para hover, por exemplo:
   - Classe: `invictus-landing-card--lift`
2) Aplicar essa classe nos dois lugares:
   - `Pillars()`: no `<div className="invictus-landing-card p-4">` acrescentar `invictus-landing-card--lift`
   - `WhatYouFindHere()`: idem

**CSS do efeito**
- Só em dispositivos com hover real:
  - `@media (hover: hover) and (pointer: fine) { ... }`
- Animação:
  - `transform: translateY(-6px) translateZ(0) scale(1.02);`
  - `box-shadow` levemente reforçado
  - `transition: transform 220ms cubic-bezier(...), box-shadow 220ms ...;`
- Sem custo extra no mobile:
  - Nada aplicado fora do media query.
- Acessibilidade:
  - Respeitar `prefers-reduced-motion: reduce` (sem lift ou com lift mínimo).

**Arquivos**
- `src/components/landing/ManifestoSections.tsx` (adicionar a classe nos cards)
- `src/styles/invictus-auth.css` (onde já estão os estilos da landing/cards) para inserir o bloco do hover.

---

## Checkup completo de performance (sem “mudar nada” visualmente)
Aqui o foco é “ganho de velocidade sem alterar aparência/fluxo”:

### 1) Verificar se há downloads redundantes ou assets não críticos no primeiro load
- Confirmar se landing já está com:
  - background via `<img fetchPriority="high" decoding="sync">` (já está)
  - preload no `index.html` (já está para landing e auth)
- Ajustar apenas se encontrarmos duplicação:
  - garantir que não exista background-image duplicado via CSS (parece já resolvido)

### 2) Reduzir custo inicial de JS (principal)
- Lazy loading de rotas (A) é o maior ganho.

### 3) Reduzir custo inicial de CSS (segundo maior ganho)
- Leaflet CSS “map-only” (B).

### 4) Revisão de “main thread blocks” (sintoma de travada)
- Conferir no console/network (durante implementação) se há:
  - warnings de “long task”
  - muitos assets no first load
- Ajustar:
  - deferir imports pesados
  - evitar inicializações desnecessárias na landing

---

## Plano de validação (desktop/tablet/celular)
### Landing “/”
- Recarregar (hard refresh) e validar:
  - texto aparece estável
  - sensação de “travada” diminuiu
  - background continua premium e imediato

### Desktop hover
- Em “Nossa mentalidade (pilares)”:
  - passar mouse em cima: card levanta “pra frente”
  - sair: volta suave
- Em “O que você encontra aqui”:
  - mesmo comportamento
- Confirmar que não afeta scroll/performance.

### Tablet/celular
- Garantir que:
  - não existe hover “preso”
  - performance não piora
  - animações continuam suaves

### Mapa (/mapa)
- Abrir e confirmar:
  - Leaflet CSS carregou corretamente (pins, tiles, controles)
  - nada quebrou visualmente

---

## Arquivos que serão alterados (estimativa)
1) `src/App.tsx`
   - Aplicar `React.lazy` + `Suspense` por rota (ou por grupo).
2) `src/index.css`
   - Remover `@import "leaflet/dist/leaflet.css";`
   - (Opcional) manter invictus-map.css global ou mover para map-only dependendo do peso.
3) `src/components/map/MemberMap.tsx` (ou `src/pages/Index.tsx`)
   - Importar `leaflet/dist/leaflet.css` localmente.
4) `src/components/landing/ManifestoSections.tsx`
   - Adicionar classe `invictus-landing-card--lift` nos cards desejados.
5) `src/styles/invictus-auth.css`
   - Adicionar o CSS do hover lift com media query para desktop + reduced-motion.

---

## Riscos / cuidados
- Lazy loading exige fallback; vamos manter bem discreto e consistente com o tema.
- CSS do Leaflet precisa estar disponível quando o mapa montar; vamos importar no mesmo módulo que usa Leaflet para garantir.
- Hover lift aumenta “camadas” no desktop; vamos limitar a transform (GPU-friendly) e evitar blur pesado no hover.

---

## Entregáveis
- Primeiro carregamento da landing mais leve (menos JS/CSS inicial).
- Hover “puxando pra frente” nos cards certos no desktop.
- Checkup aplicado com ganhos reais sem alterar identidade visual.
