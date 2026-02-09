import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface UserRole {
  role: string;
  user_id?: string;
}

interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
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
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check caller has admin or financeiro_gerente role
    const { data: callerRoles } = await supabaseService
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roles = (callerRoles as UserRole[] || []).map((r) => r.role);

    const canManage = roles.includes("admin") || roles.includes("financeiro_gerente");
    if (!canManage) {
      return new Response(JSON.stringify({ error: "Forbidden – admin or gerente only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, email, password, fullName, targetUserId, position } = await req.json();

    if (action === "create") {
      if (!email || !password || !fullName) {
        return new Response(JSON.stringify({ error: "email, password and fullName are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: newUser, error: createErr } = await supabaseService.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newUserId = newUser.user.id;

      await supabaseService.from("profiles").insert({
        user_id: newUserId,
        display_name: fullName,
        first_name: fullName.split(" ")[0],
        last_name: fullName.split(" ").slice(1).join(" ") || null,
        access_status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      });

      // Always assign financeiro role
      await supabaseService.from("user_roles").insert({
        user_id: newUserId,
        role: "financeiro",
      });

      // If position is "gerente", also assign financeiro_gerente role
      if (position === "gerente") {
        await supabaseService.from("user_roles").insert({
          user_id: newUserId,
          role: "financeiro_gerente",
        });
      }

      return new Response(JSON.stringify({ success: true, userId: newUserId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "remove") {
      if (!targetUserId) {
        return new Response(JSON.stringify({ error: "targetUserId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Remove both financeiro and financeiro_gerente roles
      await supabaseService
        .from("user_roles")
        .delete()
        .eq("user_id", targetUserId)
        .in("role", ["financeiro", "financeiro_gerente"]);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      const { data: financeiroRoles } = await supabaseService
        .from("user_roles")
        .select("user_id")
        .eq("role", "financeiro");

      const userIds = (financeiroRoles as UserRole[] || []).map((r) => r.user_id as string);


      if (userIds.length === 0) {
        return new Response(JSON.stringify({ agents: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Exclude users who also have admin role
      const { data: adminRoles } = await supabaseService
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .in("user_id", userIds);

      const adminIds = new Set((adminRoles as UserRole[] || []).map((r) => r.user_id as string));

      const filteredIds = userIds.filter((uid: string) => !adminIds.has(uid));

      if (filteredIds.length === 0) {
        return new Response(JSON.stringify({ agents: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check which ones also have financeiro_gerente role
      const { data: gerenteRoles } = await supabaseService
        .from("user_roles")
        .select("user_id")
        .eq("role", "financeiro_gerente")
        .in("user_id", filteredIds);

      const gerenteIds = new Set((gerenteRoles as UserRole[] || []).map((r) => r.user_id as string));


      const { data: profiles } = await supabaseService
        .from("profiles")
        .select("user_id, display_name, avatar_url, first_name, last_name")
        .in("user_id", filteredIds);

      const agents = await Promise.all(
        filteredIds.map(async (uid: string) => {
          const profile = (profiles as Profile[] || []).find((p) => p.user_id === uid);

          const { data: { user: authUser } } = await supabaseService.auth.admin.getUserById(uid);
          return {
            user_id: uid,
            email: authUser?.email || "",
            display_name: profile?.display_name || "",
            avatar_url: profile?.avatar_url || null,
            first_name: profile?.first_name || "",
            last_name: profile?.last_name || "",
            is_gerente: gerenteIds.has(uid),
          };
        })
      );

      return new Response(JSON.stringify({ agents }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("manage-financeiro-agents error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
