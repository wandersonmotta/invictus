import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUMMARY_PROMPT = `Você é um analista de qualidade de atendimento. Analise a conversa de suporte abaixo e gere um resumo estruturado em português brasileiro.

O resumo deve conter:

**Problema reportado:** O que o usuário relatou ou perguntou.
**Atendimento:** O que a IA e/ou o atendente humano responderam e como conduziram o caso.
**Resolução:** Qual foi o resultado final — se o problema foi solucionado, parcialmente resolvido, ou não resolvido.

Seja objetivo e conciso. Máximo 300 palavras.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId } = await req.json();
    if (!ticketId) {
      return new Response(JSON.stringify({ error: "ticketId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all messages for the ticket
    const { data: messages, error: msgErr } = await supabaseAdmin
      .from("support_messages")
      .select("sender_type, body, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (msgErr || !messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build conversation text
    const conversationText = messages
      .map((m: any) => {
        const role =
          m.sender_type === "user"
            ? "Usuário"
            : m.sender_type === "ai"
              ? "IA"
              : "Atendente";
        return `[${role}]: ${m.body || "(anexo)"}`;
      })
      .join("\n");

    // Call Google Gemini API directly (OpenAI compatible endpoint)
    const GOOGLE_AI_STUDIO_API_KEY = Deno.env.get("GOOGLE_AI_STUDIO_API_KEY");
    if (!GOOGLE_AI_STUDIO_API_KEY) {
      return new Response(JSON.stringify({ error: "AI configuration missing: GOOGLE_AI_STUDIO_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GOOGLE_AI_STUDIO_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-3.0-flash-preview",
          messages: [
            { role: "system", content: SUMMARY_PROMPT },
            { role: "user", content: conversationText },
          ],
          stream: false,
        }),
      }
    );

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const summary =
      aiData.choices?.[0]?.message?.content || "Resumo indisponível.";

    // Save summary to ticket
    await supabaseAdmin
      .from("support_tickets")
      .update({ ai_summary: summary })
      .eq("id", ticketId);

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("support-summarize error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
