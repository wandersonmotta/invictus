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
  // Prefer the standard env var names injected in the function runtime.
  // Keep fallbacks for compatibility with older setups.
  const ANON =
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
    Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !ANON || !SERVICE_ROLE) {
    console.error("Missing SUPABASE env vars", {
      hasUrl: Boolean(SUPABASE_URL),
      hasAnon: Boolean(ANON),
      hasServiceRole: Boolean(SERVICE_ROLE),
    });
    return json(500, { error: "server_misconfigured" });
  }

  const allowlist = parseAllowlist(Deno.env.get("ADMIN_EMAIL_ALLOWLIST"));
  if (allowlist.length === 0) return json(200, { ok: true, granted: false });

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  // This function is called opportunistically by the client. If there's no
  // session/token, just return a safe no-op instead of erroring.
  if (!token) return json(200, { ok: true, granted: false });

  // Validate user from token.
  // NOTE: Supabase auth-js may try to read from a persisted session in edge runtimes.
  // To avoid any session-storage assumptions, call the Auth REST endpoint directly.
  let authedUserId: string | null = null;
  let authedEmail: string | null = null;
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${token}`,
      },
    });
    const text = await r.text();
    if (!r.ok) {
      // Safe no-op; we only grant role when allowlisted.
      console.warn("auth user lookup failed", r.status);
      return json(200, { ok: true, granted: false });
    }
    const u = JSON.parse(text);
    authedUserId = u?.id ?? null;
    authedEmail = (u?.email ?? "").toLowerCase() || null;
  } catch (e) {
    console.warn("auth user lookup exception", e);
    return json(200, { ok: true, granted: false });
  }

  const email = authedEmail ?? "";
  if (!email || !allowlist.includes(email)) return json(200, { ok: true, granted: false });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Idempotent grant
  const { data: existing, error: selectErr } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", authedUserId)
    .eq("role", "admin")
    .maybeSingle();
  if (selectErr) {
    console.error("role select error", selectErr);
    return json(500, { error: "role_lookup_failed" });
  }
  if (existing) return json(200, { ok: true, granted: true, already: true });

  const { error: insertErr } = await admin
    .from("user_roles")
    .insert({ user_id: authedUserId, role: "admin" });
  if (insertErr) {
    console.error("role insert error", insertErr);
    return json(500, { error: "role_insert_failed" });
  }

  return json(200, { ok: true, granted: true });
});
