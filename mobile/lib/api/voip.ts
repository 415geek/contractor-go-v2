import { edgeFunctionUrl, requireSupabasePublicEnv, supabaseAnonAuthHeaders } from "@/lib/api/supabase-edge";

export type AvailableDidRow = {
  did: string;
  monthly: string;
  setup: string;
  province: string;
  ratecenter: string;
};

/**
 * 湾区号码：一次请求由 Edge 并行拉取多区号（见 voip-available-numbers?bay_area=1），
 * 避免客户端连打 10 次、总耗时可下降一个数量级。
 */
export async function fetchBayAreaAvailableNumbers(): Promise<AvailableDidRow[]> {
  return fetchAvailableNumbers({ bay_area: "1" });
}

export async function fetchAvailableNumbers(params: {
  area_code?: string;
  state?: string;
  ratecenter?: string;
  /** Edge 专用：一次合并湾区多区号 */
  bay_area?: string;
}): Promise<AvailableDidRow[]> {
  const { url, anonKey } = requireSupabasePublicEnv();
  const search = new URLSearchParams();
  if (params.bay_area) search.set("bay_area", params.bay_area);
  if (params.area_code) search.set("area_code", params.area_code);
  if (params.state) search.set("state", params.state);
  if (params.ratecenter) search.set("ratecenter", params.ratecenter);
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
  return data as AvailableDidRow[];
}

/** Edge `voip-purchase-number` 写入 `virtual_numbers` 后的行（与 hooks 中 VirtualNumber 对齐） */
export type VoipPurchasedNumberRow = {
  id: string;
  user_id: string;
  provider: string;
  phone_number: string;
  status: string;
  metadata?: { monthly_cost?: number };
  created_at?: string;
};

/**
 * 使用 fetch + 解析 JSON 体，避免 supabase.functions.invoke 在 4xx/5xx 时只报「non-2xx」。
 * Web 端必须带 apikey，与 GET 号码列表一致。
 */
export async function purchaseVoipNumber(
  clerkJwt: string,
  body: { did: string; monthly?: string; setup?: string },
): Promise<VoipPurchasedNumberRow> {
  const { url, anonKey } = requireSupabasePublicEnv();
  const res = await fetch(edgeFunctionUrl(url, "voip-purchase-number"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clerkJwt}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: { data?: VoipPurchasedNumberRow | null; error?: string | null; message?: string };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(
      res.ok
        ? "购号服务返回了非 JSON，请稍后重试"
        : `购号失败 (HTTP ${res.status})，请检查网络或联系支持`,
    );
  }
  if (!res.ok || json.error) {
    const detail = (json.message ?? json.error ?? "").trim();
    throw new Error(detail || `购号失败 (HTTP ${res.status})`);
  }
  if (!json.data) {
    throw new Error(json.message?.trim() || "购号未返回数据");
  }
  return json.data;
}
