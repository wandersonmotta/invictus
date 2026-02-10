import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log("Iniciando sincronização de usuários do Stripe...");

    // 1. Listar todos os clientes do Stripe (paginado)
    const customers = [];
    let hasMore = true;
    let startingAfter = undefined;

    while (hasMore) {
      const listParams: any = { limit: 100 };
      if (startingAfter) listParams.starting_after = startingAfter;

      const response = await stripe.customers.list(listParams);
      customers.push(...response.data);
      
      hasMore = response.has_more;
      if (hasMore) {
        startingAfter = response.data[response.data.length - 1].id;
      }
    }

    console.log(`Encontrados ${customers.length} clientes no Stripe.`);

    const results = {
      total: customers.length,
      created: 0,
      existing: 0,
      errors: 0,
      details: [] as string[],
    };

    // 2. Processar cada cliente
    for (const customer of customers) {
      if (!customer.email) continue;

      // Verificar se usuário existe no Supabase
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUser.users.find(u => u.email === customer.email);

      if (userExists) {
        results.existing++;
        continue;
      }

      // Criar usuário se não existir
      const tempPassword = "InvictusMember2026!";
      const displayName = customer.name || customer.email.split("@")[0];

      try {
        // Criar Auth User
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: customer.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: customer.name,
            stripe_customer_id: customer.id,
          },
        });

        if (createError) throw createError;

        if (newUser.user) {
          // Criar Profile
          const nameParts = displayName.split(" ");
          const firstName = nameParts[0];
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

          await supabaseAdmin.from("profiles").upsert({
            user_id: newUser.user.id,
            display_name: displayName,
            first_name: firstName,
            last_name: lastName,
            access_status: "approved", // Assumindo que se está no Stripe, é aprovado
            profile_visibility: "members",
            username: `@${customer.email.split("@")[0]}`,
          });

          // Adicionar role 'user'
          await supabaseAdmin.from("user_roles").insert({
            user_id: newUser.user.id,
            role: "user",
          });

          results.created++;
          results.details.push(`Criado: ${customer.email}`);
        }
      } catch (err: any) {
        console.error(`Erro ao criar ${customer.email}:`, err);
        results.errors++;
        results.details.push(`Erro ${customer.email}: ${err.message}`);
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
