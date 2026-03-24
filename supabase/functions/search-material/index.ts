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

/** 多角色合一：北美建材技术 + 大卖场采购视角 + 本地门店采购视角 */
const EXPERT_SYSTEM = `You are a single analyst synthesizing THREE expert roles (do not output separate voices—merge into one JSON):
(1) North American construction materials technical lead: grades, ASTM/ANSI where relevant, substitutability, jobsite naming.
(2) Big-box retail sourcing mindset (Home Depot / Lowe's): how SKUs are titled online, pack sizes, common US retail keywords.
(3) Independent local lumber/building supply buyer: how regional yards label products.

Always prefer English strings in "search_keywords" and inside each option's "search_keywords" for US retail web search.
Output ONE valid JSON object only, no markdown, no prose outside JSON.`;

type ClarOption = { id: string; label_zh: string; search_keywords: string[] };

type AiMaterialJson = {
  status?: string;
  expert_consensus_zh?: string;
  material_name?: string;
  material_name_en?: string;
  brand?: string;
  model?: string;
  specs?: Record<string, string>;
  search_keywords?: string[];
  clarification_question_zh?: string;
  options?: ClarOption[];
  allow_custom_input?: boolean;
};

const VISION_USER_PROMPT = (imageCount: number, description: string) =>
  `You will analyze ${imageCount} construction supply photo(s) and optional user text.

User description (may be empty): ${description || "None"}

Return JSON with this exact shape (all keys present; use empty string or [] if unused):
{
  "status": "ready" | "clarify",
  "expert_consensus_zh": "1-3 sentences in Chinese summarizing what the three expert roles agree on",
  "material_name": "",
  "material_name_en": "",
  "brand": "",
  "model": "",
  "specs": {},
  "search_keywords": ["English retail query 1", "English retail query 2"],
  "clarification_question_zh": "Question in Chinese to user; empty if status is ready",
  "options": [
    { "id": "opt_cement", "label_zh": "对比某品牌水泥价格", "search_keywords": ["Brand X Portland cement 94 lb"] }
  ],
  "allow_custom_input": true
}

Rules:
- If the image(s) show MULTIPLE distinct products (e.g. a bag of cement AND lumber), OR confidence is low, OR retail search target is ambiguous: set status to "clarify", fill clarification_question_zh, provide 2–5 options with distinct label_zh and concrete English search_keywords each. Last option can be a generic "自定义" style label_zh with broad search_keywords from visible clues.
- If ONE clear primary product for price compare: set status to "ready", set search_keywords to 2–5 English phrases optimized for HomeDepot/Lowe's style search, options can be [].
- allow_custom_input: true whenever status is "clarify" (user may type their own focus).
- Never leave search_keywords empty when status is "ready"; if unsure, use "clarify" instead.`;

function normalizeKeywords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter((s) => s.length > 0)
    .slice(0, 8);
}

function normalizeOptions(raw: unknown): ClarOption[] {
  if (!Array.isArray(raw)) return [];
  const out: ClarOption[] = [];
  for (const o of raw) {
    if (!o || typeof o !== "object") continue;
    const r = o as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    const label_zh = typeof r.label_zh === "string" ? r.label_zh.trim() : "";
    const kw = normalizeKeywords(r.search_keywords);
    if (!id || !label_zh || kw.length === 0) continue;
    out.push({ id, label_zh, search_keywords: kw });
  }
  return out.slice(0, 6);
}

