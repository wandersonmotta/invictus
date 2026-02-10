#!/usr/bin/env node

/**
 * SCRIPT DE BACKUP COMPLETO DO BANCO DE DADOS
 * 
 * Cria backup completo de todas as tabelas do Supabase em formato JSON
 * para recuperação em caso de perda de dados.
 * 
 * USO:
 * SUPABASE_SERVICE_KEY=sua_chave node scripts/create-full-backup.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://krtjexfyixnhjehndyop.supabase.co';

// Lista completa de tabelas para backup
const TABLES_TO_BACKUP = [
  // Core
  'profiles',
  'user_roles',
  
  // Treinamentos
  'trainings',
  'training_categories',
  
  // Feed/Social
  'feed_posts',
  'feed_post_media',
  'feed_post_likes',
  'feed_post_comments',
  
  // Mensagens
  'messages',
  'conversations',
  'conversation_members',
  
  // Social
  'follows',
  'member_status',
  'notifications',
  
  // Comunidade
  'community_posts',
  'community_categories',
  
  // Suporte
  'support_tickets',
  'support_messages',
  'support_agent_presence',
  
  // Leads
  'waitlist_leads',
  'leads_meta',
  'leads_google',
  
  // Financeiro
  'financial_transactions',
  'payment_methods',
  
  // SERVIÇOS (CRÍTICO!)
  'service_categories',
  'service_items',
  'service_payments'
];

async function createFullBackup() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!serviceKey) {
    console.error('❌ ERRO: SUPABASE_SERVICE_KEY não definida!');
    process.exit(1);
  }

  console.log('💾 INICIANDO BACKUP COMPLETO DO BANCO DE DADOS\n');
  console.log('━'.repeat(60));

  const supabase = createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupDir = `backups/${timestamp}`;
  
  // Criar diretório de backup
  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups');
  }
  fs.mkdirSync(backupDir);

  const backup = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    tables: {}
  };

  let totalRecords = 0;
  let totalTables = 0;

  console.log('\n📦 Fazendo backup das tabelas:');
  console.log('━'.repeat(60));

  for (const tableName of TABLES_TO_BACKUP) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' });

      if (error) {
        console.log(`⚠️  ${tableName.padEnd(30)} → Não accessible`);
        continue;
      }

      backup.tables[tableName] = {
        count: count || 0,
        data: data || []
      };

      totalRecords += count || 0;
      totalTables++;

      console.log(`✓ ${tableName.padEnd(30)} → ${count || 0} registros`);

      // Salvar arquivo individual também
      const tableFile = path.join(backupDir, `${tableName}.json`);
      fs.writeFileSync(tableFile, JSON.stringify(data, null, 2));

    } catch (e) {
      console.log(`✗ ${tableName.padEnd(30)} → ERRO: ${e.message}`);
    }
  }

  // Salvar backup completo
  const backupFile = path.join(backupDir, 'full-backup.json');
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

  // Criar arquivo de metadados
  const metadata = {
    timestamp: new Date().toISOString(),
    tables_count: totalTables,
    total_records: totalRecords,
    tables: Object.keys(backup.tables).map(name => ({
      name,
      count: backup.tables[name].count
    }))
  };

  const metadataFile = path.join(backupDir, 'metadata.json');
  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

  console.log('\n━'.repeat(60));
  console.log('\n✅ BACKUP CONCLUÍDO COM SUCESSO!\n');
  console.log(`📁 Diretório: ${backupDir}`);
  console.log(`📊 Tabelas: ${totalTables}`);
  console.log(`📝 Registros: ${totalRecords}`);
  console.log('\nArquivos criados:');
  console.log(`  • full-backup.json (backup completo)`);
  console.log(`  • metadata.json (metadados)`);
  console.log(`  • [tabela].json (${totalTables} arquivos individuais)`);
  
  console.log('\n💡 DICA: Guarde este backup em local seguro!');
  console.log('   Para restaurar, use: node scripts/restore-from-backup.mjs');
}

createFullBackup().catch(error => {
  console.error('\n❌ ERRO:', error.message);
  console.error(error);
  process.exit(1);
});
