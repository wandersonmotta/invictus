// Public endpoint for the landing waitlist.
// - No auth required
// - Validates input
// - Inserts into public.waitlist_leads (RLS allows INSERT)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type WaitlistPayload = {
  email?: unknown;
  source?: unknown;
};

function isEmailLike(email: string) {
  // Keep consistent with DB policy shape validation.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email);
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "method_not_allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as WaitlistPayload;

    const emailRaw = typeof body.email === "string" ? body.email : "";
    const email = emailRaw.trim().toLowerCase();
    const sourceRaw = typeof body.source === "string" ? body.source : "";
    const source = sourceRaw.trim().slice(0, 80) || null;

    if (!email || email.length > 255 || !isEmailLike(email)) {
      return new Response(JSON.stringify({ error: "invalid_email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "";

    const ipHash = ip ? await sha256Hex(ip) : null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        auth: { persistSession: false },
      },
    );

    const { error } = await supabase.from("waitlist_leads").insert({
      email,
      source,
      ip_hash: ipHash,
    });

    // Duplicate email (unique index on lower(email)) => treat as success.
    const pgCode = (error as any)?.code;
    if (error && pgCode !== "23505") {
      console.error("waitlist-signup insert error", error);
      return new Response(JSON.stringify({ error: "insert_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("waitlist-signup unexpected", e);
    return new Response(JSON.stringify({ error: "unexpected" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