function needsClarification(parsed: AiMaterialJson, keywords: string[]): boolean {
  if (parsed.status === "clarify") return true;
  if (keywords.length === 0) return true;
  return false;
}

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
      /** 用户选定选项或自定义后直达比价，跳过视觉大模型 */
      search_keywords?: string[];
    };
    const imageUrls = Array.isArray(body.image_urls) ? body.image_urls : [];
    const description = typeof body.description === "string" ? body.description : "";
    const overrideKw = normalizeKeywords(body.search_keywords);

    if (imageUrls.length === 0 && !description && overrideKw.length === 0) {
      return jsonResponse(
        { data: null, error: "invalid_body", message: "image_urls, description, or search_keywords required" },
        400,
      );
    }

    let searchKeywords: string[] = [];
    let aiRecognized: Record<string, unknown> = {};
    let needs_clarification = false;
    let clarification_question_zh: string | undefined;
    let clarification_options: ClarOption[] = [];
    let allow_custom_focus = false;

    if (overrideKw.length > 0) {
      searchKeywords = overrideKw;
      aiRecognized = {
        source: "user_refined_search",
        search_keywords: overrideKw,
        prior_description: description || null,
        prior_image_count: imageUrls.length,
      };
      needs_clarification = false;
    } else if (imageUrls.length > 0) {
      const userContent = [
        { type: "text" as const, text: VISION_USER_PROMPT(imageUrls.length, description) },
        ...imageUrls.slice(0, 5).map((url) => ({
          type: "image_url" as const,
          image_url: { url, detail: "auto" as const },
        })),
      ];
      const ai = await openAiChatCompletion({
        messages: [
          { role: "system", content: EXPERT_SYSTEM },
          { role: "user", content: userContent },
        ],
        maxTokens: 2048,
        responseFormatJsonObject: true,
      });
      if (ai.ok) {
        try {
          const parsed = JSON.parse(stripJsonFence(ai.content)) as AiMaterialJson;
          aiRecognized = parsed as Record<string, unknown>;
          searchKeywords = normalizeKeywords(parsed.search_keywords);
          clarification_options = normalizeOptions(parsed.options);
          clarification_question_zh =
            typeof parsed.clarification_question_zh === "string"
              ? parsed.clarification_question_zh.trim()
              : undefined;
          allow_custom_focus = parsed.allow_custom_input !== false;
          if (needsClarification(parsed, searchKeywords)) {
            needs_clarification = true;
            searchKeywords = [];
            if (!clarification_question_zh) {
              clarification_question_zh = "请选择要比价的材料，或使用下方自定义搜索词。";
            }
            if (clarification_options.length === 0 && description.trim()) {
              clarification_options = [
                {
                  id: "use_description",
                  label_zh: "按当前文字描述比价",
                  search_keywords: [description.trim()],
                },
              ];
            }
          }
        } catch {
          aiRecognized = { parse_error: true };
          searchKeywords = [description || "construction material"];
        }
      } else {
        console.error("[search-material] openai vision failed", ai.message);
        aiRecognized = { openai_error: ai.message };
        searchKeywords = [description || "construction material"];
      }
    } else {
      const textOnly = `User text only (no image): "${description}"

Return the same JSON schema as image analysis. If the description targets one product, status "ready" with English search_keywords. If vague or multiple products, status "clarify" with options.`;

      const ai = await openAiChatCompletion({
        messages: [
          { role: "system", content: EXPERT_SYSTEM },
          { role: "user", content: textOnly },
        ],
        maxTokens: 1536,
        responseFormatJsonObject: true,
      });
      if (ai.ok) {
        try {
          const parsed = JSON.parse(stripJsonFence(ai.content)) as AiMaterialJson;
          aiRecognized = parsed as Record<string, unknown>;
          searchKeywords = normalizeKeywords(parsed.search_keywords);
          clarification_options = normalizeOptions(parsed.options);
          clarification_question_zh =
            typeof parsed.clarification_question_zh === "string"
              ? parsed.clarification_question_zh.trim()
              : undefined;
          allow_custom_focus = parsed.allow_custom_input !== false;
          if (needsClarification(parsed, searchKeywords)) {
            needs_clarification = true;
            searchKeywords = [];
            if (!clarification_question_zh) {
              clarification_question_zh = "描述较笼统，请选择要比价的方向或补充自定义搜索词。";
            }
            if (clarification_options.length === 0 && description.trim()) {
              clarification_options = [
                {
                  id: "use_description",
                  label_zh: "按当前描述直接搜",
                  search_keywords: [description.trim()],
                },
              ];
            }
          }
        } catch {
          searchKeywords = [description];
          aiRecognized = { material_name: description };
        }
      } else {
        searchKeywords = [description];
        aiRecognized = { material_name: description };
      }
    }

    let allResults: MaterialSearchHit[] = [];
    if (!needs_clarification && searchKeywords.length > 0) {
      const { homedepot, lowes } = await searchMaterialPrices(searchKeywords);
      allResults = [...homedepot, ...lowes];
    }

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
        ai_recognized_material: {
          ...aiRecognized,
          needs_clarification,
          clarification_question_zh,
          clarification_options,
        },
        search_results: allResults,
      })
      .select("id")
      .single();

    if (insertErr) console.error("[search-material] insert error", insertErr);

    return jsonResponse({
      data: {
        ai_recognized: aiRecognized,
        needs_clarification,
        clarification_question_zh: clarification_question_zh ?? null,
        clarification_options,
        allow_custom_focus,
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
