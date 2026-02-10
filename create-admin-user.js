// Script para criar usuário administrador inicial
// Execute: node create-admin-user.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://krtjexfyixnhjehndyop.supabase.co';
const supabaseServiceKey = 'SUA_SERVICE_ROLE_KEY_AQUI'; // Pegar no Supabase Dashboard > Settings > API

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const email = 'wanderson.lealofc@icloud.com';
  const password = 'TemporaryPassword123!';

  console.log('Criando usuário administrador...');

  // 1. Criar usuário via Admin API
  const { data: user, error: createError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Email confirmado automaticamente
    user_metadata: {
      display_name: 'Wanderson Mota'
    }
  });

  if (createError) {
    console.error('Erro ao criar usuário:', createError);
    return;
  }

  console.log('✅ Usuário criado:', user.user.id);

  // 2. Criar profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: user.user.id,
      display_name: 'Wanderson Mota',
      first_name: 'Wanderson',
      last_name: 'Mota',
      access_status: 'approved',
      profile_visibility: 'members',
      username: '@wanderson'
    });

  if (profileError) {
    console.error('Erro ao criar profile:', profileError);
  } else {
    console.log('✅ Profile criado');
  }

  // 3. Adicionar role de admin
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({
      user_id: user.user.id,
      role: 'admin'
    });

  if (roleError) {
    console.error('Erro ao adicionar role:', roleError);
  } else {
    console.log('✅ Role de admin adicionada');
  }

  console.log('\n🎉 Usuário administrador criado com sucesso!');
  console.log('📧 Email:', email);
  console.log('🔑 Senha:', password);
  console.log('🌐 Acesse: https://app.invictusfraternidade.com.br/auth');
}

createAdminUser().catch(console.error);
