import { openAiChatCompletion, stripJsonFence } from "../_shared/openai-chat.ts";
import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { getUserFromRequest } from "../_shared/get-user.ts";

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

const PARSE_PROJECT_PROMPT = (userInput: string) =>
  `Parse this construction project description. Extract:

Input: ${userInput}

Output a single JSON object (valid json) with these keys only:
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
Use null for missing fields. No markdown, no code fences.`;

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
      audio_base64?: string;
      audio_mime?: string;
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

    const ai = await openAiChatCompletion({
      messages: [
        {
          role: "system",
          content:
            "You extract structured project data. Always respond with a single valid JSON object only, no markdown.",
        },
        { role: "user", content: PARSE_PROJECT_PROMPT(text) },
      ],
      maxTokens: 1024,
      responseFormatJsonObject: true,
    });

    if (!ai.ok) {
      return jsonResponse(
        {
          data: null,
          error: "openai_error",
          message: ai.message,
        },
        502,
      );
    }

    let parsed: ParseResult;
    try {
      parsed = JSON.parse(stripJsonFence(ai.content)) as ParseResult;
    } catch {
      return jsonResponse(
        {
          data: null,
          error: "parse_failed",
          message: "模型返回内容不是合法 JSON，请缩短描述或重试",
        },
        422,
      );
    }
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
