import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Pagamento não confirmado", status: session.payment_status }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify the session belongs to the user
    const metaUserId = session.metadata?.user_id;
    if (metaUserId !== user.id) {
      return new Response(JSON.stringify({ error: "Sessão não pertence a este usuário" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reconstruct names from metadata
    let namesJson = session.metadata?.names;
    if (!namesJson) {
      // Reconstruct from chunks
      const chunks: string[] = [];
      let i = 0;
      while (session.metadata?.[`names_${i}`]) {
        chunks.push(session.metadata[`names_${i}`]);
        i++;
      }
      namesJson = chunks.join("");
    }

    if (!namesJson) {
      return new Response(JSON.stringify({ error: "Dados dos nomes não encontrados" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const names = JSON.parse(namesJson) as Array<{ n: string; d: string; w: string }>;

    // Use service role to insert
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const insertedIds: string[] = [];

    for (const name of names) {
      const { data, error } = await supabaseAdmin
        .from("limpa_nome_requests")
        .insert({
          user_id: user.id,
          person_name: name.n,
          document: name.d || null,
          whatsapp: name.w || null,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }
      insertedIds.push(data.id);
    }

    return new Response(
      JSON.stringify({ success: true, request_ids: insertedIds }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("verify-limpa-nome-payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
