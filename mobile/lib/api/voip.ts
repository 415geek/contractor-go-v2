import { edgeFunctionUrl, requireSupabasePublicEnv, supabaseAnonAuthHeaders } from "@/lib/api/supabase-edge";

export async function fetchAvailableNumbers(params: {
  area_code?: string;
  state?: string;
  ratecenter?: string;
}): Promise<{ did: string; monthly: string; setup: string; province: string; ratecenter: string }[]> {
  const { url, anonKey } = requireSupabasePublicEnv();
  const search = new URLSearchParams(params as Record<string, string>);
  const res = await fetch(edgeFunctionUrl(url, "voip-available-numbers", search), {
    method: "GET",
    headers: {
      ...supabaseAnonAuthHeaders(anonKey),
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  let json: { data?: unknown; error?: string | null; message?: string };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(
      res.ok
        ? "号码服务返回了非 JSON，请稍后重试"
        : `号码服务异常 (HTTP ${res.status})，请检查网络或联系支持`,
    );
  }
  if (!res.ok || json.error) {
    throw new Error(json.message ?? json.error ?? `请求失败 (HTTP ${res.status})`);
  }
  const data = json.data;
  if (!Array.isArray(data)) return [];
  return data as {
    did: string;
    monthly: string;
    setup: string;
    province: string;
    ratecenter: string;
  }[];
}
