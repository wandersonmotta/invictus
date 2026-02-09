import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NameRecord {
  person_name: string;
  document: string;
  whatsapp: string;
}


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

    // Find or create customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0
      ? customers.data[0].id
      : (await stripe.customers.create({ email: user.email })).id;

    // Build metadata (same chunking logic)
    const namesForMeta = (names as NameRecord[]).map((n) => ({
      n: n.person_name,
      d: n.document,
      w: n.whatsapp,
    }));

    const namesJson = JSON.stringify(namesForMeta);
    const metadataObj: Record<string, string> = {
      user_id: user.id,
      count: String(names.length),
    };
    if (namesJson.length <= 500) {
      metadataObj.names = namesJson;
    } else {
      const chunkSize = 490;
      for (let i = 0; i < namesJson.length; i += chunkSize) {
        metadataObj[`names_${Math.floor(i / chunkSize)}`] = namesJson.slice(i, i + chunkSize);
      }
    }

    // Create PaymentIntent with Pix, confirmed server-side
    const paymentIntent = await stripe.paymentIntents.create({
      amount: names.length * 15000, // R$ 150 per name in centavos
      currency: "brl",
      payment_method_types: ["pix"],
      payment_method_data: { type: "pix" },
      confirm: true,
      customer: customerId,
      metadata: metadataObj,
    });

    // Extract Pix QR code data from next_action
    const pixAction = paymentIntent.next_action?.pix_display_qr_code;

    if (!pixAction) {
      return new Response(JSON.stringify({ error: "Pix não disponível. Verifique se o Pix está ativado na sua conta Stripe." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      payment_intent_id: paymentIntent.id,
      pix_qr_code_url: pixAction.image_url_png || pixAction.image_url_svg,
      pix_code: pixAction.data,
      expires_at: pixAction.expires_at,
    }), {
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
