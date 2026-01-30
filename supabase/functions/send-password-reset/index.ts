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

function isValidFrom(from: string) {
  const v = from.trim();
  // Either a plain email or the classic RFC-ish display format: Name <email@domain>
  if (isValidEmail(v)) return true;
  const m = v.match(/^(.+?)\s*<([^>]+)>$/);
  if (!m) return false;
  const addr = (m[2] ?? "").trim();
  return isValidEmail(addr);
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

function buildPasswordResetEmail(params: {
  brand: string;
  email: string;
  actionLink: string;
  logoUrl: string;
}) {
  const { brand, email, actionLink, logoUrl } = params;
  const escapedEmail = escapeHtml(email);
  const escapedAction = escapeHtml(actionLink);
  const escapedLogo = escapeHtml(logoUrl);

  const subject = "Redefinir sua senha";
  // Preheader: aparece em alguns clients como “preview”, mas fica oculto no HTML.
  const preheader = "Link seguro para redefinir sua senha. Se não solicitou, ignore.";

  // Texto simples (ajuda entregabilidade e compatibilidade)
  const text =
    `${brand}\n\n` +
    `Recebemos um pedido para redefinir a senha da conta: ${email}\n\n` +
    `Use este link para continuar:\n${actionLink}\n\n` +
    `Se você não solicitou a redefinição, ignore este e-mail.`;

  const html = `
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${brand} — Redefinição de senha</title>
  </head>
  <body style="margin:0;padding:0;background:#07080a;">
    <!-- Preheader (hidden) -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(preheader)}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07080a;padding:34px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#0b0d10;border:1px solid #252a33;border-radius:18px;overflow:hidden;">
            <!-- Gold top bar -->
            <tr>
              <td style="height:6px;background:linear-gradient(90deg,#8a6a2f,#f2d08c,#8a6a2f);"></td>
            </tr>

            <!-- Header -->
            <tr>
              <td style="padding:26px 26px 12px 26px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;letter-spacing:0.34em;text-transform:uppercase;color:#d8b56d;font-size:11px;font-weight:800;">
                        ${brand}
                      </div>
                      <h1 style="margin:12px 0 0 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:22px;line-height:1.25;color:#f3f4f6;">
                        Redefinir senha
                      </h1>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <img
                        src="${escapedLogo}"
                        width="120"
                        alt="Logo da Invictus"
                        style="display:block;max-width:120px;height:auto;opacity:0.98;"
                      />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body copy -->
            <tr>
              <td style="padding:8px 26px 0 26px;">
                <p style="margin:0 0 14px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:14px;line-height:1.7;color:#c7c9cf;">
                  Recebemos um pedido para redefinir a senha da conta <strong style="color:#f3f4f6;">${escapedEmail}</strong>.
                </p>
                <p style="margin:0 0 18px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:14px;line-height:1.7;color:#c7c9cf;">
                  Para continuar com segurança, use o botão abaixo.
                </p>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td align="center" style="padding:6px 26px 10px 26px;">
                <a href="${escapedAction}" target="_blank" rel="noreferrer"
                   style="display:inline-block;background:#d8b56d;color:#0b0d10;text-decoration:none;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:14px;font-weight:900;letter-spacing:0.02em;padding:14px 20px;border-radius:14px;border:1px solid #f2d08c;box-shadow:0 10px 26px rgba(0,0,0,0.45);">
                  Redefinir senha
                </a>
              </td>
            </tr>

            <!-- Fallback link -->
            <tr>
              <td style="padding:12px 26px 0 26px;">
                <p style="margin:0 0 10px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:12px;line-height:1.7;color:#9aa0aa;">
                  Se o botão não funcionar, copie e cole este link no navegador:
                </p>
                <p style="margin:0 0 18px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;line-height:1.7;word-break:break-all;color:#d1d5db;">
                  ${escapedAction}
                </p>
              </td>
            </tr>

            <!-- Security / footer -->
            <tr>
              <td style="padding:0 26px 22px 26px;">
                <div style="border-top:1px solid #1f242c;padding-top:16px;">
                  <p style="margin:0 0 10px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:12px;line-height:1.7;color:#9aa0aa;">
                    Se você não solicitou a redefinição, pode ignorar este e-mail.
                  </p>
                  <p style="margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:11px;line-height:1.7;color:#6b7280;letter-spacing:0.12em;text-transform:uppercase;">
                    ${brand}
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
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
    const logoUrl = `${SUPABASE_URL}/storage/v1/object/public/email-assets/invictus-logo.png?v=1`;
    const { subject, text, html } = buildPasswordResetEmail({
      brand,
      email,
      actionLink,
      logoUrl,
    });

    const fromRaw = (RESEND_FROM_EMAIL ?? "").trim();
    if (!fromRaw || !isValidFrom(fromRaw)) {
      console.error("send-password-reset: invalid_from_config", {
        fromPreview: fromRaw.slice(0, 80),
      });
      // Provider misconfigured/unavailable (UI can show temporary outage).
      return ok(false);
    }

    // Allow either a plain email (noreply@domain.com) or already-formatted value (Brand <noreply@domain.com>)
    const from = fromRaw.includes("<") ? fromRaw : `${brand} <${fromRaw}>`;
    const { error: sendErr } = await resend.emails.send({
      from,
      to: [email],
      subject,
      text,
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
