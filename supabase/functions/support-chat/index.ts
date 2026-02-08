import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o assistente virtual da Fraternidade Invictus — uma comunidade exclusiva de empreendedores e líderes.

Seu papel:
- Responder dúvidas sobre a plataforma, funcionalidades, planos e serviços da Fraternidade Invictus.
- Ser cordial, profissional, objetivo e empático.
- Sempre tratar o membro com respeito e exclusividade.
- Se não souber a resposta, seja honesto e sugira que o membro fale com um atendente humano.

Funcionalidades que você conhece:
- Feed social exclusivo para membros
- Mapa de membros com localização
- Sistema de mensagens diretas (Direct)
- Comunidade com canais temáticos
- Leads & Marketing (conexão Meta Ads, Google Ads)
- Carteira digital com comissões
- Sistema de pontos e reconhecimento
- Treinamentos (Class)
- Serviços (Limpa Nome, etc.)
- Faturas e planos de assinatura

Regras:
1. Responda em português brasileiro.
2. Seja conciso, mas completo.
3. Use formatação markdown quando útil.
4. Se o membro pedir explicitamente para falar com atendente humano, ou se você não conseguir resolver após 3 tentativas, inclua EXATAMENTE o texto "[ESCALATE]" no final da sua resposta.
5. Nunca invente informações sobre valores, preços ou detalhes que você não sabe.
6. Ao escalonar, seja gentil: "Entendo! Vou transferir você para um dos nossos atendentes. Aguarde um momento."`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { ticketId, message } = await req.json();
    if (!ticketId || !message) {
      return new Response(JSON.stringify({ error: "ticketId and message are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ticket belongs to user and is in ai_handling status
    const { data: ticket, error: ticketErr } = await supabase
      .from("support_tickets")
      .select("id, status, user_id")
      .eq("id", ticketId)
      .single();

    if (ticketErr || !ticket || ticket.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ticket.status !== "ai_handling") {
      return new Response(JSON.stringify({ error: "Ticket is not in AI handling mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save user message using service role to bypass RLS for insert
    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabaseService.from("support_messages").insert({
      ticket_id: ticketId,
      sender_type: "user",
      sender_id: userId,
      body: message,
    });

    // Fetch conversation history for context
    const { data: history } = await supabaseService
      .from("support_messages")
      .select("sender_type, body")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })
      .limit(50);

    const messages = (history || []).map((m: any) => ({
      role: m.sender_type === "user" ? "user" : "assistant",
      content: m.body || "",
    }));

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required for AI service." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // We need to collect the full response to save it AND check for escalation
    // But also stream it to the user. We'll use a TransformStream.
    const reader = aiResponse.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let buffer = "";

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Process in background
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Forward chunk to client
          await writer.write(encoder.encode(chunk));

          // Parse for content accumulation
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullContent += content;
            } catch {
              // partial json, ignore
            }
          }
        }

        // Save AI response
        await supabaseService.from("support_messages").insert({
          ticket_id: ticketId,
          sender_type: "ai",
          sender_id: null,
          body: fullContent,
        });

        // Check for escalation
        if (fullContent.includes("[ESCALATE]")) {
          await supabaseService
            .from("support_tickets")
            .update({
              status: "escalated",
              escalated_at: new Date().toISOString(),
            })
            .eq("id", ticketId);
        }
      } catch (e) {
        console.error("Stream processing error:", e);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("support-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
