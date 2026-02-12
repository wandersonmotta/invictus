
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

async function debugPins() {
  console.log('--- Profiling Approved Members ---');
  const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=user_id,display_name,access_status,postal_code,location_lat,location_lng&access_status=eq.approved`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  const data = await res.json();
  console.log('Approved Profiles in DB:', JSON.stringify(data, null, 2));

  console.log('--- Testing RPC get_approved_member_pins ---');
  const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_approved_member_pins`, {
    method: 'POST',
    headers: { 
      'apikey': supabaseKey, 
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_limit: 100 })
  });
  const pins = await rpcRes.json();
  console.log('RPC Result:', JSON.stringify(pins, null, 2));
}

debugPins();
