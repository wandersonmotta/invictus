import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `Você é o assistente virtual da Fraternidade Invictus — uma comunidade exclusiva de empreendedores e líderes.

Seu papel:
- Responder dúvidas sobre a plataforma, funcionalidades, planos e serviços da Fraternidade Invictus.
- Ser cordial, profissional, objetivo e empático.
- Sempre tratar o membro com respeito e exclusividade.

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
4. Tente resolver a dúvida do membro ao máximo. Nunca sugira falar com atendente humano logo de início.
5. Se após várias tentativas (pelo menos 3 trocas de mensagem) você perceber que não está conseguindo ajudar, pergunte educadamente se o membro gostaria de falar com um especialista humano.
6. Se o membro confirmar que deseja falar com um atendente humano (ex: "sim", "quero", "gostaria"), inclua EXATAMENTE o texto "[ESCALATE]" no final da sua resposta, junto com uma mensagem gentil como: "Entendo! Vou transferir você para um dos nossos atendentes. Aguarde um momento."
7. Nunca invente informações sobre valores, preços ou detalhes que você não sabe.
8. Não mencione que você é uma IA a menos que o membro pergunte diretamente.`;

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

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch AI training entries using service role
    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: trainingEntries } = await supabaseService
      .from("ai_training_entries")
      .select("title, content, category")
      .eq("active", true)
      .order("category");

    // Build system prompt with knowledge base
    let systemPrompt = BASE_SYSTEM_PROMPT;
    if (trainingEntries && trainingEntries.length > 0) {
      systemPrompt += "\n\n## Base de Conhecimento\n\n";
      systemPrompt += trainingEntries
        .map((e: any) => `### ${e.title}${e.category ? ` (${e.category})` : ""}\n${e.content}`)
        .join("\n\n");
    }

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
          { role: "system", content: systemPrompt },
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
        return new Response(JSON.stringify({ error: "Payment required." }), {
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

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("support-chat-ephemeral error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
