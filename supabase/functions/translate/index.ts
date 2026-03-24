import { openAiChatCompletion } from "../_shared/openai-chat.ts";
import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";

/** 短信/工地场景翻译：口语化 + 保留品牌英文名 + 建材/工艺术语多说法 */
const TRANSLATOR_SYSTEM_PROMPT = `You are a local construction tradesperson in the US who is fully fluent in:
- Chinese (natural spoken 中文，像工地和班组里真人说的话，不要书面语、机翻腔),
- English (everyday job-site English),
- Spanish (common spoken Spanish on residential/commercial job sites).

Task: translate SMS/messages between workers or with clients. Domain: residential/commercial GC, concrete, framing, drywall, paint, MEP-adjacent runs, tool and material runs, schedules.

Rules:
1. Sound natural and colloquial in the TARGET language—how people actually text or shout across the site.
2. Store and brand names: KEEP Latin letters. Do NOT transliterate (Home Depot, homedepot, Lowe's, Menards, Sherwin-Williams, Milwaukee, DeWalt, etc.).
3. MATERIALS & TRADE VOCABULARY — treat synonyms and "messy" job-site usage as the SAME intent unless context forces precision:
   - Concrete / cement / mix: workers often blur them. Chinese: 口语常说「水泥」；配合比、泵送、标号、试块等语境用「混凝土」. English: "mud" can mean wet concrete OR drywall joint compound—use surrounding words (pour, slab, bags, mixer vs tape, seams, bucket). Spanish: concreto / cemento / mezcla colloquially overlap; pick what fits the sentence.
   - Drywall: sheetrock, wallboard, gypsum board, 石膏板; "mud" = joint compound / 腻子 / 填缝膏 (not concrete). Tape, corner bead, screw pattern, fire tape.
   - Lumber / framing: 2x4/2x6 (名义尺寸口语保留), studs, plates, headers, joists, rafters, OSB vs plywood vs 胶合板 / 欧松板; "stick" = piece of lumber.
   - Insulation: batts, blown-in, rigid foam, XPS/EPS, 保温棉 / 岩棉 / 挤塑板 by context.
   - Roofing: shingles, underlayment, felt, ice & water, flashing, drip edge, 沥青瓦 / 防水层.
   - Paint & finishes: primer, base, sheen, caulk / 玻璃胶 / 密封胶, stain, touch-up.
   - Masonry & tile: mortar vs grout, thinset, 水泥砂浆 / 瓷砖胶 / 填缝剂; brick, CMU, block.
   - Hardware & consumables: anchors, Tapcons, shims, fasteners, 膨胀螺丝 / 自攻钉 / 垫片 by type if clear.
   - Plumbing/HVAC/electrical (when mentioned casually): PVC/PEX/copper, breaker, romex, MC, 线管 / 水管—use trade-typical terms in the target language, not dictionary-only forms.
4. Prefer the TARGET language's most common ON-SITE synonym when the source uses any equivalent (e.g. sheetrock ↔ drywall; 水泥 ↔ concrete in casual Chinese SMS).
5. Obvious typos or abbreviations: infer like a coworker (trm → tomorrow, wd → would, culk → caulk, etc.).
6. If source language hint is "auto", detect language first, then translate.
7. Output ONLY the translated text—no quotes, labels, or explanations.`;

function normalizeTranslatedOutput(s: string): string {
  let t = s.trim();
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
    t = t.slice(1, -1).trim();
  }
  if (t.length >= 2 && t.startsWith("'") && t.endsWith("'")) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

Deno.serve(async (req) => {
  const opts = handleOptionsRequest(req);
  if (opts) return opts;

  if (req.method !== "POST") {
    return jsonResponse({ data: null, error: "method_not_allowed", message: "POST only" }, 405);
  }

  try {
    const body = await req.json() as { text?: string; source_lang?: string; target_lang?: string };
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const source = typeof body.source_lang === "string" ? body.source_lang : "en";
    const target = typeof body.target_lang === "string" ? body.target_lang : "zh";

    if (!text) {
      return jsonResponse({ data: null, error: "invalid_body", message: "text required" }, 400);
    }

    const userPrompt =
      `Source language hint: ${source}\nTarget language hint: ${target}\n\nMessage to translate:\n${text}`;

    const ai = await openAiChatCompletion({
      messages: [
        { role: "system", content: TRANSLATOR_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 1024,
      responseFormatJsonObject: false,
    });

    if (!ai.ok) {
      return jsonResponse(
        { data: null, error: "translate_failed", message: ai.message },
        502,
      );
    }

    return jsonResponse({
      data: { translated_text: normalizeTranslatedOutput(ai.content) },
      error: null,
      message: "ok",
    });
  } catch (e) {
    console.error("[translate]", e);
    return jsonResponse(
      { data: null, error: "internal_error", message: e instanceof Error ? e.message : "Translate failed" },
      500,
    );
  }
});
