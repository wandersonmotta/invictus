
Objetivo (o que você pediu)
- Na tela de login (/auth), o “Tenho um convite” deve ficar “no lugar do antigo Criar conta”, mas você уточou que não é abaixo do “Entrar” e sim AO LADO.
- Ao clicar, deve abrir o mesmo modal de convite (código + e-mail + senha) e seguir o fluxo atual.
- O estilo precisa estar alinhado ao tema: dourado forte com destaque no hover (“gold”).

O que existe hoje
- Em `src/pages/Auth.tsx`, o botão “Entrar” é full-width.
- O “Tenho convite” hoje é um link pequeno embaixo, na linha do “Esqueceu a senha?” (linhas ~202–217).
- O modal de convite já está pronto e funciona via `setInviteOpen(true)` e `auth-signup-with-invite`.

Mudança de UX (como vai ficar)
- Substituir o bloco do botão “Entrar” por uma área com 2 ações principais:
  - “Entrar” (submit)
  - “Tenho um convite” (button)
- Responsividade:
  - Mobile: os botões ficam empilhados (1 coluna), com toque grande (h-11).
  - Desktop (a partir de sm): ficam lado a lado (2 colunas, 50/50).
- Embaixo, deixar apenas “Esqueceu a senha?” como link discreto (sem “Tenho convite” ali, para não duplicar).

Estilo “gold” no botão “Tenho um convite”
- Manter o botão como variante secundária (base `outline` para não competir com o “Entrar”), mas com comportamento premium:
  - `className` com `group` para permitir hover effects.
  - Borda/halo e fundo mais “dourado” ao passar o mouse (usando os tokens do tema: `--primary`, `--gold-hot`, `--gold-soft`).
  - O texto do botão vai usar o componente existente `GoldHoverText` para criar o brilho dourado que segue o mouse (já implementado em `src/components/GoldHoverText.tsx`).
- Resultado: o botão continua “secundário”, mas com o destaque dourado que você descreveu.

Passos técnicos (implementação)
1) Editar `src/pages/Auth.tsx`
   - Importar `GoldHoverText` (se ainda não estiver importado).
   - Trocar:
     - o `<Button type="submit" className="w-full h-11">Entrar</Button>`
     - + o bloco `<div className="flex items-center justify-between">...Tenho convite...Esqueceu a senha...</div>`
   - Por:
     - Um container `div` com `className="grid gap-3 sm:grid-cols-2"` contendo:
       - Botão “Entrar” (`type="submit"`, `className="h-11 w-full"`)
       - Botão “Tenho um convite” (`type="button"`, `onClick={() => setInviteOpen(true)}`, `className="h-11 w-full group ..."`), com label usando `<GoldHoverText>Tenho um convite</GoldHoverText>`
     - Abaixo disso, um link único “Esqueceu a senha?” centralizado ou alinhado (mantendo a mesma função `setResetOpen(true)`).
   - Remover o antigo link “Tenho convite” da parte inferior.

2) Verificações rápidas pós-mudança
   - /auth:
     - Mobile: “Entrar” e “Tenho um convite” aparecem um abaixo do outro.
     - Desktop: aparecem lado a lado.
   - Hover no desktop:
     - “Tenho um convite” ganha destaque dourado (texto com brilho).
   - Clique em “Tenho um convite”:
     - Abre o modal de convite como antes.
   - “Esqueceu a senha?”:
     - Continua funcionando e abre o modal de reset.

Arquivos que serão alterados
- `src/pages/Auth.tsx` (somente UI/posicionamento e estilo do botão; sem mudanças no backend)

Riscos / cuidados
- Baixo risco: é apenas ajuste visual.
- Cuidado para não deixar os dois botões “primários” competindo; por isso o convite ficará outline + gold hover.
