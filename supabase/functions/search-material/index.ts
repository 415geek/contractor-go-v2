import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { openAiChatCompletion, stripJsonFence } from "../_shared/openai-chat.ts";
import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { getUserFromRequest } from "../_shared/get-user.ts";
import { searchMaterialPrices } from "../_shared/nova-act-search.ts";
import type { MaterialSearchHit } from "../_shared/nova-act-search.ts";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const VISION_PROMPT = (imageUrls: string[], description: string) =>
  `Analyze these construction material images.
Images: ${imageUrls.join(", ")}
Description: ${description || "None"}

Output a single valid json object only:
{
  "material_name": "材料名称",
  "material_name_en": "English name",
  "brand": "品牌",
  "model": "型号",
  "specs": {"size": "", "color": "", "material": ""},
  "search_keywords": ["keyword1", "keyword2", "keyword3"]
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
    const body = (await req.json()) as {
      image_urls?: string[];
      description?: string;
    };
    const imageUrls = Array.isArray(body.image_urls) ? body.image_urls : [];
    const description = typeof body.description === "string" ? body.description : "";

    if (imageUrls.length === 0 && !description) {
      return jsonResponse(
        { data: null, error: "invalid_body", message: "image_urls or description required" },
        400,
      );
    }

    let searchKeywords = ["construction material"];
    let aiRecognized: Record<string, unknown> = {};

    if (imageUrls.length > 0) {
      const userContent = [
        { type: "text" as const, text: VISION_PROMPT(imageUrls, description) },
        ...imageUrls.slice(0, 5).map((url) => ({
          type: "image_url" as const,
          image_url: { url, detail: "low" as const },
        })),
      ];
      const ai = await openAiChatCompletion({
        messages: [
          {
            role: "system",
            content: "You analyze construction material photos. Respond with one valid JSON object only, no markdown.",
          },
          { role: "user", content: userContent },
        ],
        maxTokens: 1024,
        responseFormatJsonObject: true,
      });
      if (ai.ok) {
        try {
          aiRecognized = JSON.parse(stripJsonFence(ai.content));
          const kw = (aiRecognized.search_keywords as string[]) ?? [];
          if (Array.isArray(kw) && kw.length > 0) searchKeywords = kw;
          else if (aiRecognized.material_name_en) searchKeywords = [String(aiRecognized.material_name_en)];
          else if (aiRecognized.material_name) searchKeywords = [String(aiRecognized.material_name)];
        } catch {
          searchKeywords = [description || "construction material"];
        }
      } else {
        console.error("[search-material] openai vision failed", ai.message);
        searchKeywords = [description || "construction material"];
      }
    } else if (description) {
      searchKeywords = [description];
      aiRecognized = { material_name: description };
    }

    const { homedepot, lowes } = await searchMaterialPrices(searchKeywords);
    const allResults: MaterialSearchHit[] = [...homedepot, ...lowes];

    const inStock = allResults.filter((r) => r.stock_status === "in_stock");
    const outOfStock = allResults.filter((r) => r.stock_status === "out_of_stock");
    const unknown = allResults.filter((r) => r.stock_status === "unknown");

    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const client = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: row, error: insertErr } = await client
      .from("material_searches")
      .insert({
        user_id: user.id,
        image_urls: imageUrls,
        description: description || null,
        ai_recognized_material: aiRecognized,
        search_results: allResults,
      })
      .select("id")
      .single();

    if (insertErr) console.error("[search-material] insert error", insertErr);

    return jsonResponse({
      data: {
        ai_recognized: aiRecognized,
        in_stock: inStock,
        out_of_stock: outOfStock,
        unknown_stock: unknown,
        search_id: row?.id ?? null,
      },
      error: null,
      message: "ok",
    });
  } catch (e) {
    console.error("[search-material]", e);
    return jsonResponse(
      {
        data: null,
        error: "internal_error",
        message: e instanceof Error ? e.message : "Search failed",
      },
      500,
    );
  }
});
