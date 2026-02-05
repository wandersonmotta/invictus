
Objetivo: corrigir (1) tela 404 após tentar entrar no financeiro (o que dá a impressão de “sumiu o botão Entrar”) e (2) travas/redirects indevidos causados pelo guard de autenticação geral exigir “perfil aprovado/completo” para usuários do financeiro.

Diagnóstico (com base no código atual e no print)
- O print mostra claramente a página 404.
- Em `src/pages/financeiro/FinanceiroAuth.tsx`, após login bem-sucedido, o código faz `navigate("/dashboard")`.
  - Em ambiente Lovable (preview), o dashboard financeiro existe em `/financeiro/dashboard`, não em `/dashboard` (ver `HostRouter.tsx`).
  - Resultado: login funciona, mas ao redirecionar para `/dashboard`, cai em NotFound (404). Daí o usuário volta e “parece que não tem botão”, quando na prática ele está sendo jogado para uma rota inexistente.
- Além disso, as rotas financeiras em preview e em subdomínio financeiro estão envoltas por `<RequireAuth>` (o guard geral).
  - `RequireAuth.tsx` hoje consulta `profiles` e impõe regras de “perfil completo” + “approved/pending”.
  - Para um usuário financeiro (auditor), isso pode não existir/ não fazer sentido e pode causar redirects para `/perfil` ou `/aguardando-aprovacao`, quebrando o fluxo do financeiro.

Mudanças propostas (sequência recomendada)

1) Corrigir o redirect pós-login no FinanceiroAuth (causa principal do 404)
Arquivo: `src/pages/financeiro/FinanceiroAuth.tsx`
- Importar `isLovableHost` (já existe em `@/lib/appOrigin`).
- Trocar o `navigate("/dashboard")` por uma rota “context-aware”:
  - Se estiver em ambiente Lovable (preview): `navigate("/financeiro/dashboard")`
  - Se estiver em subdomínio `financeiro.` (produção): `navigate("/dashboard")`
- (Opcional, mas recomendado) respeitar `location.state.from` quando existir (se o usuário foi redirecionado para login ao tentar acessar alguma rota do financeiro). Assim o login volta exatamente para a página tentada.

2) Criar um guard de autenticação específico do Financeiro (para não exigir perfil/aprovação)
Problema: `RequireAuth` está acoplado ao conceito de “membro com perfil” e isso não deve bloquear o back-office financeiro.
Opção A (mais limpa): criar um novo guard
- Criar componente `RequireFinanceiroAuth` (ou `RequireSession`) que:
  - Só verifica sessão (logado ou não)
  - Se não houver sessão, redireciona para a tela de login do financeiro:
    - Lovable preview: `/financeiro/auth`
    - Subdomínio financeiro: `/auth`
  - Não consulta `profiles` e não aplica regras de “approved/pending”.
- Depois, atualizar `HostRouter.tsx` para usar esse guard nas rotas financeiras, no lugar de `<RequireAuth>`.
  - Exemplo (preview):
    - `/financeiro/dashboard`:
      - `<RequireFinanceiroAuth><RequireFinanceiro> ... </RequireFinanceiro></RequireFinanceiroAuth>`
    - `/financeiro/auditoria/:withdrawalId` idem
  - Exemplo (financeiro subdomínio):
    - `/dashboard` e `/auditoria/:withdrawalId` idem

Opção B (mais rápida, mas menos elegante): alterar `RequireAuth` para “bypass” no financeiro
- Modificar `RequireAuth.tsx` para detectar:
  - `location.pathname.startsWith("/financeiro")` OU `isFinanceiroHost(window.location.hostname)`
- Se for contexto financeiro, `RequireAuth` apenas exige sessão e não roda a lógica de `profiles`.
- Eu recomendo a Opção A para manter responsabilidades separadas (membro vs auditor).

3) Melhorar definitivamente a visibilidade do botão “Entrar” em telas baixas (reforço)
Arquivo: `src/pages/financeiro/FinanceiroAuth.tsx`
- Hoje já foi adicionado `overflow-y-auto` no container externo, mas em algumas combinações (zoom alto, altura baixa, teclado aberto em mobile) ainda pode “cortar”.
- Ajustes robustos:
  - Aplicar um `max-height` no card (ex.: `max-h-[calc(100vh-3rem)]`) e `overflow-y-auto` no próprio card.
  - Garantir espaçamento inferior do formulário (ex.: `pb-2`/`pb-4`) para o botão não encostar no limite.
  - Evitar `items-center` quando o conteúdo precisa rolar: manter `justify-center` no container, mas permitir `my-auto` (já tem) e scroll interno do card.
Resultado: mesmo com teclado aberto, dá para rolar e alcançar o botão.

4) Verificação (teste)
- No preview (Lovable):
  1. Abrir `/financeiro/auth`
  2. Logar com usuário que tem role `financeiro`
  3. Confirmar que redireciona para `/financeiro/dashboard` (sem 404)
  4. Confirmar que o dashboard carrega sem forçar `/perfil` ou `/aguardando-aprovacao`
- No domínio real (subdomínio financeiro):
  1. Abrir `financeiro.<dominio>/auth`
  2. Logar e confirmar redirect para `/dashboard`
  3. Confirmar que rotas `/auditoria/:id` funcionam
- Re-testar em janela baixa/zoom 125% para garantir que o botão “Entrar” fica acessível via scroll.

Riscos e cuidados
- Alterar `RequireAuth` globalmente (Opção B) pode ter efeito colateral em rotas de membros. Por isso a separação (Opção A) é mais segura.
- Se o usuário financeiro também for membro e tiver perfil “pending”, o guard do financeiro não deve bloquear — esse é o comportamento desejado no back-office.

Entregáveis (o que vai mudar no código)
- `src/pages/financeiro/FinanceiroAuth.tsx`
  - Redirect pós-login corrigido para preview vs subdomínio
  - Ajuste de layout do card para garantir botão visível
- `src/auth/RequireFinanceiroAuth.tsx` (novo) OU alteração controlada em `src/auth/RequireAuth.tsx`
- `src/routing/HostRouter.tsx`
  - Troca do guard nas rotas do financeiro para o guard correto

Critério de sucesso
- “Entrar” aparece (ou é alcançável com scroll) em qualquer resolução/zoom.
- Após login no preview, nunca cai em 404; vai para `/financeiro/dashboard`.
- Rotas financeiras não exigem perfil aprovado/completo; apenas login + role `financeiro`.
