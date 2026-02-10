# 🚀 Solução Rápida: Criar Usuário Manualmente no Supabase

## Opção 1: Via Dashboard do Supabase (MAIS RÁPIDO - 2 minutos)

### Passo 1: Criar o Usuário
1. Acesse: https://supabase.com/dashboard/project/krtjexfyixnhjehndyop
2. Vá em **Authentication** > **Users**
3. Clique em **Add user** > **Create new user**
4. Preencha:
   - **Email:** `wanderson.lealofc@icloud.com`
   - **Password:** `TemporaryPassword123!`
   - ✅ Marque **Auto Confirm User** (importante!)
5. Clique em **Create user**

### Passo 2: Configurar o Profile
1. Vá em **Table Editor** > **profiles**
2. Clique em **Insert** > **Insert row**
3. Preencha:
   - **user_id:** (selecione o UUID do usuário criado)
   - **display_name:** `Wanderson Mota`
   - **first_name:** `Wanderson`
   - **last_name:** `Mota`
   - **access_status:** `approved`
   - **profile_visibility:** `members`
   - **username:** `@wanderson`
4. Clique em **Save**

### Passo 3: Adicionar Permissão de Admin
1. Vá em **Table Editor** > **user_roles**
2. Clique em **Insert** > **Insert row**
3. Preencha:
   - **user_id:** (selecione o mesmo UUID)
   - **role:** `admin`
4. Clique em **Save**

### Passo 4: Fazer Login
1. Acesse: https://app.invictusfraternidade.com.br/auth
2. Login: `wanderson.lealofc@icloud.com`
3. Senha: `TemporaryPassword123!`

---

## Opção 2: Via SQL Editor (ALTERNATIVA)

Execute este SQL no **SQL Editor** do Supabase:

```sql
-- Passo 1: Pegar o service_role_key
-- Vá em Settings > API > service_role (secret)

-- Passo 2: Em Authentication > Configuration > Email Auth
-- Desmarque "Confirm email" temporariamente

-- Passo 3: Use o formulário de cadastro do próprio site
-- Acesse: https://app.invictusfraternidade.com.br/auth
-- Clique em "Tenho um convite"
-- Preencha o formulário de cadastro

-- Passo 4: Após criar, execute este SQL para aprovar e tornar admin:
UPDATE public.profiles
SET access_status = 'approved'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'wanderson.lealofc@icloud.com');

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'wanderson.lealofc@icloud.com'
ON CONFLICT DO NOTHING;
```

---

## ⚠️ Verificação Final

Execute no SQL Editor para confirmar:

```sql
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.display_name,
  p.access_status,
  array_agg(ur.role) as roles
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'wanderson.lealofc@icloud.com'
GROUP BY u.id, u.email, u.email_confirmed_at, p.display_name, p.access_status;
```

Deve retornar:
- ✅ `email_confirmed_at`: tem uma data
- ✅ `access_status`: `approved`
- ✅ `roles`: `{admin}`

---

## 🆘 Se Ainda Não Funcionar

Me envie um print do erro que aparece na tela ou me conte exatamente o que acontece quando tenta fazer login.
