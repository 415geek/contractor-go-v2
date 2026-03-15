import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
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

    const key = getEnv("ANTHROPIC_API_KEY");
    const prompt = `Translate from ${source} to ${target}. Construction context. Output translation only: ${text}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const json = await res.json();
    const content = json.content?.[0]?.text?.trim() ?? "";
    if (!content) {
      return jsonResponse(
        { data: null, error: "translate_failed", message: json.error?.message ?? "No translation" },
        500,
      );
    }

    return jsonResponse({
      data: { translated_text: content },
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
