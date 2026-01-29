
Objetivo
- Deixar o “quadrado” (Card) da tela de autenticação (/auth) com um visual mais “premium”: glassmorphism mais intenso e contorno dourado bem chamativo, com brilho sofisticado (clean e robusto).
- Manter a identidade “Grafite Premium” (neutro, sem azul) e acentos em dourado.

O que existe hoje (diagnóstico rápido)
- A tela `/auth` usa um `<Card className="invictus-surface invictus-frame ...">`.
- O glass atual já existe via `.invictus-surface` e a moldura via `.invictus-frame` em `src/index.css`, porém está mais discreta e não “grita premium”.
- Os modais (“Tenho um convite” e “Recuperar acesso”) usam `DialogContent` com as mesmas classes, então se ajustarmos só o Card, pode ficar inconsistente.

Decisão de implementação (para não afetar o resto do app)
- Em vez de alterar `.invictus-frame` global (isso mudaria vários cards do app), vou criar uma variante específica apenas para autenticação, por exemplo:
  - `.invictus-auth-surface` (glass mais intenso e elegante)
  - `.invictus-auth-frame` (contorno dourado premium + glow controlado)
- Aplicar essas classes somente no `/auth` (Card principal e Dialogs), mantendo o resto do app intacto.

Mudanças planejadas (arquivos)
1) `src/index.css` (novas classes premium para auth)
- Criar classes no `@layer components`:
  - `.invictus-auth-surface`
    - vidro mais “cristal”: aumentar levemente blur e adicionar saturate (sem exagerar para não pesar no mobile)
    - ajustar gradiente do fundo para parecer mais profundo e luxuoso
  - `.invictus-auth-frame`
    - “contorno dourado chamativo” com:
      - linha externa dourada (box-shadow 0 0 0 1px com `--gold-hot` alto)
      - glow dourado suave (ex.: 0 0 30–60px -20px em `--gold-hot`)
      - inset highlight para sensação de peça “lapidada”
    - manter bordas arredondadas consistentes com o design system
- (Opcional) criar uma “aura” no hover apenas para desktop (min-width 768px) para sensação premium sem poluir o mobile.

2) `src/pages/Auth.tsx` (aplicar as classes novas)
- No `<Card ...>` principal:
  - substituir `invictus-surface invictus-frame` por `invictus-auth-surface invictus-auth-frame`.
- Nos `<DialogContent ...>` (Convite e Reset):
  - aplicar as mesmas classes para ficar consistente (mesmo “produto premium”).
- Se necessário, ajustar `border-border/70` para não competir com o dourado (podemos remover o border do Card e deixar só a moldura premium via box-shadow).

Ajustes finos (para ficar sofisticado e clean)
- Dourado “bem chamativo” sem parecer neon:
  - usar `--gold-hot` com opacidade alta no contorno (0.75–0.95)
  - glow maior porém suave (blur alto e alpha baixo), para parecer “luz refletida”, não “borda pintada”.
- Glass mais premium:
  - aumentar contraste do gradiente interno e um leve “specular highlight” (via inset shadow).
  - manter blur em 18–20px (já alinhado ao seu padrão), e adicionar `saturate(120%)` em telas maiores.

Teste (o que validar depois)
- Verificar no `/auth`:
  - O Card está mais “glass”, com contorno dourado premium bem evidente.
  - Os modais (convite/reset) mantêm a mesma linguagem visual.
  - A legibilidade do texto continua ótima (especialmente “Acesso exclusivo para membros” e labels).
- Verificar em mobile (performance e legibilidade).

Observação (para você economizar tempo no futuro)
- Esse tipo de ajuste visual (cores, bordas, sombras e glass) também dá para fazer via Visual Edits em elementos estáticos, sem gastar créditos. Depois que eu aplicar a estrutura correta (classes), você poderá ajustar micro-detalhes bem rápido por lá.

Implementação estimada (rápida)
- 1 alteração em CSS (novas classes)
- 1 alteração em `Auth.tsx` (aplicar classes no Card e DialogContent)
