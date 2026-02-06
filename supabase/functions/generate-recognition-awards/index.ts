import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LevelConfig {
  id: string;
  name: string;
  color: string;
  stripe: string;
}

const LEVEL_CONFIGS: LevelConfig[] = [
  { id: "invictus", name: "INVICTUS", color: "black/gold", stripe: "gold" },
  { id: "bronze", name: "BRONZE", color: "amber/copper", stripe: "amber" },
  { id: "silver", name: "SILVER", color: "clear/white", stripe: "silver" },
  { id: "gold", name: "GOLD", color: "yellow/gold", stripe: "gold" },
  { id: "black", name: "BLACK", color: "dark smoke", stripe: "black" },
  { id: "elite", name: "ELITE", color: "gold with rainbow reflections", stripe: "gold" },
  { id: "diamond", name: "DIAMOND", color: "translucent cyan/blue crystal with prismatic diamond-like reflections", stripe: "cyan" },
];

function buildPrompt(level: LevelConfig): string {
  if (level.id === "invictus") {
    return `Photorealistic 3D premium black leather bracelet on dark gradient background.
Matte black leather band with gold metallic clasp and gold edge stitching.
Gold metallic plate on top engraved with "MEMBER INVICTUS" text in elegant serif font.
Small Invictus logo embossed in gold on the clasp.
Professional product photography, studio lighting, soft reflections on gold details.
Clean minimal composition. Premium luxury fashion accessory style.
High detail, 4K quality, centered composition.`;
  }
  return `Photorealistic 3D acrylic award trophy on dark gradient background.
Silver metallic rectangular frame with rounded corners and polished chrome border.
Inside: ${level.color} translucent crystal gem with faceted cuts catching light.
Diagonal ${level.stripe} accent stripe across the frame.
Top shows "INVICTUS" text in gold metallic letters.
Bottom shows "MEMBER ${level.name}" text in silver metallic letters.
Professional product photography, studio lighting, soft reflections.
Clean minimal composition. Premium luxury business award style.
High detail, 4K quality, centered composition.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { level: levelId } = await req.json();
    
    const levelConfig = LEVEL_CONFIGS.find((l) => l.id === levelId);
  if (!levelConfig) {
    return new Response(
      JSON.stringify({ error: "Invalid level. Use: invictus, bronze, silver, gold, black, elite, diamond" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

    console.log(`Generating award image for level: ${levelConfig.name}`);

    // Call Lovable AI to generate the image
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: buildPrompt(levelConfig),
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits required. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData || !imageData.startsWith("data:image")) {
      console.error("No image data in response:", JSON.stringify(aiData).slice(0, 500));
      throw new Error("No image generated by AI");
    }

    // Extract base64 data
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid base64 image format");
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Upload to Supabase Storage
    const fileName = `${levelConfig.id}-award.${imageFormat}`;
    const { error: uploadError } = await supabase.storage
      .from("recognition-awards")
      .upload(fileName, imageBytes, {
        contentType: `image/${imageFormat}`,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("recognition-awards")
      .getPublicUrl(fileName);

    console.log(`Successfully generated and uploaded award for ${levelConfig.name}`);

    return new Response(
      JSON.stringify({
        success: true,
        level: levelConfig.id,
        imageUrl: urlData.publicUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating award:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
