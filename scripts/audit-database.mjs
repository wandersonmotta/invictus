#!/usr/bin/env node

/**
 * AUDITORIA FORENSE DO BANCO DE DADOS INVICTUS
 * 
 * Este script faz uma investigação completa do banco de dados para:
 * 1. Listar todas as tabelas e contagens
 * 2. Identificar dados perdidos
 * 3. Criar backup completo
 * 4. Gerar relatório detalhado
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://krtjexfyixnhjehndyop.supabase.co';

async function runFullAudit() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!serviceKey) {
    console.error('❌ ERRO: SUPABASE_SERVICE_KEY não definida!');
    process.exit(1);
  }

  console.log('🔍 INICIANDO AUDITORIA FORENSE DO BANCO DE DADOS\n');
  console.log('━'.repeat(60));

  const supabase = createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const report = {
    timestamp: new Date().toISOString(),
    tables: {},
    users: [],
    profiles: [],
    roles: [],
    migrations: [],
    issues: []
  };

  try {
    // ========================================
    // FASE 1: INVENTÁRIO DE TABELAS
    // ========================================
    console.log('\n📊 FASE 1: Inventário de Tabelas');
    console.log('━'.repeat(60));

    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `
      });

    if (tablesError) {
      // Tentar método alternativo
      console.log('ℹ️  Usando método alternativo para listar tabelas...');
      
      // Lista conhecida de tabelas críticas
      const knownTables = [
        'profiles', 'user_roles', 'trainings', 'training_categories',
        'feed_posts', 'feed_post_media', 'feed_post_likes', 'feed_post_comments',
        'messages', 'conversations', 'conversation_members',
        'follows', 'member_status', 'notifications',
        'community_posts', 'community_categories',
        'support_tickets', 'support_messages', 'support_agent_presence',
        'waitlist_leads', 'leads_meta', 'leads_google',
        'financial_transactions', 'payment_methods',
        // TABELAS DE SERVIÇOS (CRÍTICO!)
        'services', 'service_categories', 'service_offerings',
        'products', 'product_categories'
      ];

      for (const tableName of knownTables) {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (!error) {
            report.tables[tableName] = count || 0;
            console.log(`✓ ${tableName.padEnd(30)} → ${count || 0} registros`);
          }
        } catch (e) {
          // Tabela não existe
        }
      }
    }

    // ========================================
    // FASE 2: USUÁRIOS E AUTENTICAÇÃO
    // ========================================
    console.log('\n👥 FASE 2: Usuários e Autenticação');
    console.log('━'.repeat(60));

    const { data: authUsers } = await supabase.auth.admin.listUsers();
    
    report.users = authUsers.users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      confirmed: !!u.email_confirmed_at,
      last_login: u.last_sign_in_at
    }));

    console.log(`Total de usuários: ${authUsers.users.length}`);
    authUsers.users.forEach(u => {
      console.log(`  • ${u.email} (${u.email_confirmed_at ? '✓ confirmado' : '✗ não confirmado'})`);
    });

    // ========================================
    // FASE 3: PROFILES
    // ========================================
    console.log('\n📋 FASE 3: Profiles de Membros');
    console.log('━'.repeat(60));

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*');

    report.profiles = profiles || [];
    console.log(`Total de profiles: ${profiles?.length || 0}`);
    
    if (profiles) {
      const byStatus = profiles.reduce((acc, p) => {
        acc[p.access_status] = (acc[p.access_status] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`  • ${status}: ${count}`);
      });
    }

    // ========================================
    // FASE 4: ROLES E PERMISSÕES
    // ========================================
    console.log('\n🔐 FASE 4: Roles e Permissões');
    console.log('━'.repeat(60));

    const { data: roles } = await supabase
      .from('user_roles')
      .select('*');

    report.roles = roles || [];
    console.log(`Total de roles: ${roles?.length || 0}`);
    
    if (roles) {
      const byRole = roles.reduce((acc, r) => {
        acc[r.role] = (acc[r.role] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(byRole).forEach(([role, count]) => {
        console.log(`  • ${role}: ${count}`);
      });
    }

    // ========================================
    // FASE 5: PROCURAR SERVIÇOS
    // ========================================
    console.log('\n🔍 FASE 5: Procurando Serviços');
    console.log('━'.repeat(60));

    const serviceTables = ['services', 'service_categories', 'service_offerings', 'products'];
    let servicesFound = false;

    for (const table of serviceTables) {
      try {
        const { data, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' });

        if (data) {
          servicesFound = true;
          console.log(`✓ Encontrado: ${table} (${count} registros)`);
          report.tables[table] = count;
          
          if (count > 0) {
            console.log('  Dados:');
            data.forEach(item => {
              console.log(`    - ${JSON.stringify(item)}`);
            });
          }
        }
      } catch (e) {
        console.log(`✗ Tabela '${table}' não existe`);
      }
    }

    if (!servicesFound) {
      report.issues.push('CRÍTICO: Nenhuma tabela de serviços encontrada!');
      console.log('\n⚠️  ALERTA: Nenhuma tabela de serviços encontrada!');
      console.log('   Isto pode indicar que:');
      console.log('   1. Os serviços nunca foram criados');
      console.log('   2. Uma migration deletou as tabelas');
      console.log('   3. O nome da tabela é diferente');
    }

    // ========================================
    // SALVAR RELATÓRIO
    // ========================================
    const reportPath = 'audit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n━'.repeat(60));
    console.log(`\n✅ Relatório salvo em: ${reportPath}`);
    console.log('\n📊 RESUMO:');
    console.log(`   • Tabelas encontradas: ${Object.keys(report.tables).length}`);
    console.log(`   • Total de usuários: ${report.users.length}`);
    console.log(`   • Total de profiles: ${report.profiles.length}`);
    console.log(`   • Total de roles: ${report.roles.length}`);
    
    if (report.issues.length > 0) {
      console.log(`\n⚠️  PROBLEMAS IDENTIFICADOS:`);
      report.issues.forEach(issue => console.log(`   • ${issue}`));
    }

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runFullAudit();
