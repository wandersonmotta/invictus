import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(url, key);

async function checkRLS() {
  console.log('🔑 Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@localhost.com',
    password: 'password123'
  });

  if (authError) {
    console.error('❌ Auth failed:', authError.message);
    return;
  }
  const userId = authData.user.id;
  console.log(`✅ Logged in as ${userId}`);

  console.log('📝 Attempting to update profile location directly...');
  const { data, error } = await supabase.from('profiles').upsert({
    user_id: userId,
    postal_code: '01001000',
    city: 'São Paulo',
    state: 'SP'
  }, { onConflict: 'user_id' }).select();

  if (error) {
    console.error('❌ Update failed (RLS likely blocks it):', error.message);
  } else {
    console.log('✅ Update successful!', data);
  }
}

checkRLS();
