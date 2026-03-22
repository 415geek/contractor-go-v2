/**
 * OpenAI Chat Completions（文本 + image_url），与现有 OPENAI_API_KEY / Whisper 共用。
 * 可选：OPENAI_CHAT_MODEL 或 OPENAI_MODEL（默认 gpt-4o-mini，支持视觉）。
 */

export function requireOpenAIApiKey(): string {
  const v = Deno.env.get("OPENAI_API_KEY");
  if (!v?.trim()) throw new Error("Missing env: OPENAI_API_KEY");
  return v.trim();
}

export function getOpenAIChatModel(): string {
  return (
    Deno.env.get("OPENAI_CHAT_MODEL")?.trim() ||
    Deno.env.get("OPENAI_MODEL")?.trim() ||
    "gpt-4o-mini"
  );
}

export type OpenAIChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "low" | "auto" | "high" } };

export type OpenAIChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | OpenAIChatContentPart[];
};

export function openAIErrorMessage(json: unknown, httpStatus: number): string {
  if (!json || typeof json !== "object") {
    return `OpenAI API 错误 (HTTP ${httpStatus})`;
  }
  const o = json as Record<string, unknown>;
  const err = o.error;
  if (err && typeof err === "object") {
    const m = (err as Record<string, unknown>).message;
    if (typeof m === "string" && m.trim()) return m.trim();
  }
  if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
  return `OpenAI API 错误 (HTTP ${httpStatus})`;
}

export async function openAiChatCompletion(args: {
  messages: OpenAIChatMessage[];
  maxTokens?: number;
  /** 启用后需保证提示里出现 “json” 字样 */
  responseFormatJsonObject?: boolean;
}): Promise<
  | { ok: true; content: string }
  | { ok: false; status: number; message: string }
> {
  const key = requireOpenAIApiKey();
  const payload: Record<string, unknown> = {
    model: getOpenAIChatModel(),
    messages: args.messages,
    max_tokens: args.maxTokens ?? 4096,
  };
  if (args.responseFormatJsonObject) {
    payload.response_format = { type: "json_object" };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      message: openAIErrorMessage(json, res.status),
    };
  }

  const choice = (json as { choices?: { message?: { content?: unknown } }[] }).choices?.[0];
  const raw = choice?.message?.content;
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) {
    return {
      ok: false,
      status: res.status,
      message: "OpenAI 未返回文本内容",
    };
  }
  return { ok: true, content: text };
}

/** 模型偶发包一层 ```json``` */
export function stripJsonFence(raw: string): string {
  let t = raw.trim();
  const m = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```\s*$/i.exec(t);
  if (m) t = m[1].trim();
  return t;
}
