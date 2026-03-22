import { edgeFunctionUrl, requireSupabasePublicEnv, supabaseAnonAuthHeaders } from "@/lib/api/supabase-edge";

export type ParseProjectResult = {
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

type Envelope = {
  data?: { parsed?: ParseProjectResult; raw_text?: string } | null;
  error?: string | null;
  message?: string;
};

/** 兼容 invoke / fetch 不同层级的 JSON（parsed 可能在根或 data 内） */
function extractParsed(body: unknown): ParseProjectResult | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (o.parsed && typeof o.parsed === "object") return o.parsed as ParseProjectResult;
  const inner = o.data;
  if (inner && typeof inner === "object") {
    const d = inner as Record<string, unknown>;
    if (d.parsed && typeof d.parsed === "object") return d.parsed as ParseProjectResult;
  }
  return null;
}

/**
 * 使用 fetch 调用 parse-project（Web 与 Native 均显式带 apikey，避免 invoke 在部分环境下无响应/无错误）。
 */
export async function parseProjectViaEdge(
  clerkJwt: string,
  body: Record<string, unknown>,
): Promise<{ parsed: ParseProjectResult | null; rawText?: string }> {
  const { url, anonKey } = requireSupabasePublicEnv();
  const res = await fetch(edgeFunctionUrl(url, "parse-project"), {
    method: "POST",
    headers: {
      ...supabaseAnonAuthHeaders(anonKey),
      Authorization: `Bearer ${clerkJwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: Envelope;
  try {
    json = JSON.parse(text) as Envelope;
  } catch {
    throw new Error(res.ok ? "解析服务返回非 JSON" : `解析请求失败 (HTTP ${res.status})`);
  }
  if (!res.ok || json.error) {
    throw new Error((json.message ?? json.error ?? "").trim() || `解析失败 (HTTP ${res.status})`);
  }
  const parsed = extractParsed(json);
  const rawText =
    json.data && typeof json.data === "object" && "raw_text" in json.data
      ? String((json.data as { raw_text?: string }).raw_text ?? "")
      : undefined;
  return { parsed, rawText };
}
