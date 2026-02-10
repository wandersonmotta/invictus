#!/usr/bin/env node

/**
 * Script para criar usuário administrador inicial via Supabase Admin API
 * 
 * IMPORTANTE: Este é o método CORRETO para criar usuários em produção.
 * Migrations SQL NÃO FUNCIONAM para tabela auth.users em produção Supabase.
 * 
 * USO:
 * 1. Instale: npm install @supabase/supabase-js
 * 2. Execute: SUPABASE_SERVICE_KEY=sua_chave_aqui node scripts/create-initial-admin.mjs
 */

import { createClient } from '@supabase/supabase-js';

// Configurações
const SUPABASE_URL = 'https://krtjexfyixnhjehndyop.supabase.co';
const ADMIN_EMAIL = 'wanderson.lealofc@icloud.com';
const ADMIN_PASSWORD = 'InvictusAdmin2026!'; // Senha mais segura
const ADMIN_DISPLAY_NAME = 'Wanderson Mota';

async function createInitialAdmin() {
  // Validar que temos a service key
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!serviceKey) {
    console.error('❌ ERRO: SUPABASE_SERVICE_KEY não definida!');
    console.log('\n📝 Como obter:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/krtjexfyixnhjehndyop/settings/api');
    console.log('2. Copie a "service_role key" (secret)');
    console.log('3. Execute: SUPABASE_SERVICE_KEY=sua_chave_aqui node scripts/create-initial-admin.mjs');
    process.exit(1);
  }

  console.log('🚀 Iniciando criação do usuário administrador...\n');

  // Criar cliente admin
  const supabase = createClient(SUPABASE_URL, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // 1. Verificar se usuário já existe
    console.log('🔍 Verificando se usuário já existe...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users?.find(u => u.email === ADMIN_EMAIL);

    let userId;

    if (existingUser) {
      console.log('⚠️  Usuário já existe:', existingUser.id);
      console.log('   Atualizando senha...');
      
      // Atualizar senha do usuário existente
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: ADMIN_PASSWORD }
      );

      if (updateError) throw updateError;
      userId = existingUser.id;
      console.log('✅ Senha atualizada com sucesso!');
    } else {
      // 2. Criar novo usuário via Admin API
      console.log('➕ Criando novo usuário...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          display_name: ADMIN_DISPLAY_NAME
        }
      });

      if (createError) throw createError;
      userId = newUser.user.id;
      console.log('✅ Usuário criado:', userId);
    }

    // 3. Criar/atualizar profile
    console.log('👤 Configurando profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        display_name: ADMIN_DISPLAY_NAME,
        first_name: 'Wanderson',
        last_name: 'Mota',
        access_status: 'approved',
        profile_visibility: 'members',
        username: '@wanderson'
      }, {
        onConflict: 'user_id'
      });

    if (profileError) throw profileError;
    console.log('✅ Profile configurado');

    // 4. Adicionar role de admin
    console.log('🔐 Adicionando permissão de admin...');
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'admin'
      }, {
        onConflict: 'user_id,role'
      });

    if (roleError) throw roleError;
    console.log('✅ Permissão de admin adicionada');

    // 5. Verificar resultado final
    console.log('\n🔍 Verificando configuração final...');
    const { data: finalCheck, error: checkError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        display_name,
        access_status,
        user_roles (role)
      `)
      .eq('user_id', userId)
      .single();

    if (checkError) throw checkError;

    console.log('\n✅ SUCESSO! Usuário administrador criado/atualizado:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Senha:', ADMIN_PASSWORD);
    console.log('👤 Nome:', finalCheck.display_name);
    console.log('✓ Status:', finalCheck.access_status);
    console.log('🛡️  Roles:', finalCheck.user_roles?.map(r => r.role).join(', ') || 'admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🌐 Acesse: https://app.invictusfraternidade.com.br/auth\n');
    console.log('⚠️  IMPORTANTE: Altere sua senha após o primeiro login!');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\n🔧 Detalhes:', error);
    process.exit(1);
  }
}

// Executar
createInitialAdmin();
