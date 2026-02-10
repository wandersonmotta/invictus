import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function cleanCategories() {
  console.log('🧹 Iniciando limpeza de categorias de serviço...');

  const targets = ["Regularização Financeira", "Consultoria", "Benefícios Exclusivos"];

  // 1. Listar atuais
  const { data: before } = await supabase.from('service_categories').select('*');
  console.log('📋 Categorias antes:', before.map(c => c.name));

  // 2. Deletar
  console.log(`🗑️  Excluindo: ${targets.join(', ')}`);
  const { error } = await supabase
    .from('service_categories')
    .delete()
    .in('name', targets);

  if (error) {
    console.error('❌ Erro ao deletar:', error);
    return;
  }

  // 3. Confirmar
  const { data: after } = await supabase.from('service_categories').select('*');
  console.log('📋 Categorias após:', after.map(c => c.name));
  
  const remaining = after.map(c => c.name);
  if (remaining.includes("Reabilitação de Crédito") && !remaining.some(r => targets.includes(r))) {
    console.log('✅ Sucesso! Apenas categorias permitidas restaram.');
  } else {
    console.log('⚠️ Alerta: Verifique o resultado.');
  }
}

cleanCategories();
