/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function onlyDigits(input: string) {
  return input.replace(/\D/g, "");
}

function normalizeKey(city: string, state: string) {
  const c = city
    .trim()
    .toLowerCase()
    .normalize("NFD")
    // deno supports unicode property escapes
    .replace(/\p{Diacritic}+/gu, "");
  return `${c}|${state.trim().toUpperCase()}|BR`;
}

type ViaCepResponse = {
  erro?: boolean;
  localidade?: string;
  uf?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    if (!SUPABASE_URL) throw new Error("SUPABASE_URL is not configured");

    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_ANON_KEY) throw new Error("SUPABASE_ANON_KEY is not configured");

    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => null)) as { postal_code?: string } | null;
    const cepRaw = body?.postal_code ?? "";
    const cep = onlyDigits(cepRaw);
    if (cep.length !== 8) {
      return new Response(JSON.stringify({ error: "CEP inválido. Use 8 dígitos." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1) ViaCEP (city/UF)
    const viaCepRes = await fetch(`https://viacep.com.br/ws/${encodeURIComponent(cep)}/json/`, {
      headers: {
        "Accept": "application/json",
      },
    });

    const viaCepJson = (await viaCepRes.json().catch(() => null)) as ViaCepResponse | null;
    if (!viaCepRes.ok || !viaCepJson || viaCepJson.erro) {
      return new Response(JSON.stringify({ error: "CEP não encontrado." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const city = (viaCepJson.localidade ?? "").trim();
    const state = (viaCepJson.uf ?? "").trim().toUpperCase();
    if (!city || !state) {
      return new Response(JSON.stringify({ error: "Não foi possível obter cidade/UF do CEP." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = normalizeKey(city, state);

    // 2) Cache lookup
    const { data: cached, error: cacheErr } = await supabaseAdmin
      .from("geo_city_cache")
      .select("lat,lng")
      .eq("key", key)
      .maybeSingle();

    if (cacheErr) {
      throw new Error(`geo_city_cache lookup failed: ${cacheErr.message}`);
    }

    let lat = cached?.lat ?? null;
    let lng = cached?.lng ?? null;

    // 3) Nominatim if needed
    if (lat == null || lng == null) {
      const q = `${city}, ${state}, Brazil`;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;

      const nomRes = await fetch(url, {
        headers: {
          "Accept": "application/json",
          // Nominatim requires a valid UA
          "User-Agent": "InvictusApp/1.0 (Lovable Cloud)",
        },
      });

      const nomJson = (await nomRes.json().catch(() => null)) as Array<{ lat?: string; lon?: string }> | null;
      if (!nomRes.ok || !nomJson || !nomJson[0]?.lat || !nomJson[0]?.lon) {
        return new Response(JSON.stringify({ error: "Não foi possível localizar coordenadas para sua cidade." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      lat = Number(nomJson[0].lat);
      lng = Number(nomJson[0].lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return new Response(JSON.stringify({ error: "Coordenadas inválidas retornadas pelo geocoding." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: upsertCacheErr } = await supabaseAdmin.from("geo_city_cache").upsert(
        {
          key,
          city,
          state,
          lat,
          lng,
          source: "nominatim",
        },
        { onConflict: "key" },
      );

      if (upsertCacheErr) {
        // Non-fatal; still proceed
        console.error("geo_city_cache upsert failed:", upsertCacheErr);
      }
    }

    const nowIso = new Date().toISOString();
    const region = `${city}/${state}`;

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          postal_code: cep,
          city,
          state,
          region,
          location_lat: lat,
          location_lng: lng,
          location_updated_at: nowIso,
        },
        { onConflict: "user_id" },
      )
      .select("postal_code, city, state, region, location_updated_at")
      .maybeSingle();

    if (updateErr) {
      throw new Error(`profiles update failed: ${updateErr.message}`);
    }

    return new Response(JSON.stringify({ ok: true, profile: updated }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("resolve-location-from-cep error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
