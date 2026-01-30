
## Objetivo (o que você pediu)
- Na tela **/auth**: manter o **card exatamente como está** (dourado, vidro, moldura, tipografia, botões, tudo).
- Manter a “pegada” de **gradiente** atual do app, mas adicionar por trás uma **imagem PB (preto e branco)** com vibe “organização/elite antiga”: **prédio** + **pessoas de terno**, estética vintage.
- Deixar **surreal/premium**, mas com a imagem **sutil** (sem roubar a cena do card).
- Adicionar um “parallax” leve no fundo.

Você escolheu: **Gerar por IA** + intensidade **Sutil** + **Parallax**.

---

## O que eu já verifiquei no projeto (para encaixar sem quebrar nada)
- A página `src/pages/Auth.tsx` usa um `<main className="min-h-svh grid place-items-center ...">` e aplica as classes:
  - `invictus-auth-surface invictus-auth-frame` no Card e também nos Dialogs.
- Essas classes estão definidas em `src/index.css` e já criam um “glass” premium (backdrop blur + moldura dourada).
- Hoje o `body` já tem um fundo com **radial-gradients** (bem sutil) em `src/index.css`. Vou preservar esse “DNA” e somar a foto só no /auth.

---

## Abordagem (mínima e segura, sem mexer no card)
### 1) Gerar a imagem (IA) no estilo certo
Vou gerar **1 imagem principal** (e opcionalmente 2 variações) com estes requisitos:
- **Preto e branco** (vintage/analógico)
- **Arquitetura**: fachada de prédio corporativo/ institucional (imponente)
- **Pessoas**: homens/figuras de terno estilo antigo (anos 30–60), discretos
- **Sem texto, sem logos, sem marcas**
- Com “grain” leve (cinema/filme) para estética antiga (mas sem poluir)
- Enquadramento “wide” para fundo de tela

**Formato recomendado para performance:**
- Exportar como **WEBP** (ou PNG se necessário) em ~**1920px** de largura (ou 2560px se estiver muito detalhado e pesado não for problema).

**Resultado:** a imagem vai entrar no projeto como asset estático (ex.: `src/assets/auth-bg.webp` ou `public/auth/auth-bg.webp`).

---

### 2) Criar um “fundo exclusivo do /auth” com overlay premium (sutil)
Sem mexer no card, vou mudar apenas o **container do /auth** para ter:
- **Imagem de fundo**
- **Overlay com gradientes** (para manter a identidade e garantir leitura)
- Um toque de “vignette” discreta (para “fechar” o visual e valorizar o card)

Implementação (conceito):
- Adicionar uma classe no `<main>` da tela Auth, tipo: `invictus-auth-page`.
- No CSS (`src/index.css`), definir:
  - `background-image: linear-gradient(...), radial-gradient(...), url(...)`
  - `background-size: cover`
  - `background-position: center`
  - `background-repeat: no-repeat`
- **Importante:** o card já é “glass” e vai continuar idêntico. O overlay é aplicado no fundo do `main`.

---

### 3) Parallax leve (sem travar mobile)
Para “parallax” com custo baixo e sem JS pesado:
- Em telas maiores (desktop/tablet): usar `background-attachment: fixed` no container do /auth (dá sensação de profundidade).
- Em mobile: manter `background-attachment: scroll` (porque `fixed` pode engasgar em alguns aparelhos).

Opcional (se você quiser mais “surreal” depois):
- Parallax por mouse (desktop) com `transform: translate3d(...)` num pseudo-elemento, mas isso envolve JS e eu só faria se você pedir porque é mais delicado.

---

## Como eu vou validar com “prints” (antes de você aprovar visualmente)
1) Abrir a rota **/auth** (que você já está).
2) Capturar print em:
   - 390×844 (mobile)
   - 768×1024 e/ou 820×1180 (tablet)
   - 1366×768 ou 1440×900 (desktop)
3) Checklist visual:
   - Card dourado continua exatamente igual (sem alteração de cor/efeito).
   - Fundo ficou PB + executivo antigo + prédio + pessoas.
   - Intensidade sutil: dá clima, mas não compete com o card.
   - Parallax perceptível no desktop/tablet e não “quebra” no mobile.
   - Dialogs (convite / reset) continuam com o mesmo glass premium e legíveis.

---

## Arquivos que serão mexidos (escopo)
- `src/pages/Auth.tsx`
  - Apenas para adicionar/ajustar a classe do `<main>` (não mexer em Card/UI interna).
- `src/index.css`
  - Adicionar as regras CSS do background específico do Auth.
- Adicionar 1 asset de imagem no projeto (ex.: `src/assets/auth-bg.webp` ou `public/...`).

---

## Riscos / cuidados
- **Peso da imagem**: se ficar muito pesada, pode atrasar o carregamento. Vou otimizar para WEBP e manter o overlay ajudando a “disfarçar” compressão.
- **Legibilidade/performance**: por isso o overlay + parallax somente onde faz sentido.

---

## Entrega final esperada
- Tela de autenticação com um background PB cinematográfico (prédio + “executivos antigos”), com gradiente/overlay premium, e card Invictus intacto e dominante.
- Em desktop/tablet: parallax leve.
- Em mobile: mesmo visual, sem travamentos.

