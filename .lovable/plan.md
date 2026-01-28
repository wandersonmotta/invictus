
Objetivo
- Adicionar “Esqueceu a senha?” na tela principal de acesso (/auth) para que o usuário solicite um e-mail de recuperação e consiga definir uma nova senha.

O que já existe (base atual)
- Rota pública: /auth (login/cadastro).
- Rotas protegidas via RequireAuth.
- AuthProvider centraliza session/user/signIn/signUp/signOut.
- Toaster já está configurado para feedback.

Solução proposta (visão do usuário)
1) Na aba “Entrar” (/auth), abaixo do botão “Entrar”, incluir um link “Esqueceu a senha?”
2) Ao clicar, abrir um modal simples pedindo o e-mail.
3) Ao enviar, mostrar confirmação (“Se este e-mail existir, você receberá um link...”) e disparar o envio do e-mail de recuperação.
4) O link do e-mail leva para uma nova página do app (ex.: /reset-password) onde o usuário define a nova senha.
5) Após salvar a nova senha, o usuário é redirecionado para o app (ou para /auth) com toast de sucesso.

Mudanças de frontend (arquivos)
A) src/auth/AuthProvider.tsx
- Adicionar uma função no contexto:
  - resetPassword(email: string): Promise<{ error: Error | null }>
- Implementação (conceito):
  - validar/normalizar e-mail no callsite (UI) e aqui apenas chamar o backend
  - usar “redirectTo” para apontar para a página nova do app:
    - `${window.location.origin}/reset-password`
  - chamar o método de recuperação de senha do sistema de autenticação (backend Lovable Cloud).
- Motivo: manter padrão (AuthPage chama ações via useAuth).

B) src/pages/Auth.tsx
- Na aba “login”:
  - Inserir link “Esqueceu a senha?” (estilo texto pequeno, alinhado à direita ou central).
  - Ao clicar, abrir um Dialog (Radix/shadcn já existe no projeto) com:
    - Input de e-mail
    - Botões “Cancelar” e “Enviar link”
- Validação:
  - usar zod para validar e-mail (mesmo padrão do formulário atual)
  - limite de tamanho (ex.: max 255) e trim
- UX/Segurança:
  - Mensagem neutra (não revelar se o e-mail existe ou não).
  - Loading state no botão e bloquear múltiplos envios rápidos.
  - Toast de sucesso/erro (erro: exibir mensagem amigável).

C) Nova página: src/pages/ResetPassword.tsx (ou nome equivalente)
- Nova rota pública: /reset-password
- UI:
  - Card no mesmo estilo do AuthPage (invictus-surface/invictus-frame)
  - Campos:
    - Nova senha
    - Confirmar nova senha
  - Regras:
    - mínimo 8 caracteres
    - confirmação deve bater
- Lógica:
  - Ao abrir, verificar se existe sessão de “recuperação” ativa (o link do e-mail normalmente autentica temporariamente o usuário para permitir update da senha).
  - Se não houver sessão válida, mostrar instrução: “Abra o link do e-mail novamente” + botão para voltar ao /auth.
  - Ao submeter:
    - chamar update de senha no backend de autenticação
    - toast “Senha atualizada”
    - redirecionar para “/” (ou /auth, dependendo do comportamento desejado)
- Edge cases:
  - link expirado
  - usuário abre /reset-password manualmente sem ter clicado no e-mail

D) src/App.tsx
- Adicionar rota pública:
  - <Route path="/reset-password" element={<ResetPasswordPage />} />
- Garantir que ela fique fora do RequireAuth (como /auth).

Configuração necessária no backend (Lovable Cloud)
- O envio de e-mail de recuperação depende do provedor de e-mail do sistema de autenticação.
- O redirecionamento precisa aceitar a URL:
  - Preview: https://...lovable.app/reset-password
  - Published: https://invictusfraternity.lovable.app/reset-password
- Se houver erro do tipo “requested path is invalid” ou redirecionar errado, ajustar URLs permitidas no painel do backend (Lovable Cloud).

Critérios de aceite (testes)
1) Em /auth (aba Entrar), link “Esqueceu a senha?” aparece e abre modal.
2) Enviar e-mail válido mostra toast de confirmação e não trava a tela.
3) Usuário recebe e-mail e ao clicar cai em /reset-password.
4) Em /reset-password, definir nova senha funciona e redireciona com toast.
5) Rotas protegidas continuam exigindo login; /auth e /reset-password permanecem públicas.

Notas técnicas (para implementação rápida e consistente)
- Reutilizar componentes já existentes: Dialog, Button, Input, Label, Card, useToast.
- Não logar e-mail/senha no console.
- Manter mensagens em PT-BR e consistentes com as existentes (“Não foi possível…”, etc.).
