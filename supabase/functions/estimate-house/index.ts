import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { openAiChatCompletion, stripJsonFence } from "../_shared/openai-chat.ts";
import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { getUserFromRequest } from "../_shared/get-user.ts";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const VISION_PROMPT = (imageUrls: string[]) =>
  `Analyze this construction/renovation photo. Segment and identify all visible materials.

Output JSON only:
{
  "room_type": "bathroom|kitchen|bedroom|living_room|exterior|other",
  "quality_level": "budget|standard|premium|luxury",
  "segments": [
    {
      "id": "seg_1",
      "bbox": {"x": 0.1, "y": 0.2, "width": 0.3, "height": 0.4},
      "material_type": "tile|paint|wood|fixture|cabinet|countertop|flooring",
      "material_name": "材料名称",
      "quantity": {"value": 50, "unit": "sqft"},
      "price_per_unit": {"min": 2, "max": 5},
      "total_price": {"min": 100, "max": 250}
    }
  ],
  "total_estimate": {
    "materials_only": {"min": 1000, "max": 2000},
    "with_labor": {"min": 2500, "max": 4500}
  }
}`;

Deno.serve(async (req) => {
  const opts = handleOptionsRequest(req);
  if (opts) return opts;

  if (req.method !== "POST") {
    return jsonResponse({ data: null, error: "method_not_allowed", message: "POST only" }, 405);
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return jsonResponse({ data: null, error: "unauthorized", message: "Auth required" }, 401);
  }

  try {
    const body = (await req.json()) as { image_urls?: string[] };
    const imageUrls = Array.isArray(body.image_urls) ? body.image_urls : [];
    if (imageUrls.length === 0) {
      return jsonResponse(
        { data: null, error: "invalid_body", message: "image_urls required" },
        400,
      );
    }

    const userContent = [
      { type: "text" as const, text: VISION_PROMPT(imageUrls) },
      ...imageUrls.slice(0, 5).map((url) => ({
        type: "image_url" as const,
        image_url: { url, detail: "low" as const },
      })),
    ];
    const ai = await openAiChatCompletion({
      messages: [
        {
          role: "system",
          content:
            "You estimate renovation materials from photos. Respond with one valid JSON object only, no markdown.",
        },
        { role: "user", content: userContent },
      ],
      maxTokens: 2048,
      responseFormatJsonObject: true,
    });

    if (!ai.ok) {
      return jsonResponse(
        { data: null, error: "analyze_failed", message: ai.message },
        502,
      );
    }

    let analysis: Record<string, unknown>;
    try {
      analysis = JSON.parse(stripJsonFence(ai.content));
    } catch {
      return jsonResponse(
        { data: null, error: "invalid_json", message: "模型输出不是合法 JSON" },
        500,
      );
    }

    const totalEstimate = (analysis.total_estimate as Record<string, unknown>) ?? {};
    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const client = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: row, error: insertErr } = await client
      .from("house_estimates")
      .insert({
        user_id: user.id,
        image_urls: imageUrls,
        analysis_result: analysis,
        total_estimate: totalEstimate,
      })
      .select("id")
      .single();

    if (insertErr) console.error("[estimate-house] insert error", insertErr);

    return jsonResponse({
      data: {
        room_type: analysis.room_type,
        quality_level: analysis.quality_level,
        segments: analysis.segments ?? [],
        total_estimate: totalEstimate,
        estimate_id: row?.id ?? null,
      },
      error: null,
      message: "ok",
    });
  } catch (e) {
    console.error("[estimate-house]", e);
    return jsonResponse(
      { data: null, error: "internal_error", message: e instanceof Error ? e.message : "Estimate failed" },
      500,
    );
  }
});
