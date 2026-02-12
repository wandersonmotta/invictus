const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envVars = {};
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
                const key = trimmed.substring(0, eqIdx).trim();
                let val = trimmed.substring(eqIdx + 1).trim();
                // Remove quotes
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                envVars[key] = val;
            }
        }
    } catch (e) {}
    return envVars;
}

const env = loadEnv();
const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_KEY']; 

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixBaseRoles() {
    const email = 'wanderson.lealofc@icloud.com';
    console.log(`Fixing base roles for ${email}...`);

    const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
        console.error('User not found!');
        return;
    }

    // Roles to ensure are present (BASE roles required by Auth pages)
    const storedRoles = ['suporte', 'financeiro', 'admin']; 

    for (const role of storedRoles) {
        const row = { user_id: user.id, role: role };
        
        // Check if exists
        const { data: existing } = await supabase.from('user_roles').select('*').match(row).single();
        
        if (!existing) {
             const { error } = await supabase.from('user_roles').insert(row);
             if (error) console.error(`Failed to add role ${role}:`, error.message);
             else console.log(`✅ Base Role ${role} added.`);
        } else {
            console.log(`ℹ️ Base Role ${role} already exists.`);
        }
    }
    
    console.log('\nBase roles check complete. Please try logging in again.');
}

fixBaseRoles().catch(console.error);
