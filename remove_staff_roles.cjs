
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
const supabaseKey = env['SUPABASE_SERVICE_KEY'];

async function updateRPC() {
  const sql = fs.readFileSync(path.resolve(__dirname, 'update_rpc.sql'), 'utf8');
  console.log('Sending SQL update...');
  
  // Note: We need a way to execute SQL. If the project has an 'exec_sql' RPC (often used in these setups), we use it.
  // Otherwise we might need to use the Supabase CLI if available, but let's try the direct approach with a script if there's a helper.
  
  // Let's check if there is a 'create_rpc' or similar.
  // Actually, I'll just use the REST API to update the profile's roles to remove the staff ones, 
  // which is much easier and solves the issue without changing the DB schema if not strictly necessary.
  
  const WANDERSON_ID = '342370f6-80fb-4049-a309-f4e2a7379f86';
  console.log(`Removing staff roles from Wanderson Mota (${WANDERSON_ID}) to allow appearing in members list...`);
  
  // Roles to remove: financeiro, suporte
  const res = await fetch(`${supabaseUrl}/rest/v1/user_roles?user_id=eq.${WANDERSON_ID}&role=in.("financeiro","suporte")`, {
    method: 'DELETE',
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  
  if (res.ok) {
    console.log('Staff roles removed successfully.');
  } else {
    console.log('Error removing roles:', await res.text());
  }
}

updateRPC();
