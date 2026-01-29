
Objetivo (o que você pediu)
- Na área de autenticação (/auth) não deve existir a aba “Criar conta”.
- A criação de conta só acontece para quem tiver um convite (vários códigos).
- Depois de criar conta com convite, o usuário não terá acesso total: terá acesso limitado até um admin aprovar.
- Admin inicial: definido por lista de e-mails (de forma segura, no backend, não no front-end).

Estado atual (o que encontrei no projeto)
- `src/pages/Auth.tsx` hoje tem Tabs com “Entrar” e “Criar conta” e chama `signUp()` diretamente.
- `src/auth/AuthProvider.tsx` tem `signUp(email, password)` chamando o auth padrão.
- `RequireAuth` só checa “tem sessão”; não valida “usuário aprovado”.
- Há tabela e função de roles (`user_roles`, `has_role`) já prontas e usadas no `Admin.tsx`.
- Não existe tabela/fluxo de convites hoje (nenhum `INV-2026` implementado no banco/código; era só uma memória/requisito).

Decisões confirmadas (suas respostas)
- Convite: Vários códigos
- Aprovação: Acesso limitado
- Admin inicial: Por lista de e-mails

Solução proposta (visão do usuário)
1) Tela /auth
- Mostra apenas “Entrar”.
- Em vez de aba “Criar conta”, terá um botão/link “Tenho convite” que abre um modal (ou um “card” abaixo) com:
  - Código do convite
  - E-mail
  - Senha
  - Botão “Criar conta”
- Esse “Criar conta” não vai usar o `signUp` direto; vai chamar um endpoint do backend para criar a conta somente se o convite for válido.

2) Fluxo de convite
- Admin cria convites no painel Admin (nova seção “Convites”).
- Usuário usa convite em /auth → conta é criada.
- Após o login, se ainda não estiver aprovado:
  - O usuário entra, mas fica em modo “Acesso limitado” (ex.: só Perfil + uma tela “Aguardando aprovação” para as demais rotas).
  - Um admin aprova no painel Admin (nova seção “Aprovações”).
  - Depois de aprovado, acesso normal.

Mudanças de backend (banco + regras de acesso)
A) Ajuste na tabela profiles (status de aprovação)
- Adicionar campos em `public.profiles`:
  - `access_status` (ex.: 'pending' | 'approved' | 'rejected') com default 'pending'
  - `approved_at` timestamptz (nullable)
  - `approved_by` uuid (nullable) — referência lógica ao user_id do admin (sem FK para auth)
- Atualizar RLS de `profiles`:
  - Usuário continua podendo ver/editar apenas o próprio perfil (como já é hoje).
  - Admin pode:
    - listar perfis (para aprovar)
    - atualizar perfis (mudar status para approved, preencher approved_at/approved_by)
  - Importante: roles continuam em `user_roles` (não colocaremos role no profile).

B) Tabelas de convites
Criar tabelas:
1) `public.invite_codes`
- `id uuid primary key default gen_random_uuid()`
- `code text unique not null` (ex.: INV-XXXXXX)
- `created_at timestamptz default now()`
- `created_by uuid nullable` (user_id do admin)
- `active boolean not null default true`
- `expires_at timestamptz nullable`
- `max_uses int not null default 1`
- `uses_count int not null default 0`
- `note text nullable` (opcional: “convite do João”)

2) `public.invite_redemptions`
- `id uuid primary key default gen_random_uuid()`
- `invite_id uuid not null references public.invite_codes(id) on delete cascade`
- `user_id uuid not null` (id do usuário autenticado)
- `redeemed_at timestamptz default now()`
- `unique(invite_id, user_id)`

Regras (RLS) para convites
- `invite_codes`:
  - SELECT/INSERT/UPDATE/DELETE: apenas admin (via `has_role(auth.uid(), 'admin')`)
- `invite_redemptions`:
  - INSERT: apenas o próprio usuário autenticado (para registrar que usou o convite) OU feito via backend function.
  - SELECT: admin pode ver tudo; usuário pode ver as próprias redemptions.

Validação de uso do convite
- Evitar CHECK constraints com `now()` (para não quebrar por imutabilidade). Se precisarmos validar expiração no banco, faremos por trigger/funcão; porém a validação principal ficará no backend function (mais simples e seguro).

Mudanças de backend functions (para garantir “sem convite, sem conta”)
1) Backend function: `auth-signup-with-invite`
- Input: `{ email, password, inviteCode }`
- Validações (server-side):
  - formato do email, tamanho de senha, formato do código
  - convite existe, `active = true`, não expirado, `uses_count < max_uses`
- Ação:
  - cria o usuário via credencial privilegiada do backend (não pelo client)
  - cria/garante profile com `access_status='pending'`
  - incrementa `uses_count` e registra em `invite_redemptions`
