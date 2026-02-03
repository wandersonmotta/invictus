import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Platform = "google_ads" | "google_analytics";

function buildScopes(platform: Platform) {
  // IMPORTANT: Request only what is needed per platform.
  // Requesting Google Ads scope can trigger extra verification / restrictions and cause 403 on the provider screen.
  const base = ["openid", "email", "profile"];

  if (platform === "google_ads") {
    return ["https://www.googleapis.com/auth/adwords", ...base].join(" ");
  }

  // GA4 read-only
  return ["https://www.googleapis.com/auth/analytics.readonly", ...base].join(" ");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured");
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const platformParam = url.searchParams.get("platform"); // "google_ads" or "google_analytics"
    const requestedPlatform: Platform =
      platformParam === "google_analytics" ? "google_analytics" : "google_ads";

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

      const state = JSON.stringify({
        nonce: crypto.randomUUID(),
        platform: requestedPlatform,
      });

      const scopes = buildScopes(requestedPlatform);

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${encodeURIComponent(state)}`;

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

      const { data: claimsData, error: claimsError } =
        await supabase.auth.getUser();
      if (claimsError || !claimsData.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = claimsData.user.id;
      const code = url.searchParams.get("code");
      const redirectUri = url.searchParams.get("redirect_uri");
      const stateParam = url.searchParams.get("state");

      if (!code || !redirectUri) {
        throw new Error("code and redirect_uri are required");
      }

      let targetPlatform = "google_ads";
      if (stateParam) {
        try {
          const parsedState = JSON.parse(stateParam);
          targetPlatform = parsedState.platform || "google_ads";
        } catch {
          // Keep default
        }
      }

      // Exchange code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        throw new Error(
          tokenData.error_description || tokenData.error || "Failed to get access token"
        );
      }

      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token;
      const expiresIn = tokenData.expires_in || 3600;

      // Get user info for account name
      const userInfoRes = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const userInfo = await userInfoRes.json();
      const accountName = userInfo.email || "Google Account";

      // For Google Ads, try to get accessible accounts
      let accountId = null;
      if (targetPlatform === "google_ads") {
        try {
          const customersRes = await fetch(
            "https://googleads.googleapis.com/v18/customers:listAccessibleCustomers",
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const customersData = await customersRes.json();
          if (customersData.resourceNames?.length > 0) {
            // Extract customer ID from resource name (e.g., "customers/1234567890")
            accountId = customersData.resourceNames[0].replace("customers/", "");
          }
        } catch (e) {
          console.log("Could not fetch Google Ads customers:", e);
        }
      }

      // For Google Analytics, try to get properties
      let propertyId = null;
      if (targetPlatform === "google_analytics") {
        try {
          const accountsRes = await fetch(
            "https://analyticsadmin.googleapis.com/v1beta/accounts",
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const accountsData = await accountsRes.json();
          if (accountsData.accounts?.length > 0) {
            const firstAccountName = accountsData.accounts[0].name;
            // Get properties for this account
            const propertiesRes = await fetch(
              `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:${firstAccountName}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const propertiesData = await propertiesRes.json();
            if (propertiesData.properties?.length > 0) {
              propertyId = propertiesData.properties[0].name.replace("properties/", "");
            }
          }
        } catch (e) {
          console.log("Could not fetch GA4 properties:", e);
        }
      }

      // Save connection to database
      const connectionData: Record<string, unknown> = {
        user_id: userId,
        platform: targetPlatform,
        access_token_encrypted: accessToken, // In production, encrypt this
        refresh_token_encrypted: refreshToken,
        token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        account_name: accountName,
        is_active: true,
        last_sync_at: new Date().toISOString(),
      };

      if (targetPlatform === "google_ads" && accountId) {
        connectionData.account_id = accountId;
      }
      if (targetPlatform === "google_analytics" && propertyId) {
        connectionData.property_id = propertyId;
      }

      const { error: upsertError } = await supabase
        .from("ad_platform_connections")
        .upsert(connectionData, { onConflict: "user_id,platform" });

      if (upsertError) {
        throw new Error(`Failed to save connection: ${upsertError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          platform: targetPlatform,
          account_name: accountName,
          account_id: accountId,
          property_id: propertyId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Google OAuth error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
