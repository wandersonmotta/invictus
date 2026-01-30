// Lovable Cloud Function: send-password-reset
// Public endpoint (verify_jwt=false) that generates a Supabase recovery link and sends it via Resend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Body = {
  email?: string;
  redirectTo?: string;
};

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ok(accepted: boolean) {
  // IMPORTANT: accepted only reflects provider availability, NOT whether the email exists.
  // This prevents user enumeration while still allowing the UI to show provider outages.
  return json(200, { ok: true, provider: "resend", accepted });
}

function isValidEmail(email: string) {
  return email.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeUrl(url: string) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");

  if (!SUPABASE_URL || !SERVICE_ROLE || !RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    console.error("send-password-reset: missing env", {
      hasUrl: Boolean(SUPABASE_URL),
      hasServiceRole: Boolean(SERVICE_ROLE),
      hasResendKey: Boolean(RESEND_API_KEY),
      hasFromEmail: Boolean(RESEND_FROM_EMAIL),
    });
    // Provider misconfigured/unavailable (UI can show temporary outage).
    return ok(false);
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const redirectTo = safeUrl(String(body.redirectTo ?? ""));

  // Always respond generically (avoid user enumeration)
  if (!isValidEmail(email) || !redirectTo) {
    // Treat as accepted so UI doesn't reveal invalid/unknown emails; simply no-op.
    return ok(true);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const resend = new Resend(RESEND_API_KEY);

  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo,
      },
    });

    if (error) {
      // Do not leak whether email exists. Log a compact marker only.
      console.warn("send-password-reset: generateLink_failed", {
        code: (error as any)?.code,
        message: String((error as any)?.message ?? ""),
      });
      // IMPORTANT: still return accepted=true to avoid leaking whether email exists.
      return ok(true);
    }

    const actionLink = (data as any)?.properties?.action_link as string | undefined;
    if (!actionLink) {
      console.warn("send-password-reset: missing_action_link");
      // Still accepted=true to avoid leaking anything.
      return ok(true);
    }

    const brand = "INVICTUS FRATERNIDADE";
    const subject = "Redefinir sua senha";
    const escapedEmail = escapeHtml(email);
    const escapedAction = escapeHtml(actionLink);

    const html = `
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${brand} — Redefinição de senha</title>
  </head>
  <body style="margin:0;padding:0;background:#0b0d10;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b0d10;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#0f1318;border:1px solid #2b2f38;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 24px 10px 24px;">
                <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;letter-spacing:0.32em;text-transform:uppercase;color:#d8b56d;font-size:11px;font-weight:700;">
                  ${brand}
                </div>
                <h1 style="margin:14px 0 0 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:22px;line-height:1.25;color:#f3f4f6;">
                  Redefinir senha
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 24px 0 24px;">
                <p style="margin:0 0 14px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:14px;line-height:1.6;color:#c7c9cf;">
                  Recebemos um pedido para redefinir a senha da conta <strong style="color:#f3f4f6;">${escapedEmail}</strong>.
                </p>
                <p style="margin:0 0 18px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:14px;line-height:1.6;color:#c7c9cf;">
                  Para continuar, clique no botão abaixo:
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 24px 6px 24px;">
                <a href="${escapedAction}" target="_blank" rel="noreferrer"
                   style="display:inline-block;background:#d8b56d;color:#0b0d10;text-decoration:none;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:14px;font-weight:800;letter-spacing:0.02em;padding:14px 18px;border-radius:12px;border:1px solid #f2d08c;">
                  Redefinir senha
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 24px 0 24px;">
                <p style="margin:0 0 14px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:12px;line-height:1.6;color:#9aa0aa;">
                  Se o botão não funcionar, copie e cole este link no navegador:
                </p>
                <p style="margin:0 0 22px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;line-height:1.6;word-break:break-all;color:#c7c9cf;">
                  ${escapedAction}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px 24px;">
                <p style="margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:12px;line-height:1.6;color:#9aa0aa;">
                  Se você não solicitou a redefinição, pode ignorar este e-mail.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    const from = `${brand} <${RESEND_FROM_EMAIL}>`;
    const { error: sendErr } = await resend.emails.send({
      from,
      to: [email],
      subject,
      html,
    });

    if (sendErr) {
      console.error("send-password-reset: resend_send_failed", {
        name: (sendErr as any)?.name,
        message: String((sendErr as any)?.message ?? ""),
      });
      // Provider error (UI can show temporary outage).
      return ok(false);
    }

    console.log("send-password-reset: sent");
    return ok(true);
  } catch (e) {
    console.error("send-password-reset: exception", e);
    return ok(false);
  }
});
