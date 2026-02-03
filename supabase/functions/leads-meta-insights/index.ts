import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MetaInsight {
  spend: string;
  impressions: string;
  clicks: string;
  conversions: string;
  purchase_roas: { action_type: string; value: string }[];
  actions?: { action_type: string; value: string }[];
  cost_per_action_type?: { action_type: string; value: string }[];
}

Deno.serve(async (req) => {
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

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Get connection
    const { data: connection, error: connError } = await supabase
      .from("ad_platform_connections")
      .select("*")
      .eq("user_id", userId)
      .eq("platform", "meta_ads")
      .eq("is_active", true)
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: "Meta Ads não conectado", connected: false }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const accessToken = connection.access_token_encrypted;
    const accountId = connection.account_id;

    if (!accessToken || !accountId) {
      return new Response(
        JSON.stringify({ error: "Token ou conta não encontrados" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get date range from query params
    const url = new URL(req.url);
    const startDate = url.searchParams.get("start_date") || getDefaultStartDate();
    const endDate = url.searchParams.get("end_date") || getDefaultEndDate();

    // Fetch insights from Meta Marketing API
    const fields = [
      "spend",
      "impressions",
      "clicks",
      "actions",
      "purchase_roas",
      "cost_per_action_type",
      "cpc",
      "cpm",
      "ctr",
      "reach",
      "frequency",
    ].join(",");

    const insightsUrl =
      `https://graph.facebook.com/v21.0/act_${accountId}/insights?` +
      `fields=${fields}` +
      `&time_range={"since":"${startDate}","until":"${endDate}"}` +
      `&access_token=${accessToken}`;

    const insightsRes = await fetch(insightsUrl);
    const insightsData = await insightsRes.json();

    if (insightsData.error) {
      console.error("Meta API error:", insightsData.error);
      return new Response(
        JSON.stringify({
          error: insightsData.error.message || "Erro ao buscar insights",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Process the data
    const insights = insightsData.data?.[0] || {};
    
    // Extract purchase count and value from actions
    let purchases = 0;
    let purchaseValue = 0;
    if (insights.actions) {
      const purchaseAction = insights.actions.find(
        (a: { action_type: string; value: string }) =>
          a.action_type === "purchase" || a.action_type === "omni_purchase"
      );
      if (purchaseAction) {
        purchases = parseInt(purchaseAction.value, 10);
      }
    }

    // Get ROAS
    let roas = 0;
    if (insights.purchase_roas) {
      const roasAction = insights.purchase_roas.find(
        (r: { action_type: string; value: string }) =>
          r.action_type === "omni_purchase" || r.action_type === "purchase"
      );
      if (roasAction) {
        roas = parseFloat(roasAction.value);
      }
    }

    // Calculate purchase value from spend * ROAS
    const spend = parseFloat(insights.spend || "0");
    purchaseValue = spend * roas;

    const result = {
      connected: true,
      period: { start: startDate, end: endDate },
      metrics: {
        spend: spend,
        impressions: parseInt(insights.impressions || "0", 10),
        clicks: parseInt(insights.clicks || "0", 10),
        reach: parseInt(insights.reach || "0", 10),
        frequency: parseFloat(insights.frequency || "0"),
        cpc: parseFloat(insights.cpc || "0"),
        cpm: parseFloat(insights.cpm || "0"),
        ctr: parseFloat(insights.ctr || "0"),
        purchases: purchases,
        purchase_value: purchaseValue,
        roas: roas,
      },
      raw: insights,
    };

    // Cache the metrics
    await supabase.from("ad_metrics_cache").upsert(
      {
        connection_id: connection.id,
        metric_type: "overview",
        date_range_start: startDate,
        date_range_end: endDate,
        data: result.metrics,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "connection_id,metric_type,date_range_start,date_range_end" }
    );

    // Update last sync
    await supabase
      .from("ad_platform_connections")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", connection.id);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Meta insights error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split("T")[0];
}

function getDefaultEndDate(): string {
  return new Date().toISOString().split("T")[0];
}
