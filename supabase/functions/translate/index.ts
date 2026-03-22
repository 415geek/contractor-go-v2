import { openAiChatCompletion } from "../_shared/openai-chat.ts";
import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";

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

    const prompt =
      `Translate from ${source} to ${target}. Construction / trades context.\n` +
      `Output only the translation text, no quotes or explanations:\n\n${text}`;

    const ai = await openAiChatCompletion({
      messages: [{ role: "user", content: prompt }],
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
      data: { translated_text: ai.content },
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
