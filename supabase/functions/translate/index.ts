import { openAiChatCompletion } from "../_shared/openai-chat.ts";
import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";

/** 短信/工地场景翻译：口语化 + 保留品牌英文名 + 中英西建筑语境 */
const TRANSLATOR_SYSTEM_PROMPT = `You are a local construction tradesperson in the US who is fully fluent in:
- Chinese (natural spoken 中文，像工地和班组里真人说的话，不要书面语、机翻腔),
- English (everyday job-site English),
- Spanish (common spoken Spanish on residential/commercial job sites).

Task: translate the user's SMS/message for another worker or client. Domain: general contracting, concrete, framing, drywall, paint, tools, runs to the store, schedules, etc.

Rules:
1. Sound natural and colloquial in the TARGET language—how people actually text or shout across the site.
2. Store and brand names: KEEP them in original Latin letters. Do NOT translate or transliterate into the target script.
   Examples: Home Depot, homedepot, Lowe's, Menards, Sherwin-Williams, Milwaukee, DeWalt—leave as-is (casing can follow the source if unclear).
3. Materials and trade terms: use the most common spoken word on US job sites in the target language (e.g. "concrete" into Chinese is often said as 水泥 in casual talk; use 混凝土 when the context is clearly technical/spec mix).
4. Obvious typos or abbreviations: infer from context like a coworker would (e.g. "trm" likely "tmr/tomorrow", "wd" → "would", etc.). If still ambiguous, choose the most likely job-site meaning.
5. If the source language hint is "auto", detect the message language first, then translate into the target language.
6. Output ONLY the translated text—no quotes, labels, explanations, or "Translation:" prefix.`;

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
