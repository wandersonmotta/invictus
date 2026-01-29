// Lovable Cloud Function: auth-signup-with-invite
// Public endpoint (verify_jwt=false) that creates a user ONLY if a valid invite code exists.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Body = {
  email?: string;
  password?: string;
  inviteCode?: string;
};

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeInvite(code: string) {
  return code.trim().toUpperCase();
}

function isValidEmail(email: string) {
  return email.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return json(500, { error: "server_misconfigured" });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const inviteCode = normalizeInvite(String(body.inviteCode ?? ""));

  if (!isValidEmail(email)) return json(400, { error: "invalid_email" });
  if (password.length < 8 || password.length > 72) return json(400, { error: "invalid_password" });
  if (inviteCode.length < 4 || inviteCode.length > 64) return json(400, { error: "invalid_invite" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // 1) Validate invite
  const { data: invite, error: inviteErr } = await admin
    .from("invite_codes")
    .select("id, code, active, expires_at, max_uses, uses_count")
    .eq("code", inviteCode)
    .maybeSingle();

  if (inviteErr) {
    console.error("Invite lookup error", inviteErr);
    return json(500, { error: "invite_lookup_failed" });
  }
  if (!invite || !invite.active) return json(400, { error: "invite_invalid" });
  if (invite.expires_at && new Date(invite.expires_at).getTime() <= Date.now()) return json(400, { error: "invite_expired" });
  if (invite.uses_count >= invite.max_uses) return json(400, { error: "invite_used" });

  // 2) Create user (auto-confirm)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr) {
    const msg = String((createErr as any)?.message ?? "");
    console.warn("Create user error", msg);
    if (msg.toLowerCase().includes("already registered")) {
      return json(409, { error: "email_already_registered" });
    }
    return json(400, { error: "signup_failed" });
  }

  const userId = created.user?.id;
  if (!userId) return json(500, { error: "signup_failed" });

  // 3) Ensure profile exists (defaults to access_status='pending')
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existingProfile) {
    const { error: profileErr } = await admin.from("profiles").insert({ user_id: userId });
    if (profileErr) {
      console.error("Profile insert error", profileErr);
      // Not fatal for signup: keep going.
    }
  }

  // 4) Redeem invite (best-effort)
  const { error: bumpErr } = await admin
    .from("invite_codes")
    .update({ uses_count: invite.uses_count + 1 })
    .eq("id", invite.id);
  if (bumpErr) console.error("Invite bump error", bumpErr);

  const { error: redemptionErr } = await admin.from("invite_redemptions").insert({
    invite_id: invite.id,
    user_id: userId,
  });
  if (redemptionErr) console.error("Invite redemption insert error", redemptionErr);

  return json(200, { ok: true });
});
