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
    // Auth
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user?.email) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { names } = await req.json();
    if (!Array.isArray(names) || names.length === 0) {
      return new Response(JSON.stringify({ error: "Lista de nomes vazia" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    // Find or skip customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    // Build metadata — Stripe limits metadata values to 500 chars,
    // so we store a compact version of names data
    const namesForMeta = names.map((n: any) => ({
      n: n.person_name,
      d: n.document,
      w: n.whatsapp,
    }));

    const namesJson = JSON.stringify(namesForMeta);

    // If metadata is too large, we chunk it
    const metadataObj: Record<string, string> = {
      user_id: user.id,
      count: String(names.length),
    };

    // Stripe metadata value limit is 500 chars per key
    if (namesJson.length <= 500) {
      metadataObj.names = namesJson;
    } else {
      // Split into chunks
      const chunkSize = 490;
      for (let i = 0; i < namesJson.length; i += chunkSize) {
        metadataObj[`names_${Math.floor(i / chunkSize)}`] = namesJson.slice(i, i + chunkSize);
      }
    }

    const origin = req.headers.get("origin") || "https://eewrwerwrw.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      // Let Stripe use whatever payment methods are enabled on the account
      // To enable Pix, the user must activate it in the Stripe Dashboard
      line_items: [
        {
          price: "price_1Sy1ZrCToDEEMd24LH6duIuw",
          quantity: names.length,
        },
      ],
      mode: "payment",
      metadata: metadataObj,
      success_url: `${origin}/pagamento-sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/servicos`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("create-limpa-nome-payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
