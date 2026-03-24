import { edgeFunctionUrl, requireSupabasePublicEnv, supabaseAnonAuthHeaders } from "@/lib/api/supabase-edge";

/**
 * Web 端必须同时带 Authorization 与 apikey；使用 fetch 解析 JSON 体，
 * 避免 supabase.functions.invoke 在 4xx/5xx 时只报「non-2xx」（与 voip.ts 一致）。
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const { url, anonKey } = requireSupabasePublicEnv();
  const res = await fetch(edgeFunctionUrl(url, "translate"), {
    method: "POST",
    headers: {
      ...supabaseAnonAuthHeaders(anonKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      source_lang: sourceLang,
      target_lang: targetLang,
    }),
  });
  const raw = await res.text();
  let json: { data?: { translated_text?: string } | null; error?: string | null; message?: string };
  try {
    json = JSON.parse(raw) as typeof json;
  } catch {
    throw new Error(
      res.ok ? "翻译服务返回了非 JSON，请稍后重试" : `翻译请求异常 (HTTP ${res.status})，请检查网络`,
    );
  }
  if (!res.ok || json.error) {
    const detail = (json.message ?? json.error ?? "").trim();
    throw new Error(detail || `翻译失败 (HTTP ${res.status})`);
  }
  return json.data?.translated_text ?? text;
}

export async function translateVoice(
  _audioUri: string,
  _sourceLang: string,
  _targetLang: string
): Promise<{ transcription: string; translation: string; audioUrl: string }> {
  throw new Error("Voice translation not implemented - requires Whisper + Storage");
}
