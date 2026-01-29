
Objetivo
- Na tela **/perfil**, adicionar um bloco “Alterar senha” com 3 campos:
  1) Senha atual
  2) Nova senha
  3) Repetir nova senha
- Validar tudo no cliente (zod + react-hook-form) e executar a troca com segurança via autenticação do backend.

O que já existe e como vamos reaproveitar
- Já existe a tela `src/pages/ResetPassword.tsx` que usa:
  - `zod` + `react-hook-form`
  - `supabase.auth.updateUser({ password })` (troca de senha)
  - `toast` para feedback
- Vamos reutilizar o mesmo padrão visual e de validação, só que dentro de `/perfil`.

Como a troca de senha vai funcionar (fluxo seguro)
1) Usuário digita a **senha atual** + **nova senha** + **confirmação**.
2) Antes de trocar a senha, o app faz uma “reconfirmação” da senha atual:
   - `supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })`
   - Isso garante que a senha atual está correta e também renova a sessão (muitos provedores exigem “login recente” para troca de senha).
3) Se a reconfirmação der certo, executar:
   - `supabase.auth.updateUser({ password: newPassword })`
4) Mostrar toast de sucesso e limpar os campos do formulário.

Validações (client-side) e mensagens
- Senha atual: obrigatória (min 1, ou min 8 se você quiser manter padrão)
- Nova senha: mínimo 8 caracteres (mantendo o padrão do app)
- Confirmar nova senha: precisa ser igual à nova senha
- Extras que vou incluir para evitar erros comuns:
  - Bloquear submit enquanto estiver salvando
  - Mensagens claras:
    - “Senha atual incorreta”
    - “Não foi possível atualizar a senha: …”

Onde ficará no layout do Perfil
- `src/pages/Perfil.tsx`
  - Abaixo do `ProfileForm` e acima/antes do card de “Sessão” (ou logo após “Sessão”, dependendo do seu gosto visual).
  - Será um `Card` seguindo o padrão `invictus-surface invictus-frame border-border/70` para manter a estética consistente.

Implementação (arquivos)
1) Criar componente novo:
   - `src/components/profile/ChangePasswordCard.tsx`
   - Conteúdo:
     - Form com 3 Inputs type="password"
     - Schema zod (nova senha + confirmação) e campo de senha atual
     - Chamadas:
       - `supabase.auth.signInWithPassword(...)`
       - `supabase.auth.updateUser(...)`
     - `useToast()` para feedback
     - Reset do form em sucesso

2) Integrar no Perfil:
   - `src/pages/Perfil.tsx`
   - Renderizar `<ChangePasswordCard />` quando `user?.email` existir.
   - Se por algum motivo não tiver email, mostrar uma mensagem “Sua conta não suporta troca de senha aqui” (fallback seguro).

Edge cases importantes que vou tratar
- Usuário sem `user.email` (raro, mas possível dependendo do provedor): não mostrar o form.
- Erro de credenciais ao reautenticar: mostrar toast específico e não tentar atualizar.
- Erro “requires recent login”: o fluxo de reconfirmação tende a evitar isso; se ainda acontecer, mostrar instrução para sair/entrar e tentar novamente.
- Garantir que não logamos senha em console (nunca).

Checklist de validação manual (você)
- Em `/perfil`, testar:
  - senha atual errada => erro claro
  - nova senha diferente da confirmação => validação no formulário
  - troca com sucesso => toast + campos limpam
- Testar no mobile (layout e teclado).

Sem mudanças no banco de dados
- Isso é puramente autenticação; não precisa migration nem alteração de tabelas/RLS.
