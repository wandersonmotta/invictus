
Objetivo
- Fazer a tela `/reset-password` ficar com o mesmo padrão visual da tela `/auth`: mesma imagem de fundo, mesmo “detalhe dourado” (moldura gold), e o texto “FRATERNIDADE” no cabeçalho, mantendo o conteúdo e as regras específicas de redefinição de senha (sessão de recovery, formulário, validações e mensagens).

O que está acontecendo hoje (diagnóstico)
- `/auth` já usa:
  - `main` com classe `invictus-auth-page` (aplica a imagem e overlays do fundo).
  - `Card` com `invictus-auth-surface invictus-auth-frame` (moldura dourada premium).
  - Cabeçalho com logo + `GoldHoverText` “FRATERNIDADE”.
- `/reset-password` hoje usa:
  - `main` sem `invictus-auth-page` (por isso não tem a mesma imagem/fundo).
  - `Card` com `invictus-surface invictus-frame` (não tem o detalhe dourado do auth).
  - Cabeçalho só com logo + título (falta “FRATERNIDADE” e o padrão do auth).

Mudanças que vou fazer (frontend)
1) Aplicar o mesmo fundo do auth na tela de reset
- Arquivo: `src/pages/ResetPassword.tsx`
- Trocar o wrapper:
  - De: `<main className="min-h-svh grid place-items-center p-4 sm:p-6">`
  - Para: `<main className="invictus-auth-page min-h-svh grid place-items-center p-4 sm:p-6">`
- Resultado: a tela de reset passa a usar a mesma imagem e overlays definidos em `src/styles/invictus-auth.css`.

2) Aplicar o mesmo “detalhe dourado” (moldura) do auth
- Arquivo: `src/pages/ResetPassword.tsx`
- Trocar classes do Card:
  - De: `invictus-surface invictus-frame ... border-border/70`
  - Para: `invictus-auth-surface invictus-auth-frame ... border-0`
- Resultado: mesma moldura dourada e estética “glass premium” da tela de autenticação.

3) Replicar o cabeçalho da marca (logo + “FRATERNIDADE”) na tela de reset
- Arquivo: `src/pages/ResetPassword.tsx`
- Importar e usar `GoldHoverText` igual ao `/auth`.
- Ajustar o header para ficar no mesmo padrão:
  - Logo em uma coluna com “FRATERNIDADE” embaixo (tracking forte), como no auth.
  - Manter o conteúdo específico da página:
    - Título “Redefinir senha”
    - Descrição “Escolha uma nova senha para sua conta.”
- Resultado: mantém a identidade visual completa e ainda deixa claro que é a tela de redefinição.

4) Garantir consistência visual nos estados “sem sessão” e “carregando”
- Arquivo: `src/pages/ResetPassword.tsx`
- Manter a lógica atual (está correta), apenas garantindo que textos/botões não “fujam” do padrão:
  - O botão “Voltar para o acesso” continua levando para `/auth`.
  - Sem mudança de regras de segurança/autenticação.

O que NÃO vou mudar (para não quebrar o fluxo)
- Não vou alterar a lógica de `supabase.auth.updateUser(...)`, nem a validação com zod, nem a regra de “precisa ter sessão de recovery”.
- Não vou mexer na rota (já está correta em `src/App.tsx`).
- Não vou mexer no envio de e-mail (já ajustado e testado).

Critérios de pronto (o que você vai ver)
- Em `/reset-password`, o fundo (imagem + overlays) será idêntico ao `/auth`.
- O card terá a moldura dourada sempre visível (mesma do auth).
- O cabeçalho terá logo + “FRATERNIDADE” e, ao lado, “Redefinir senha” com a descrição.
- O formulário e o comportamento de redefinição continuam exatamente como estão.

Checklist de teste (end-to-end)
1) Abrir `/auth` → “Esqueceu a senha?” → enviar link.
2) Abrir o link no e-mail → confirmar que cai em `/reset-password`.
3) Confirmar visual: fundo + detalhe dourado + “FRATERNIDADE”.
4) Trocar senha → confirmar toast de sucesso → validar login com a nova senha.

Arquivos que vou alterar
- `src/pages/ResetPassword.tsx` (principal)