- Output:
  - sucesso + instrução de “faça login” (ou já retornar sessão se suportado; se não, manter login na tela)

2) Backend function: `bootstrap-admin-by-email` (admin inicial por lista de e-mails)
- Motivo: não pode ser front-end/hardcoded/localStorage.
- Vai comparar `user.email` com uma lista segura guardada em Secret (ex.: `ADMIN_EMAIL_ALLOWLIST`).
- Se bater, insere `user_roles(user_id, 'admin')` (idempotente).
- Quando chamar:
  - no login (AuthProvider), após sessão existir, chamamos essa function 1x (sem travar UI).

Mudanças no front-end (UI/UX + guards)
A) AuthPage (/auth)
- Remover completamente a aba “Criar conta”.
- Manter o formulário “Entrar”.
- Adicionar:
  - botão/link “Tenho convite” → abre Dialog com formulário (inviteCode + email + password)
  - esse formulário chama a backend function `auth-signup-with-invite`
  - feedbacks:
    - convite inválido/expirado/usado → mensagem amigável
    - sucesso → avisar “conta criada, faça login” e fechar modal
- Manter o “Esqueceu a senha?” como está.

B) Guard de rotas para “Acesso limitado”
- Evoluir `RequireAuth` para também checar `profiles.access_status`.
- Comportamento:
  - se não logado → /auth
  - se logado e status = 'approved' → acesso normal
  - se logado e status != 'approved':
    - permitir rotas liberadas (definição abaixo)
    - bloquear outras → redirecionar para uma nova página `/aguardando-aprovacao` (ou reutilizar uma página existente)
- Rotas liberadas quando pendente (proposta):
  - `/perfil` (para completar dados)
  - `/auth` (para sair e entrar)
  - `/reset-password` (se necessário)
  - `/aguardando-aprovacao` (nova)
- Ajustar `src/App.tsx` para incluir a nova rota.

C) Admin: Convites + Aprovação
- Em `src/pages/Admin.tsx` (já tem tabs), adicionar novas seções:
  1) “Convites”
     - Criar convite: max_uses, expires_at (opcional), note (opcional)
     - Listar convites: code, ativo, usos, expiração, botão “desativar”
  2) “Aprovações”
     - Listar usuários pendentes:
       - buscar em `profiles` onde `access_status='pending'`
       - mostrar user_id, display_name (se existir), created_at
     - Ações:
       - “Aprovar” → set access_status='approved', approved_at=now(), approved_by=auth.uid()
       - “Rejeitar” (opcional) → access_status='rejected'

Como vamos configurar “admin por lista de e-mails” (sem risco)
- Criaremos uma Secret `ADMIN_EMAIL_ALLOWLIST` (string com e-mails separados por vírgula).
- A backend function `bootstrap-admin-by-email` lê essa secret e aplica role admin no servidor.
- Assim, mesmo que alguém tente se “dar admin” pelo front, não consegue.

Passo a passo de implementação (ordem)
1) Banco (schema)
- Criar migração:
  - adicionar campos de aprovação em `profiles`
  - criar `invite_codes` e `invite_redemptions`
  - criar/ajustar políticas RLS necessárias
2) Backend functions
- Implementar `auth-signup-with-invite`
- Implementar `bootstrap-admin-by-email`
- Adicionar a secret `ADMIN_EMAIL_ALLOWLIST`
3) Front-end /auth
- Remover aba “Criar conta”
- Criar modal “Tenho convite” + validação com zod
- Conectar ao backend function e tratar erros
4) Guard de acesso limitado
- Ajustar `RequireAuth` (ou criar `RequireApproved`) para checar `profiles.access_status`
- Criar página `/aguardando-aprovacao`
- Atualizar rotas no `App.tsx`
5) Admin
- Adicionar abas “Convites” e “Aprovações”
- Usar `has_role` (já existe) para garantir que só admin veja/execute
6) QA
- Testar fluxo completo:
  - usuário sem convite não consegue criar conta
  - convite válido cria conta
  - usuário pendente só acessa rotas liberadas
  - admin aprova e usuário passa a acessar tudo
  - convites respeitam max_uses/ativo/expiração

Riscos e cuidados
- Segurança: remover UI “Criar conta” não é suficiente; por isso o cadastro será movido para backend function com validação do convite.
- Evitar loops/travamentos no AuthProvider: qualquer chamada extra após login será feita fora do callback do `onAuthStateChange` (com defer) para não travar o app.
- Roles continuam exclusivamente em `user_roles` (não em profile).

O que vou precisar de você (antes de implementar)
- A lista de e-mails que devem ser admin no início (1–3 já resolve). Esses e-mails vão para a secret `ADMIN_EMAIL_ALLOWLIST` (ex.: `email1@... , email2@...`).
