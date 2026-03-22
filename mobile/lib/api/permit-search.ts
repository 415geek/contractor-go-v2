import { edgeFunctionUrl, requireSupabasePublicEnv } from "@/lib/api/supabase-edge";

export type PermitSearchApiResult = {
  address: string;
  city?: string;
  property_info: unknown;
  permit_history: unknown[];
  key_insights: string[];
};

/**
 * Web 端必须带 apikey；失败时解析 JSON 的 message，避免只显示「non-2xx」。
 */
export async function searchPermitViaEdge(
  clerkJwt: string,
  address: string,
): Promise<PermitSearchApiResult> {
  const { url, anonKey } = requireSupabasePublicEnv();
  const res = await fetch(edgeFunctionUrl(url, "search-permit"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clerkJwt}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ address }),
  });
  const text = await res.text();
  let json: {
    data?: PermitSearchApiResult;
    error?: string | null;
    message?: string;
    supported_cities?: string[];
  };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(
      res.ok ? "Permit 服务返回了非 JSON" : `Permit 查询失败 (HTTP ${res.status})，请稍后重试`,
    );
  }

  if (json.error === "unsupported_city") {
    const cities = (json.supported_cities ?? ["San Francisco", "San Jose"]).join(", ");
    throw new Error(
      json.message?.trim() ||
        `未识别为已开放数据的城市。请在地址中写明城市或邮编（支持: ${cities}）。`,
    );
  }

  if (!res.ok || json.error) {
    const detail = (json.message ?? json.error ?? "").trim();
    throw new Error(detail || `Permit 查询失败 (HTTP ${res.status})`);
  }

  if (!json.data) {
    throw new Error(json.message?.trim() || "未返回查询结果");
  }

  return json.data;
}
