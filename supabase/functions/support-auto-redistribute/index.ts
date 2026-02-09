import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIMEOUT_MINUTES = 15;

interface UserRole {
  role: string;
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

    // Validate caller is suporte/admin
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

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Check caller has suporte role
    const callerId = claimsData.claims.sub as string;
    const { data: callerRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    const roleNames = (callerRoles as UserRole[] || []).map((r) => r.role);

    if (!roleNames.includes("admin") && !roleNames.includes("suporte") && !roleNames.includes("suporte_gerente")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find assigned tickets where last agent message > TIMEOUT_MINUTES
    const { data: assignedTickets } = await admin
      .from("support_tickets")
      .select("id, assigned_to")
      .eq("status", "assigned");

    if (!assignedTickets || assignedTickets.length === 0) {
      return new Response(JSON.stringify({ redistributed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cutoffTime = new Date(Date.now() - TIMEOUT_MINUTES * 60_000).toISOString();
    const presenceCutoff = new Date(Date.now() - 60_000).toISOString();

    // Get online agents
    const { data: onlineAgents } = await admin
      .from("support_agent_presence")
      .select("user_id")
      .gte("last_heartbeat", presenceCutoff);
    const onlineIds = (onlineAgents as AgentPresence[] || []).map((a) => a.user_id);


    let redistributedCount = 0;

    for (const ticket of assignedTickets) {
      // Check last agent message time
      const { data: lastAgentMsg } = await admin
        .from("support_messages")
        .select("created_at")
        .eq("ticket_id", ticket.id)
        .eq("sender_type", "agent")
        .order("created_at", { ascending: false })
        .limit(1);

      // Also check if there are user messages after the last agent message (meaning user is waiting)
      const lastAgentTime = lastAgentMsg?.[0]?.created_at;

      // If no agent message at all, check ticket escalated_at
      let shouldRedistribute = false;
      if (!lastAgentTime) {
        // No agent response ever - check ticket updated_at
        const { data: ticketData } = await admin
          .from("support_tickets")
          .select("updated_at")
          .eq("id", ticket.id)
          .single();
        if (ticketData && ticketData.updated_at < cutoffTime) {
          shouldRedistribute = true;
        }
      } else if (lastAgentTime < cutoffTime) {
        shouldRedistribute = true;
      }

      if (!shouldRedistribute) continue;

      // Find available agent (online, not current)
      const candidates = onlineIds.filter((id: string) => id !== ticket.assigned_to);
      if (candidates.length === 0) continue;

      // Pick one with fewest tickets
      const { data: ticketCounts } = await admin
        .from("support_tickets")
        .select("assigned_to")
        .in("assigned_to", candidates)
        .in("status", ["assigned", "escalated"]);

      const countMap: Record<string, number> = {};
      candidates.forEach((id: string) => (countMap[id] = 0));
      (ticketCounts as Ticket[] || []).forEach((t) => {
        if (t.assigned_to) countMap[t.assigned_to] = (countMap[t.assigned_to] || 0) + 1;
      });


      let bestAgent = candidates[0];
      let minCount = Infinity;
      for (const id of candidates) {
        if (countMap[id] < minCount) {
          minCount = countMap[id];
          bestAgent = id;
        }
      }

      // Transfer
      await admin
        .from("support_tickets")
        .update({ assigned_to: bestAgent, status: "escalated" })
        .eq("id", ticket.id);

      await admin.from("support_messages").insert({
        ticket_id: ticket.id,
        sender_type: "system",
        body: "🔄 Ticket transferido automaticamente (timeout de resposta).",
      });

      redistributedCount++;
    }

    // Update active ticket counts for all agents
    if (redistributedCount > 0 && onlineIds.length > 0) {
      for (const agentId of onlineIds) {
        const { data: count } = await admin
          .from("support_tickets")
          .select("id")
          .eq("assigned_to", agentId)
          .in("status", ["assigned", "escalated"]);

        await admin
          .from("support_agent_presence")
          .update({ active_ticket_count: count?.length || 0 })
          .eq("user_id", agentId);
      }
    }

    return new Response(
      JSON.stringify({ redistributed: redistributedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("support-auto-redistribute error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
