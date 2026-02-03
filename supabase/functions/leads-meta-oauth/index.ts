import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const META_APP_ID = Deno.env.get("META_APP_ID");
    const META_APP_SECRET = Deno.env.get("META_APP_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!META_APP_ID || !META_APP_SECRET) {
      throw new Error("META_APP_ID or META_APP_SECRET not configured");
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Generate OAuth URL for redirect
    if (action === "get_auth_url") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const redirectUri = url.searchParams.get("redirect_uri");
      if (!redirectUri) {
        throw new Error("redirect_uri is required");
      }

      const state = crypto.randomUUID();
      const scopes = [
        "ads_read",
        "ads_management",
        "business_management",
        "read_insights",
      ].join(",");

      const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?` +
        `client_id=${META_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}` +
        `&scope=${scopes}`;

      return new Response(JSON.stringify({ auth_url: authUrl, state }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Exchange code for access token (callback)
    if (action === "callback") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: claimsData, error: claimsError } = await supabase.auth.getUser();
      if (claimsError || !claimsData.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = claimsData.user.id;
      const code = url.searchParams.get("code");
      const redirectUri = url.searchParams.get("redirect_uri");

      if (!code || !redirectUri) {
        throw new Error("code and redirect_uri are required");
      }

      // Exchange code for short-lived token
      const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `client_id=${META_APP_ID}` +
        `&client_secret=${META_APP_SECRET}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&code=${code}`;

      const tokenRes = await fetch(tokenUrl);
      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        throw new Error(tokenData.error.message || "Failed to get access token");
      }

      const shortLivedToken = tokenData.access_token;

      // Exchange for long-lived token
      const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `grant_type=fb_exchange_token` +
        `&client_id=${META_APP_ID}` +
        `&client_secret=${META_APP_SECRET}` +
        `&fb_exchange_token=${shortLivedToken}`;

      const longLivedRes = await fetch(longLivedUrl);
      const longLivedData = await longLivedRes.json();

      if (longLivedData.error) {
        throw new Error(longLivedData.error.message || "Failed to get long-lived token");
      }

      const accessToken = longLivedData.access_token;
      const expiresIn = longLivedData.expires_in || 5184000; // ~60 days default

      // Get ad accounts
      const accountsRes = await fetch(
        `https://graph.facebook.com/v21.0/me/adaccounts?fields=account_id,name&access_token=${accessToken}`
      );
      const accountsData = await accountsRes.json();

      if (accountsData.error) {
        throw new Error(accountsData.error.message || "Failed to get ad accounts");
      }

      const accounts = accountsData.data || [];
      const firstAccount = accounts[0];

      // Save connection to database
      const { error: upsertError } = await supabase
        .from("ad_platform_connections")
        .upsert(
          {
            user_id: userId,
            platform: "meta_ads",
            access_token_encrypted: accessToken, // In production, encrypt this
            token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
            account_id: firstAccount?.account_id || null,
            account_name: firstAccount?.name || "Meta Ads Account",
            is_active: true,
            last_sync_at: new Date().toISOString(),
          },
          { onConflict: "user_id,platform" }
        );

      if (upsertError) {
        throw new Error(`Failed to save connection: ${upsertError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          account_name: firstAccount?.name || "Meta Ads Account",
          accounts: accounts.map((a: any) => ({ id: a.account_id, name: a.name })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Meta OAuth error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
