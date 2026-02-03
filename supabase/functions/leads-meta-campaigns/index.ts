import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Campaign {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  thumbnail_url: string | null;
  ad_sets_count: number;
  ads_count: number;
  insights: {
    spend: number;
    purchases: number;
    cost_per_purchase: number;
  };
}

interface MetaAd {
  id: string;
  campaign_id: string;
  creative?: {
    thumbnail_url?: string;
  };
}

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  adsets?: { data: { id: string }[] };
  ads?: { data: MetaAd[] };
}

interface MetaInsight {
  campaign_id: string;
  campaign_name: string;
  spend: string;
  actions?: { action_type: string; value: string }[];
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

    // Get Meta Ads connection
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

    // Fetch campaigns with ads and creatives
    const campaignsUrl =
      `https://graph.facebook.com/v21.0/act_${accountId}/campaigns?` +
      `fields=id,name,status,effective_status,adsets{id},ads{id,creative{thumbnail_url}}` +
      `&limit=50` +
      `&access_token=${accessToken}`;

    const campaignsRes = await fetch(campaignsUrl);
    const campaignsData = await campaignsRes.json();

    if (campaignsData.error) {
      console.error("Meta API campaigns error:", campaignsData.error);
      return new Response(
        JSON.stringify({
          error: campaignsData.error.message || "Erro ao buscar campanhas",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch insights at campaign level
    const insightsUrl =
      `https://graph.facebook.com/v21.0/act_${accountId}/insights?` +
      `level=campaign` +
      `&fields=campaign_id,campaign_name,spend,actions` +
      `&time_range={"since":"${startDate}","until":"${endDate}"}` +
      `&limit=50` +
      `&access_token=${accessToken}`;

    const insightsRes = await fetch(insightsUrl);
    const insightsData = await insightsRes.json();

    if (insightsData.error) {
      console.error("Meta API insights error:", insightsData.error);
    }

    // Create insights map by campaign_id
    const insightsMap = new Map<string, MetaInsight>();
    if (insightsData.data) {
      for (const insight of insightsData.data) {
        insightsMap.set(insight.campaign_id, insight);
      }
    }

    // Process campaigns
    const campaigns: Campaign[] = (campaignsData.data || []).map(
      (campaign: MetaCampaign) => {
        // Get first thumbnail from ads
        let thumbnailUrl: string | null = null;
        if (campaign.ads?.data) {
          for (const ad of campaign.ads.data) {
            if (ad.creative?.thumbnail_url) {
              thumbnailUrl = ad.creative.thumbnail_url;
              break;
            }
          }
        }

        // Get insights for this campaign
        const insight = insightsMap.get(campaign.id);
        const spend = insight ? parseFloat(insight.spend || "0") : 0;
        
        let purchases = 0;
        if (insight?.actions) {
          const purchaseAction = insight.actions.find(
            (a) => a.action_type === "purchase" || a.action_type === "omni_purchase"
          );
          if (purchaseAction) {
            purchases = parseInt(purchaseAction.value, 10);
          }
        }

        const costPerPurchase = purchases > 0 ? spend / purchases : 0;

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          effective_status: campaign.effective_status,
          thumbnail_url: thumbnailUrl,
          ad_sets_count: campaign.adsets?.data?.length || 0,
          ads_count: campaign.ads?.data?.length || 0,
          insights: {
            spend,
            purchases,
            cost_per_purchase: costPerPurchase,
          },
        };
      }
    );

    // Sort by spend descending
    campaigns.sort((a, b) => b.insights.spend - a.insights.spend);

    const result = {
      connected: true,
      period: { start: startDate, end: endDate },
      campaigns,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Meta campaigns error:", error);
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
