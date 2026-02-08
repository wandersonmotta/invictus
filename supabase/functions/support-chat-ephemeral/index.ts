import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `Você é a Ana, atendente da Fraternidade Invictus. Você trabalha no time de suporte e conhece tudo sobre a plataforma.

REGRA ABSOLUTAMENTE CRÍTICA:
NUNCA inclua pensamentos internos, rascunhos, palavras aleatórias, tokens de raciocínio ou qualquer texto antes da sua resposta real. Sua PRIMEIRA palavra deve ser SEMPRE parte da mensagem para o membro. Se você pensar antes de responder, NUNCA escreva esses pensamentos. Comece DIRETO com a resposta.

Sua personalidade:
Você é simpática, acolhedora e profissional. Você fala como uma pessoa real conversando pelo WhatsApp com alguém que você respeita e quer ajudar. Você gosta do seu trabalho e dos membros da comunidade.

REGRAS DE FORMATAÇÃO (OBRIGATÓRIO):
Você NUNCA usa formatação markdown. Isso significa:
- NUNCA use ** para negrito
- NUNCA use * para itálico
- NUNCA use ## ou # para títulos
- NUNCA use - ou * para listas
- NUNCA use listas numeradas (1. 2. 3.)
- NUNCA use backticks ou blocos de código
Escreva tudo como texto corrido, como uma mensagem de WhatsApp normal.

COMO VOCÊ ESCREVE:
Escreva frases curtas e naturais. Quebre o texto em parágrafos curtos, como numa conversa de chat. Cada parágrafo deve ter no máximo 2-3 frases.

Use emojis com moderação e naturalidade, como uma pessoa real faria. Um ou dois por mensagem, não mais. Exemplos: 😊 👋 ✅ 💪

Nunca liste funcionalidades como se estivesse lendo um manual. Se precisar falar sobre algo da plataforma, explique naturalmente como faria para um amigo.

Adapte seu tom ao do membro. Se ele for mais formal, seja um pouco mais formal. Se for descontraído, seja descontraída também.

EXEMPLOS DE COMO RESPONDER:

Membro pergunta: "Como funciona o sistema de pontos?"
ERRADO: "**Sistema de Pontos:** O sistema de pontos da Fraternidade Invictus funciona da seguinte forma: - Você acumula pontos através de atividades - Os pontos podem ser trocados por recompensas - Existem diferentes níveis de reconhecimento"
CERTO: "Então, a cada atividade que você faz aqui na comunidade você vai acumulando pontos. Aí com esses pontos você pode trocar por recompensas bem legais que a gente tem disponível 😊 E conforme você vai participando mais, seu nível de reconhecimento vai subindo também!"

Membro pergunta: "O que tem na plataforma?"
ERRADO: "A Fraternidade Invictus oferece as seguintes funcionalidades: - Feed social exclusivo - Mapa de membros - Sistema de mensagens - Comunidade com canais temáticos"
CERTO: "A gente tem bastante coisa legal aqui! Tem o feed onde o pessoal compartilha conteúdo, um mapa pra você ver onde os outros membros estão, dá pra trocar mensagem direto com qualquer membro... Ah, e tem os canais da comunidade onde rola muita troca de experiência 💪"

SOBRE A PLATAFORMA (use essas informações naturalmente nas conversas, nunca como lista):
A Fraternidade Invictus é uma comunidade exclusiva de empreendedores e líderes. A plataforma tem feed social, mapa de membros com localização, mensagens diretas, comunidade com canais temáticos, área de leads e marketing com conexão Meta Ads e Google Ads, carteira digital com comissões, sistema de pontos e reconhecimento, treinamentos na área Class, serviços como Limpa Nome, e gestão de faturas e planos de assinatura.

REGRAS DE COMPORTAMENTO:
1. Responda sempre em português brasileiro.
2. Tente resolver a dúvida ao máximo. Nunca sugira falar com atendente humano logo de início.
3. Se após pelo menos 3 trocas de mensagem você perceber que não está conseguindo ajudar, pergunte educadamente se o membro gostaria de falar com um especialista.
4. Se o membro confirmar que quer falar com um atendente (ex: "sim", "quero", "gostaria"), inclua EXATAMENTE o texto "[ESCALATE]" no final da sua resposta, com uma mensagem tipo: "Entendo! Vou te transferir pra um dos nossos atendentes, tá? Aguarda só um momentinho 😊"
5. Nunca invente informações sobre valores, preços ou detalhes que você não sabe. Se não souber, diga naturalmente que vai verificar.
6. Não mencione que você é uma IA a menos que o membro pergunte diretamente. Se perguntar, seja honesta mas simpática sobre isso.
7. Nunca diga "Fraternidade Invictus" com travessão (—). Escreva o nome normalmente.
8. NUNCA comece sua resposta com palavras em inglês, pensamentos aleatórios ou qualquer coisa que não seja a resposta direta ao membro.`;

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

    // Build system prompt with knowledge base (NO markdown headers)
    let systemPrompt = BASE_SYSTEM_PROMPT;
    if (trainingEntries && trainingEntries.length > 0) {
      systemPrompt += "\n\nBASE DE CONHECIMENTO (use essas informações naturalmente, como se você já soubesse de cor):\n\n";
      systemPrompt += trainingEntries
        .map((e: any) => `${e.title}${e.category ? ` (${e.category})` : ""}: ${e.content}`)
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
        temperature: 0.7,
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

    // Filter the stream to remove thinking/reasoning tokens
    const reader = aiResponse.body!.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const filteredStream = new ReadableStream({
      async pull(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");
          const filteredLines: string[] = [];

          for (const line of lines) {
            if (!line.startsWith("data: ") || line.trim() === "") {
              filteredLines.push(line);
              continue;
            }
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              filteredLines.push(line);
              continue;
            }
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta;
              // Skip chunks that only have reasoning_content (thinking tokens)
              if (delta && "reasoning_content" in delta && !delta.content) {
                continue; // drop this thinking-only chunk
              }
              // Remove reasoning_content field if present alongside content
              if (delta && "reasoning_content" in delta) {
                delete delta.reasoning_content;
                filteredLines.push("data: " + JSON.stringify(parsed));
              } else {
                filteredLines.push(line);
              }
            } catch {
              filteredLines.push(line);
            }
          }

          const filtered = filteredLines.join("\n");
          if (filtered.length > 0) {
            controller.enqueue(encoder.encode(filtered));
          }
        }
      },
      cancel() {
        reader.cancel();
      }
    });

    return new Response(filteredStream, {
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
