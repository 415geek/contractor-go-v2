import { edgeFunctionClerkHeaders, edgeFunctionUrl, requireSupabasePublicEnv } from "@/lib/api/supabase-edge";

type Envelope<T> = { data?: T; error?: string | null; message?: string };

/**
 * 使用 Clerk JWT 调用 Edge Function（Web 必须同时带 apikey，否则网关/invoke 易失败）。
 * 解析 JSON 体中的 message/error，避免只显示「non-2xx」。
 */
export async function invokeEdgeWithClerk<T>(
  functionName: string,
  clerkJwt: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { url, anonKey } = requireSupabasePublicEnv();
  const method = init.method ?? "GET";
  const headers: Record<string, string> = {
    ...edgeFunctionClerkHeaders(anonKey, clerkJwt),
  };
  if (method !== "GET" && init.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(edgeFunctionUrl(url, functionName), {
    method,
    headers,
    body: init.body !== undefined && method !== "GET" ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  let json: Envelope<T>;
  try {
    json = JSON.parse(text) as Envelope<T>;
  } catch {
    throw new Error(res.ok ? "Edge 返回非 JSON" : `Edge 异常 (HTTP ${res.status})`);
  }
  if (!res.ok || json.error) {
    const msg = (json.message ?? json.error ?? "").trim();
    throw new Error(msg || `请求失败 (HTTP ${res.status})`);
  }
  return json.data as T;
}
