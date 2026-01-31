
Objetivo
- Manter a landing pública em `invictusfraternidade.com.br` (e/ou `www.invictusfraternidade.com.br`)
- Mover toda a experiência “não-landing” para `app.invictusfraternidade.com.br`, incluindo:
  - Login (/auth)
  - Recuperação de senha (/reset-password)
  - Área logada (/app, /feed, /mapa, etc.)
- “Forçar tudo no app”: qualquer tentativa de abrir rotas de app/auth no domínio raiz deve redirecionar para o subdomínio `app.`

Importante (limite/realidade da plataforma)
- A plataforma não tem um recurso “nativo” de separar rotas por subdomínio automaticamente.
- O jeito correto (e que funciona bem) é: conectar também o subdomínio `app.` ao MESMO projeto e, no frontend, decidir o que mostrar/redirecionar com base no hostname (domínio acessado).

O que já existe hoje (baseado no código)
- Rotas:
  - Landing: `/` (componente `Landing`)
  - Auth: `/auth`, `/reset-password`
  - App: `/app`, `/feed`, `/mapa`, etc. (protegidas por `RequireAuth`)
- Atualmente a landing tenta redirecionar usuários com sessão para `/app`:
  - `src/pages/Landing.tsx` tem `if (session) navigate("/app")`
  - Com a separação por subdomínio, isso deixa de fazer sentido (sessão não é compartilhada entre domínios), então vamos ajustar.

Plano de implementação (mesmo projeto, “forçar tudo no app”)

1) Configuração de domínios (sem mexer no código ainda)
1.1) Conectar o subdomínio do app ao mesmo projeto
- Em Settings → Domains:
  - Garantir que `invictusfraternidade.com.br` está conectado (já está)
  - Adicionar e conectar `app.invictusfraternidade.com.br`
  - (Opcional, mas recomendado) Conectar também `www.invictusfraternidade.com.br` se vocês usam www
- DNS:
  - Criar o registro (A ou CNAME conforme o assistente de domínio do Lovable pedir) para `app` apontando para o Lovable, igual ao root/www.
- Resultado esperado:
  - O mesmo build do site responde tanto no root quanto no `app.`

1.2) Configurar redirecionamentos/URLs permitidas do sistema de autenticação (Lovable Cloud)
- Precisamos permitir redirecionamentos de autenticação e recuperação também para o `app.`.
- Ajustar nas configurações de autenticação:
  - Site URL: `https://app.invictusfraternidade.com.br` (recomendado, já que “tudo no app”)
  - Redirect URLs allowlist: incluir pelo menos:
    - `https://app.invictusfraternidade.com.br/*`
    - (opcional) `https://invictusfraternidade.com.br/*` e/ou `https://www.invictusfraternidade.com.br/*` se quiser robustez
- Isso é crítico para evitar links de reset quebrados ou bloqueados por redirect não permitido.

2) Mudanças de código (roteamento por hostname)
2.1) Criar um “modo” por domínio
- No `src/App.tsx`, detectar:
  - `isAppHost = hostname começa com "app."`
  - `isRootHost = !isAppHost` (inclui root e www)
- Criar helpers simples:
  - `getAppOrigin()` que monta o origin do app a partir do host atual:
    - Se já está no `app.`: retorna `window.location.origin`
    - Se está em `www.`: troca para `app.` + domínio sem `www.`
    - Se está no root: retorna `https://app.` + hostname atual
  - `redirectToApp(pathname)` que faz `window.location.assign(appOrigin + pathname + search + hash)` para trocar domínio de verdade (React Router não troca domínio).

2.2) Forçar regras de roteamento conforme domínio (sem “tela carregando”)
- No domínio raiz:
  - Permitir apenas a landing em `/`
  - Qualquer outra rota (ex.: `/auth`, `/app`, `/feed`, `/mapa`, etc.) deve redirecionar para o `app.` preservando path/query
- No domínio app:
  - Não permitir landing em `/`:
    - Se entrar em `https://app.../`, redirecionar para:
      - `/app` se tiver sessão (ou apenas mandar pra `/auth` e deixar o `RequireAuth` lidar)
    - Para “forçar tudo no app”, o mais consistente é:
      - `/` no app -> `/app` (e o RequireAuth leva pra /auth se não logado)

Como implementaremos isso tecnicamente no Router
- Introduzir componentes leves:
  - `<RedirectToApp />` (só faz `useEffect(() => window.location.assign(...))` e retorna `null`)
  - `<RedirectToRoot />` (opcional; em geral não precisamos, pois queremos “forçar tudo no app”, não o contrário)
- Ajustar rotas em `src/App.tsx`:
  - Rota `/`:
    - Se `isAppHost`: element = `<Navigate to="/app" replace />`
    - Se root: element = `<Landing />`
  - Rotas `/auth` e `/reset-password`:
    - Se root: element = `<RedirectToApp />` (para `/auth` e `/reset-password`)
    - Se app: element = páginas reais (`<AuthPage />`, `<ResetPasswordPage />`)
  - Rotas de app (`/app`, `/feed`, `/mapa`, etc.):
    - Se root: element = `<RedirectToApp />` para o mesmo path
    - Se app: mantém como está hoje (com `RequireAuth`)

