
const readline = require('readline');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

// Interface para leitura de input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

// Configurações
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://krtjexfyixnhjehndyop.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// SQL de restauração de serviços (inline para facilitar execução via JS)
const RESTORE_SERVICES_SQL = `
INSERT INTO service_categories (id, name, description, icon_name, sort_order)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Reabilitação de Crédito',
  'Soluções para regularizar sua situação financeira',
  'CreditCard',
  1
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO service_items (id, category_id, name, description, price, price_label, image_url, contact_info, icon_name, sort_order)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Limpa Nome',
  'Serviço completo de reabilitação de crédito.',
  0,
  'Sob Consulta',
  NULL,
  'Entre em contato pelo WhatsApp',
  'ShieldCheck',
  1
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
`;

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ ERRO: SUPABASE_SERVICE_KEY não definida no ambiente.');
    console.log('👉 Execute: SUPABASE_SERVICE_KEY=sua_chave npm run restaurar');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log('\n🛡️  INVICTUS - RECUPERAÇÃO DE MEMBROS 🛡️');
    console.log('========================================\n');

    let STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

    if (!STRIPE_SECRET_KEY) {
        console.log('⚠️  Chave Stripe não encontrada no ambiente.');
        console.log('Para recuperar os membros (Joyce, Thiago, etc), precisamos da chave Secret do Stripe.');
        console.log('Ela começa com "sk_live_...".\n');
        
        STRIPE_SECRET_KEY = await askQuestion('🔑 Cole a chave Stripe aqui: ');
        
        if (!STRIPE_SECRET_KEY || !STRIPE_SECRET_KEY.startsWith('sk_')) {
             console.log('\n❌ Chave inválida ou não fornecida. Pulando recuperação do Stripe.');
        }
    }

    console.log('\n🚀 Iniciando Processo...');

    // 1. Recuperação do Stripe (se chave disponível)
    if (STRIPE_SECRET_KEY) {
        try {
            const stripe = new Stripe(STRIPE_SECRET_KEY);
            console.log('📡 Conectando ao Stripe para buscar clientes...');
            
            const customers = [];
            let hasMore = true;
            let startingAfter = undefined;

            while (hasMore) {
                const listParams = { limit: 100 };
                if (startingAfter) listParams.starting_after = startingAfter;

                const response = await stripe.customers.list(listParams);
                customers.push(...response.data);
                
                hasMore = response.has_more;
                if (hasMore) {
                    startingAfter = response.data[response.data.length - 1].id;
                }
            }

            console.log(`📥 Encontrados ${customers.length} clientes no Stripe. Processando...`);

            let criados = 0;
            let erros = 0;

            for (const customer of customers) {
                if (!customer.email) continue;

                // Verificar se usuário existe
                const { data: existingUser } = await supabase.auth.admin.listUsers();
                const userExists = existingUser.users.find(u => u.email === customer.email);

                if (userExists) {
                    continue;
                }

                try {
                    // Criar Auth User
                    const tempPassword = "InvictusMember2026!";
                    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                        email: customer.email,
                        password: tempPassword,
                        email_confirm: true,
                        user_metadata: {
                            full_name: customer.name,
                            stripe_customer_id: customer.id,
                        },
                    });

                    if (createError) throw createError;

                    if (newUser.user) {
                        const displayName = customer.name || customer.email.split("@")[0];
                        const nameParts = displayName.split(" ");
                        const firstName = nameParts[0];
                        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

                        // Criar Profile
                        await supabase.from("profiles").upsert({
                            user_id: newUser.user.id,
                            display_name: displayName,
                            first_name: firstName,
                            last_name: lastName,
                            access_status: "approved",
                            profile_visibility: "members",
                            username: `@${customer.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, '')}`,
                        });

                        // Role User
                        await supabase.from("user_roles").insert({
                            user_id: newUser.user.id,
                            role: "user",
                        });

                        console.log(`✅ Restaurado: ${customer.email}`);
                        criados++;
                    }
                } catch (err) {
                    console.error(`❌ Erro ao restaurar ${customer.email}:`, err.message);
                    erros++;
                }
            }

            console.log(`\n📊 Relatório Stripe: ${criados} recuperados, ${erros} erros.`);

        } catch (err) {
            console.error('❌ Falha na conexão com Stripe:', err.message);
        }
    } else {
        console.log('⏩ Pulando recuperação do Stripe (chave não fornecida ou inválida).');
    }

    // 1.5 Restaurar Serviços Legados (SQL)
    console.log('\n🛠️  Restaurando Serviços Legados (Limpa Nome)...');
    try {
        // Separa o SQL em comandos individuais para execução via rpc ou direta (Supabase JS não executa raw SQL facilmente sem rpc nomeada)
        // Como não temos uma função RPC 'exec_sql', vamos fazer inserts via JS client mesmo, usando a estrutura que já conhecemos.
        // Categoria
        const { error: catError } = await supabase.from('service_categories').upsert({
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Reabilitação de Crédito',
            description: 'Soluções para regularizar sua situação financeira',
            icon_name: 'CreditCard',
            sort_order: 1
        });
        if (catError) console.error('  ❌ Erro categoria:', catError.message);
        else console.log('  ✅ Categoria "Reabilitação de Crédito" restaurada.');

        // Serviço
        const { error: itemError } = await supabase.from('service_items').upsert({
            id: '00000000-0000-0000-0000-000000000002',
            category_id: '00000000-0000-0000-0000-000000000001',
            name: 'Limpa Nome',
            description: 'Serviço completo de reabilitação de crédito.',
            price: 0,
            price_label: 'Sob Consulta',
            contact_info: 'Entre em contato pelo WhatsApp',
            icon_name: 'ShieldCheck',
            sort_order: 1
        });
        if (itemError) console.error('  ❌ Erro serviço:', itemError.message);
        else console.log('  ✅ Serviço "Limpa Nome" restaurado.');

    } catch (err) {
        console.error('  ❌ Falha na restauração de serviços:', err.message);
    }

    await grantSuperPowers();
    
    console.log('\n🏁 Processo Finalizado. Pressione Ctrl+C para sair.');
    process.exit(0);
}

async function grantSuperPowers() {
    console.log('\n👑 Concedendo Super Poderes ao Admin (Wanderson)...');
    
    // Buscar o usuário
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    // Lista de emails para dar admin (incluindo o do usuário)
    const targetEmails = ['wanderson.lealofc@icloud.com']; 
    
    for (const email of targetEmails) {
        const user = users.find(u => u.email === email);
        if (!user) {
            console.error(`❌ Usuário ${email} não encontrado!`);
            continue;
        }

        const roles = ['admin', 'financeiro', 'suporte', 'suporte_gerente'];
        
        for (const role of roles) {
            const { error: roleError } = await supabase
                .from('user_roles')
                .upsert({ 
                    user_id: user.id, 
                    role: role 
                }, { onConflict: 'user_id,role' });
                
            if (roleError) console.error(`  ❌ Erro ao dar role ${role}:`, roleError.message);
            else console.log(`  ✅ ${email}: Role ${role} concedida.`);
        }
    }
    
    console.log('✨ Permissões atualizadas!');
}

main();
