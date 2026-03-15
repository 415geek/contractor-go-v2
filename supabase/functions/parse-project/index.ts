import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { getUserFromRequest } from "../_shared/get-user.ts";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

type ParseResult = {
  project_name: string | null;
  address: string | null;
  project_type: string | null;
  total_cost: number | null;
  contract_type: string | null;
  start_date: string | null;
  duration_days: number | null;
  client_name: string | null;
  client_phone: string | null;
  materials_mentioned: string[];
  key_tasks: string[];
  notes: string | null;
};

const CLAUDE_PROMPT = (userInput: string) =>
  `Parse this construction project description. Extract:

Input: ${userInput}

Output JSON only:
{
  "project_name": "项目名称",
  "address": "完整地址",
  "project_type": "bathroom_renovation|kitchen_renovation|full_renovation|painting|flooring|roofing|other",
  "total_cost": 0,
  "contract_type": "labor_only|labor_material",
  "start_date": "YYYY-MM-DD",
  "duration_days": 0,
  "client_name": "客户姓名",
  "client_phone": "电话",
  "materials_mentioned": ["材料1"],
  "key_tasks": ["任务1"],
  "notes": "备注"
}
Use null for missing fields.`;

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
      input?: string;
      input_type?: "text" | "voice";
      audio_url?: string;
    };
    const inputType = body.input_type === "voice" ? "voice" : "text";
    let text = typeof body.input === "string" ? body.input.trim() : "";

    if (inputType === "voice") {
      let audioBlob: Blob;
      if (body.audio_url && typeof body.audio_url === "string") {
        const audioRes = await fetch(body.audio_url);
        if (!audioRes.ok) {
          return jsonResponse(
            { data: null, error: "fetch_audio_failed", message: "Failed to fetch audio" },
            400,
          );
        }
        audioBlob = await audioRes.blob();
      } else if (body.audio_base64 && typeof body.audio_base64 === "string") {
        const b64 = body.audio_base64.replace(/^data:audio\/\w+;base64,/, "");
        const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        audioBlob = new Blob([bin], { type: (body.audio_mime as string) || "audio/webm" });
      } else {
        return jsonResponse(
          { data: null, error: "invalid_body", message: "audio_url or audio_base64 required for voice" },
          400,
        );
      }
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("model", "whisper-1");
      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openaiKey) {
        return jsonResponse(
          { data: null, error: "config", message: "OPENAI_API_KEY not set" },
          500,
        );
      }
      const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openaiKey}` },
        body: formData,
      });
      const whisperJson = await whisperRes.json();
      text = whisperJson.text?.trim() ?? "";
      if (!text) {
        return jsonResponse(
          { data: null, error: "transcription_failed", message: "No text from audio" },
          400,
        );
      }
    }

    if (!text) {
      return jsonResponse({ data: null, error: "invalid_body", message: "input required" }, 400);
    }

    const anthropicKey = getEnv("ANTHROPIC_API_KEY");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: CLAUDE_PROMPT(text) }],
      }),
    });

    const json = await res.json();
    const content = json.content?.[0]?.text?.trim() ?? "";
    if (!content) {
      return jsonResponse(
        {
          data: null,
          error: "parse_failed",
          message: json.error?.message ?? "No response from Claude",
        },
        500,
      );
    }

    const parsed = JSON.parse(content) as ParseResult;
    return jsonResponse({
      data: { parsed, raw_text: text },
      error: null,
      message: "ok",
    });
  } catch (e) {
    console.error("[parse-project]", e);
    return jsonResponse(
      {
        data: null,
        error: "internal_error",
        message: e instanceof Error ? e.message : "Parse failed",
      },
      500,
    );
  }
});
