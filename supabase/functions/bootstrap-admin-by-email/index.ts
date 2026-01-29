// Lovable Cloud Function: bootstrap-admin-by-email
// If the logged-in user's email is in ADMIN_EMAIL_ALLOWLIST, grant admin role.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseAllowlist(raw: string | undefined) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
  const ANON = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !ANON || !SERVICE_ROLE) {
    console.error("Missing SUPABASE env vars");
    return json(500, { error: "server_misconfigured" });
  }

  const allowlist = parseAllowlist(Deno.env.get("ADMIN_EMAIL_ALLOWLIST"));
  if (allowlist.length === 0) return json(200, { ok: true, granted: false });

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return json(401, { error: "missing_token" });

  // Validate user from token (anon client)
  const authed = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await authed.auth.getUser();
  if (userErr || !userData.user) {
    console.warn("getUser failed", userErr);
    return json(401, { error: "unauthorized" });
  }

  const email = (userData.user.email ?? "").toLowerCase();
  if (!email || !allowlist.includes(email)) return json(200, { ok: true, granted: false });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Idempotent grant
  const { data: existing, error: selectErr } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (selectErr) {
    console.error("role select error", selectErr);
    return json(500, { error: "role_lookup_failed" });
  }
  if (existing) return json(200, { ok: true, granted: true, already: true });

  const { error: insertErr } = await admin.from("user_roles").insert({ user_id: userData.user.id, role: "admin" });
  if (insertErr) {
    console.error("role insert error", insertErr);
    return json(500, { error: "role_insert_failed" });
  }

  return json(200, { ok: true, granted: true });
});
