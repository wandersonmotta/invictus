import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Message {
  role: "user" | "assistant" | "system" | "ai";
  content: string;
}

interface AgentPresence {
  user_id: string;
}

interface Ticket {
  assigned_to: string | null;
}


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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate caller
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { messages, subject } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Classify priority via AI
    let priority = "baixo";
    try {
      const GOOGLE_AI_STUDIO_API_KEY = Deno.env.get("GOOGLE_AI_STUDIO_API_KEY");
      if (GOOGLE_AI_STUDIO_API_KEY) {
        const conversationText = (messages as Message[])
          .map((m) => `${m.role === "user" ? "Membro" : "IA"}: ${m.content}`)
          .join("\n");

        const classifyResp = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GOOGLE_AI_STUDIO_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gemini-3.0-flash-preview",
            messages: [
              {
                role: "system",
                content: `Você é um classificador de tickets de suporte. Analise a conversa abaixo e classifique a prioridade em EXATAMENTE uma palavra:

- "urgente": Problemas críticos como pagamento bloqueado, acesso perdido, dados corrompidos, conta suspensa, erros que impedem o uso da plataforma
- "moderado": Dúvidas técnicas, problemas parciais, funcionalidades com comportamento inesperado, reclamações
- "baixo": Perguntas gerais, curiosidades, solicitações simples, elogios, feedback

Responda APENAS com uma das três palavras: urgente, moderado ou baixo`,
              },
              {
                role: "user",
                content: conversationText,
              },
            ],
            temperature: 0.1,
            max_tokens: 10,
          }),
        });

        if (classifyResp.ok) {
          const classifyData = await classifyResp.json();
          const result = (classifyData.choices?.[0]?.message?.content || "").trim().toLowerCase();
          if (["urgente", "moderado", "baixo"].includes(result)) {
            priority = result;
          }
        }
      }
    } catch (e) {
      console.error("Priority classification error:", e);
    }

    // 2. Find online agent with fewest active tickets
    let assignedTo: string | null = null;
    try {
      const cutoff = new Date(Date.now() - 60_000).toISOString();

      // Get online agents
      const { data: onlineAgents } = await admin
        .from("support_agent_presence")
        .select("user_id, active_ticket_count")
        .gte("last_heartbeat", cutoff);

      if (onlineAgents && onlineAgents.length > 0) {
        // Count actual assigned tickets per agent
        const agentIds = (onlineAgents as AgentPresence[]).map((a) => a.user_id);

        const { data: ticketCounts } = await admin
          .from("support_tickets")
          .select("assigned_to")
          .in("assigned_to", agentIds)
          .in("status", ["assigned", "escalated"]);

        const countMap: Record<string, number> = {};
        agentIds.forEach((id: string) => (countMap[id] = 0));
        (ticketCounts as Ticket[] || []).forEach((t) => {
          if (t.assigned_to) countMap[t.assigned_to] = (countMap[t.assigned_to] || 0) + 1;
        });


        // Pick agent with fewest tickets
        let minCount = Infinity;
        for (const id of agentIds) {
          if (countMap[id] < minCount) {
            minCount = countMap[id];
            assignedTo = id;
          }
        }
      }
    } catch (e) {
      console.error("Agent distribution error:", e);
    }

    // 3. Create ticket
    const ticketStatus = assignedTo ? "assigned" : "escalated";
    const { data: ticket, error: ticketErr } = await admin
      .from("support_tickets")
      .insert({
        user_id: userId,
        status: ticketStatus,
        priority,
        escalated_at: new Date().toISOString(),
        assigned_to: assignedTo,
        subject: subject || null,
      })
      .select("id")
      .single();

    if (ticketErr || !ticket) {
      console.error("Ticket creation error:", ticketErr);
      return new Response(JSON.stringify({ error: "Failed to create ticket" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Save all messages (user + AI) via service role - bypasses RLS
    const messagesToSave = (messages as Message[]).map((msg) => ({
      ticket_id: ticket.id,
      sender_type: msg.role === "user" ? "user" : "ai",
      sender_id: msg.role === "user" ? userId : null,
      body: msg.content,
    }));


    const { error: msgErr } = await admin.from("support_messages").insert(messagesToSave);
    if (msgErr) {
      console.error("Messages save error:", msgErr);
    }

    // 5. Update agent active ticket count
    if (assignedTo) {
      const { data: newCount } = await admin
        .from("support_tickets")
        .select("id")
        .eq("assigned_to", assignedTo)
        .in("status", ["assigned", "escalated"]);

      await admin
        .from("support_agent_presence")
        .update({ active_ticket_count: newCount?.length || 0 })
        .eq("user_id", assignedTo);
    }

    return new Response(
      JSON.stringify({ ticketId: ticket.id, priority, assignedTo }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("support-escalate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
