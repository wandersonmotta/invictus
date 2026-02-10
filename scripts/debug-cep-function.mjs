import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(url, key);

async function debugFunction() {
  console.log('🔑 Logging in to get token...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@localhost.com',
    password: 'password123'
  });

  if (authError) {
    console.error('❌ Authentication failed:', authError.message);
    return;
  }
  
  console.log('✅ Authenticated. Invoking function...');

  const { data, error } = await supabase.functions.invoke('resolve-location-from-cep', {
    body: { postal_code: '01001000' } // Sé da cidade de São Paulo
  });

  if (error) {
    console.error('❌ Function Error:', error);
    if (error instanceof Error) {
        console.error('Message:', error.message);
        console.error('Context:', JSON.stringify(error));
    }
  } else {
    console.log('✅ Function Response:', data);
  }
}

debugFunction();
