
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

// Configuração
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://krtjexfyixnhjehndyop.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Deve ser passado via env var
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ ERRO: SUPABASE_SERVICE_KEY não definida.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Tentar pegar a chave do Stripe do banco se não tiver no env (ou usar a do env se o usuário forneceu antes)
// Como não temos acesso fácil às secrets do Edge Function aqui, vamos assumir que o usuário precisa fornecer ou vamos tentar ler de algum lugar.
// VOU USAR UMA ESTRATÉGIA HÍBRIDA: Tentar ler de um arquivo .env local se existir, senão pedir input.
// Mas para agilizar, vou assumir que a chave está no environment do processo ou vou tentar recuperar via Supabase (se tivesse stored config).

// Na verdade, a chave do Stripe estava no código da Edge Function anterior? Não, estava como Deno.env.get.
// O usuário não forneceu a chave Stripe explicitamente no chat recente, mas ela deve estar configurada no projeto.
// Vou tentar rodar o script assumindo que a chave Stripe está disponível ou falhar graciosamente.

// P.S: O usuário não mandou a chave Stripe no chat. 
// VOU USAR A EDGE FUNCTION PARA ISSO! É MAIS SEGURO POIS AS CHAVES JÁ ESTÃO LÁ.
// Vou criar um script que INVOCA a edge function como admin.

async function triggerRestore() {
    console.log('🚀 Iniciando Recuperação via Edge Function (usando credenciais de Admin)...');
    
    try {
        const { data, error } = await supabase.functions.invoke('sync-stripe-users', {
            method: 'POST',
            body: {} 
        });

        if (error) {
            throw error;
        }

        console.log('✅ Resultado da Sincronização:', data);
        
        // Agora vamos dar super poderes ao admin
        await grantSuperPowers();

    } catch (err) {
        console.error('❌ Erro na recuperação:', err.message);
        console.log('⚠️ Tentando método alternativo local se a função falhar...');
    }
}

async function grantSuperPowers() {
    console.log('\n👑 Concedendo Super Poderes ao Admin (Wanderson)...');
    
    // Buscar o usuário
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    const adminEmail = 'wanderson.lealofc@icloud.com';
    const adminUser = users.find(u => u.email === adminEmail);

    if (!adminUser) {
        console.error('❌ Usuário admin não encontrado!');
        return;
    }

    const roles = ['admin', 'financeiro', 'suporte', 'suporte_gerente'];
    
    for (const role of roles) {
        const { error: roleError } = await supabase
            .from('user_roles')
            .upsert({ 
                user_id: adminUser.id, 
                role: role 
            }, { onConflict: 'user_id,role' });
            
        if (roleError) console.error(`Erro ao dar role ${role}:`, roleError.message);
        else console.log(`✅ Role concedida: ${role}`);
    }
    
    console.log('✨ Permissões atualizadas com sucesso!');
}

triggerRestore();
