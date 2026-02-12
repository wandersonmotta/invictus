
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

async function finalFix() {
  console.log('--- Final Profile Cleanup and Approval ---');
  
  // 1. Update Wanderson Mota with coordinates
  const WANDERSON_ID = '342370f6-80fb-4049-a309-f4e2a7379f86';
  console.log(`Setting coordinates for Wanderson Mota (${WANDERSON_ID})...`);
  await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${WANDERSON_ID}`, {
    method: 'PATCH',
    headers: { 
      'apikey': supabaseKey, 
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      access_status: 'approved',
      approved_at: new Date().toISOString(),
      location_lat: -13.2687,
      location_lng: -39.6644,
      city: 'Ubaíra',
      state: 'BA'
    })
  });

  // 2. Delete the test account
  const TEST_ID = '165395fe-c958-48c4-acda-757b42e927fc';
  console.log(`Deleting test profile ${TEST_ID}...`);
  await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${TEST_ID}`, {
    method: 'DELETE',
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });

  console.log('Cleanup complete.');
}

finalFix();
