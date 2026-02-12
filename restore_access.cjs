const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load Env
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
    } catch (e) { console.error("Error loading .env", e); }
    return envVars;
}

const env = loadEnv();
const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_KEY']; 

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env (VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function restoreAccess() {
    const email = 'wanderson.lealofc@icloud.com';
    console.log(`Restoring access for ${email}...`);

    // 1. Get User by Email (Listing usually limited to 50, but probably user is in first page or search)
    // Supabase Admin listUsers doesn't support filter by email directly in all versions, but we can try to find locally
    // Or use internal table query if enabled.
    
    // Safer to list and find.
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    
    if (userError) {
        console.error('Error listing users:', userError);
        return;
    }

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
        console.error(`User ${email} not found in Auth Users list!`);
        return;
    }

    console.log(`Found user: ${user.id} (${user.email})`);

    // 2. Assign Roles
    // We explicitly add ALL high-level roles
    const rolesToAdd = ['admin', 'financeiro_gerente', 'suporte_gerente', 'membro'];

    for (const role of rolesToAdd) {
        // Prepare row
        const row = { user_id: user.id, role: role };
        
        // Upsert isn't always straightforward with simple tables without constraints, 
        // but user_roles usually has (user_id, role) unique. 
        // We will try insert, if fails, we assume it exists.
        
        // First check if exists
        const { data: existing } = await supabase.from('user_roles').select('*').match(row).single();
        
        if (!existing) {
             const { error } = await supabase.from('user_roles').insert(row);
             if (error) console.error(`Failed to add role ${role}:`, error.message);
             else console.log(`✅ Role ${role} added.`);
        } else {
            console.log(`ℹ️ Role ${role} already exists.`);
        }
    }
    
    // 3. Update Profile to ensure Access Status
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
            access_status: 'approved',
            access_level: 'admin' // Some schemas use this
        })
        .eq('user_id', user.id);

    if (profileError) console.error('Error updating profile:', profileError.message);
    else console.log('✅ Profile updated (access_status=approved).');
    
    console.log('\nRestoration Complete. Please ask user to sign out and sign in again.');
}

restoreAccess().catch(console.error);
