-- Criar usuários iniciais para a Fraternidade Invictus
-- IMPORTANTE: Execute este script no SQL Editor do Supabase Dashboard

-- 1. Inserir usuário administrador principal
-- NOTA: Você precisará fazer login pela primeira vez usando "Esqueceu a senha" 
-- para definir uma senha, pois não podemos definir senhas diretamente via SQL

DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'wanderson.lealofc@icloud.com';
BEGIN
  -- Verificar se o usuário já existe
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  -- Se não existir, criar o usuário
  IF v_user_id IS NULL THEN
    -- Inserir na tabela auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      confirmed_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      v_email,
      crypt('TemporaryPassword123!', gen_salt('bf')), -- Senha temporária
      now(),
      NULL,
      '',
      NULL,
      '',
      NULL,
      '',
      '',
      NULL,
      NULL,
      '{"provider":"email","providers":["email"]}',
      '{}',
      NULL,
      now(),
      now(),
      NULL,
      NULL,
      '',
      '',
      NULL,
      now(),
      '',
      0,
      NULL,
      '',
      NULL,
      false,
      NULL
    )
    RETURNING id INTO v_user_id;

    RAISE NOTICE 'Usuário criado com ID: %', v_user_id;
  ELSE
    RAISE NOTICE 'Usuário já existe com ID: %', v_user_id;
  END IF;

  -- Criar profile se não existir
  INSERT INTO public.profiles (
    user_id,
    display_name,
    first_name,
    last_name,
    access_status,
    profile_visibility,
    username
  ) VALUES (
    v_user_id,
    'Wanderson Mota',
    'Wanderson',
    'Mota',
    'approved',
    'members',
    '@wanderson'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    display_name = EXCLUDED.display_name,
    access_status = 'approved';

  -- Adicionar role de admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Profile e role de admin configurados para: %', v_email;
END $$;

-- Verificar o resultado
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
