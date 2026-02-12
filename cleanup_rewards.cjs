
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

async function cleanupDuplicates() {
  // Prêmios criados manualmente que precisam ser apagados
  const namesToDelete = ["Cruzeiro", "Viagem para Paris", "iPhone 16 Pro Max"];
  
  console.log('Searching and deleting duplicate test rewards...');
  for (const name of namesToDelete) {
    const response = await fetch(`${supabaseUrl}/rest/v1/point_rewards?name=eq.${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    if (response.ok) {
        console.log(`Deleted: ${name}`);
    }
  }
}

cleanupDuplicates();