2.3) Ajustar a landing para não depender de sessão (evitar comportamento confuso)
- Em `src/pages/Landing.tsx`:
  - Remover o `useAuth()` e o `useEffect` que redireciona quando `session` existe.
  - Motivo:
    - A sessão não vai existir no root (porque o login estará no `app.` e o storage é por origem)
    - E mesmo que exista, a regra de produto agora é: root sempre landing; app sempre app.

2.4) Garantir que links e CTAs levem para o subdomínio app
- Encontrar botões/links da landing que levam para “Entrar” e ajustar para apontar diretamente para:
  - `https://app.invictusfraternidade.com.br/auth`
- Isso evita qualquer navegação intermediária no root.
- Onde ajustar:
  - `src/components/landing/LandingTopbar.tsx` (provável botão “Entrar”)
  - `src/components/landing/WaitlistHero.tsx` (se tiver CTA)
  - Qualquer outro CTA de login

3) Ajustes de autenticação para links de e-mail (reset / convites)
3.1) Atualizar URLs usadas no envio de e-mails (frontend)
- Hoje, `src/auth/AuthProvider.tsx` usa `window.location.origin` para:
  - `signUp`: `emailRedirectTo = origin + "/"` (pós-confirmação)
  - `resetPassword`: `redirectTo = origin + "/reset-password"`
- Com “tudo no app”, o correto é sempre gerar links para o `app.`:
  - `emailRedirectTo = appOrigin + "/auth"` ou `appOrigin + "/app"` (definiremos o melhor UX)
  - `redirectTo = appOrigin + "/reset-password"`
- Implementação:
  - Reusar `getAppOrigin()` (ou criar um helper em `src/lib/` para não duplicar)
  - Trocar `window.location.origin` por `getAppOrigin()` nesses dois pontos.

3.2) Conferir a função de envio de reset (backend function)
- A função `send-password-reset` recebe `redirectTo` via body e deve continuar funcionando.
- Vamos validar rapidamente se ela não “força” domínio por trás.
- Se houver alguma validação de allowlist, ela será resolvida no passo 1.2 (Redirect URLs permitidas).

4) Testes que vamos fazer (obrigatórios)
4.1) Testes no domínio raiz (landing)
- Acessar `https://invictusfraternidade.com.br/`:
  - Deve mostrar landing
- Acessar manualmente:
  - `https://invictusfraternidade.com.br/auth` -> deve redirecionar para `https://app.invictusfraternidade.com.br/auth`
  - `https://invictusfraternidade.com.br/app` -> deve redirecionar para `https://app.invictusfraternidade.com.br/app`
  - `https://invictusfraternidade.com.br/reset-password` -> deve redirecionar para o app

4.2) Testes no subdomínio app (autenticação)
- Acessar `https://app.invictusfraternidade.com.br/`:
  - Deve redirecionar para `/app` (e, se não logado, o `RequireAuth` manda para `/auth`)
- Fluxo login:
  - Abrir `/auth`, logar, validar que cai em `/app`
- Fluxo reset:
  - Em `/auth`, “Esqueceu a senha?”, enviar e-mail
  - Link do e-mail deve abrir em `https://app.../reset-password`
  - Definir nova senha e confirmar login

4.3) Testes em mobile
- Repetir login e reset no mobile para garantir que não há loop de redirecionamento.
- Verificar que não surge nenhuma “tela carregando”/fallback (ainda estamos com `Suspense fallback={null}`).

5) Impactos e cuidados (para você estar ciente)
- Sessão não “atravessa” root ↔ app (isso é esperado e OK).
- Landing não vai mais auto-redirecionar para /app quando você estiver logado, porque o root vira “site público” mesmo.
- SEO/marketing: root fica limpo (bom). O app fica separado (bom para privacidade).
- Garantir que `app.` esteja com SSL ativo e verificado (a própria conexão de domínio cuida disso).

Arquivos que provavelmente serão alterados
- `src/App.tsx` (roteamento por hostname + redirects cross-domain)
- `src/pages/Landing.tsx` (remover redirect por sessão)
- `src/auth/AuthProvider.tsx` (gerar links de e-mail sempre para `app.`)
- `src/components/landing/LandingTopbar.tsx` (CTA “Entrar” para `app.../auth`)
- (Possíveis) outros componentes da landing com CTA de login

Checklist de pronto (definição de “feito”)
- Landing só no domínio raiz
- `/auth` e `/reset-password` só no subdomínio app
- Qualquer rota de app/auth no root redireciona para o app automaticamente
- Links de e-mail de recuperação abrem e funcionam no subdomínio app
- Sem telas de “Carregando…” em navegação

Dependências/ações necessárias do seu lado (rápidas)
- Conectar o domínio `app.invictusfraternidade.com.br` no Settings → Domains
- Ajustar allowlist de Redirect URLs na autenticação do Lovable Cloud para incluir o `app.`

Se você aprovar este plano, eu implemento as mudanças no código e te guio nos 2 passos de configuração (domínios + redirects) para ficar 100% funcionando.