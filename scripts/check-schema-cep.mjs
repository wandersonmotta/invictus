import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkSchema() {
  console.log('🔍 Checking database schema for CEP function...');

  // 1. Check geo_city_cache
  const { error: geoError } = await supabase.from('geo_city_cache').select('count', { count: 'exact', head: true });
  if (geoError) {
    console.error('❌ Table geo_city_cache check failed:', geoError.message);
  } else {
    console.log('✅ Table geo_city_cache exists.');
  }

  // 2. Check profiles columns
  // We'll try to select the specific columns. If they don't exist, we should get an error.
  const { error: profileError } = await supabase.from('profiles').select('postal_code, city, state, region, location_lat, location_lng, location_updated_at').limit(1);
  
  if (profileError) {
    console.error('❌ Columns in profiles check failed:', profileError.message);
  } else {
    console.log('✅ Required columns in profiles exist.');
  }
}

checkSchema();
