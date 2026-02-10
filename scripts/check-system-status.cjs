
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://krtjexfyixnhjehndyop.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error("Please provide SUPABASE_SERVICE_KEY env var");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkSystem() {
  console.log("--- SYSTEM HEALTH CHECK ---");

  // 1. Check Roles for Admin
  const { data: roles, error: roleError } = await supabase
    .from('user_roles')
    .select('role, user_id, profiles(email, display_name)')
    // .eq('user_id', '...') // Let's list all first
    ;

  if (roleError) console.error("Error fetching roles:", roleError);
  else {
    console.log(`\n[\u2705] Roles Found (${roles.length}):`);
    roles.forEach(r => {
        // Mock profile email if join failed or is constructed differently
        const email = r.profiles ? r.profiles.email : "N/A"; 
        console.log(` - Role: ${r.role} | User: ${r.user_id}`);
    });
  }

  // 2. Check Profiles Count
  const { count: profilesCount, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  
  if (countError) console.error("Error counting profiles:", countError);
  else console.log(`\n[\u2705] Total Profiles: ${profilesCount}`);

  // 3. Check specific members
  const { data: members } = await supabase
    .from('profiles')
    .select('id, display_name, email, first_name')
    .in('first_name', ['Joyce', 'Thiago']);
  
  if (members && members.length > 0) {
      console.log(`\n[\u2705] Found Specific Members:`);
      members.forEach(m => console.log(` - ${m.display_name} (${m.email})`));
  } else {
      console.log(`\n[\u274C] Specific members (Joyce, Thiago) NOT found in DB.`);
  }

  // 4. Check Services
  const { count: servicesCount } = await supabase
    .from('service_items')
    .select('*', { count: 'exact', head: true });
  console.log(`\n[\u2705] Service Items: ${servicesCount}`);

}

checkSystem();
