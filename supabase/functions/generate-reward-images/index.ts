import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REWARD_PROMPTS: Record<string, string> = {
  "Resort All Inclusive com Acompanhante":
    "Cinematic aerial photograph of an ultra-luxury tropical resort with infinity pool overlooking crystal-clear turquoise ocean. Golden sunset light bathes the scene. Elegant couple in white linen walking along the pool edge. Palm trees, overwater bungalows in background. Professional travel photography, 4K, warm golden tones, dramatic lighting, premium hospitality advertising style.",
  "iPhone 17 Pro Max":
    "Premium product photography of a sleek modern smartphone floating against a deep black gradient background. Metallic titanium finish with subtle prismatic light reflections. Cinematic studio lighting with soft rim light highlighting the edges. Ultra-clean minimal composition, 4K quality, luxury tech advertising style.",
  "MacBook M4":
    "Professional product photography of a premium laptop computer open on an elegant dark wood desk. Dark moody background with dramatic side lighting. Screen glowing softly. Minimalist setup with subtle gold accents. Cinematic studio lighting, 4K quality, luxury tech advertising, clean composition.",
  "Cruzeiro All Inclusive com Acompanhante":
    "Cinematic photograph of a massive luxury cruise ship sailing through deep blue ocean at golden hour sunset. Warm amber light reflects off the water. Premium deck with elegant lighting visible. Dramatic sky with clouds painted in gold and purple. Professional travel photography, 4K, wide angle, luxury cruise advertising style.",
  "Viagem para Paris com Acompanhante - All Inclusive":
    "Cinematic photograph of the Eiffel Tower at golden hour sunset in Paris. Elegant couple silhouetted in foreground on Trocadero terrace. Warm golden light bathes the scene, city lights beginning to sparkle. Soft bokeh, romantic atmosphere. Professional travel photography, 4K quality, luxury travel advertising style.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase config missing");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { reward_id } = await req.json().catch(() => ({ reward_id: null }));

    // Fetch rewards to process
    let query = supabase.from("point_rewards").select("id, name").eq("active", true);
    if (reward_id) query = query.eq("id", reward_id);
    const { data: rewards, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;
    if (!rewards || rewards.length === 0) {
      return new Response(JSON.stringify({ error: "No rewards found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { id: string; name: string; imageUrl?: string; error?: string }[] = [];

    for (const reward of rewards) {
      const prompt = REWARD_PROMPTS[reward.name];
      if (!prompt) {
        results.push({ id: reward.id, name: reward.name, error: "No prompt configured" });
        continue;
      }

      console.log(`Generating image for: ${reward.name}`);

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`AI error for ${reward.name}:`, aiResponse.status, errText);
          if (aiResponse.status === 429) {
            results.push({ id: reward.id, name: reward.name, error: "Rate limited, try later" });
            continue;
          }
          if (aiResponse.status === 402) {
            results.push({ id: reward.id, name: reward.name, error: "Credits required" });
            continue;
          }
          throw new Error(`AI error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (!imageData?.startsWith("data:image")) {
          throw new Error("No image in AI response");
        }

        const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) throw new Error("Invalid base64 format");

        const fmt = base64Match[1];
        const bytes = Uint8Array.from(atob(base64Match[2]), (c) => c.charCodeAt(0));

        const fileName = `${reward.id}.${fmt}`;
        const { error: upErr } = await supabase.storage
          .from("reward-images")
          .upload(fileName, bytes, { contentType: `image/${fmt}`, upsert: true });
        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage.from("reward-images").getPublicUrl(fileName);

        // Append cache-buster to force refresh
        const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

        const { error: updErr } = await supabase
          .from("point_rewards")
          .update({ image_url: publicUrl })
          .eq("id", reward.id);
        if (updErr) throw updErr;

        results.push({ id: reward.id, name: reward.name, imageUrl: publicUrl });
        console.log(`Done: ${reward.name}`);
      } catch (e: any) {
        console.error(`Failed ${reward.name}:`, e);
        results.push({ id: reward.id, name: reward.name, error: e.message });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
