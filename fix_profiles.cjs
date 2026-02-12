
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

async function manageProfiles() {
  // 1. Buscar perfis
  console.log('Searching profiles...');
  const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=user_id,display_name,access_status,username`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  const profiles = await res.json();
  console.log('Profiles:', JSON.stringify(profiles, null, 2));

  // 2. Aprovar conta principal (procurando por Wanderson ou username)
  const target = profiles.find(p => p.display_name?.includes('Wanderson') || p.username?.includes('wanderson'));
  if (target) {
    console.log(`Approving ${target.display_name}...`);
    await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${target.user_id}`, {
      method: 'PATCH',
      headers: { 
        'apikey': supabaseKey, 
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        access_status: 'approved',
        approved_at: new Date().toISOString()
      })
    });
  }

  // 3. Remover conta "Membro"
  const testMember = profiles.find(p => p.display_name === 'Membro');
  if (testMember) {
    console.log(`Deleting test member ${testMember.user_id}...`);
    // Note: Deleting from profiles only, as we don't have easy access to delete from auth.users via REST without admin rights/functions
    await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${testMember.user_id}`, {
      method: 'DELETE',
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
  }
}

manageProfiles();
