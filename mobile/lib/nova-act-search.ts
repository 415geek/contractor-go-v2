import { edgeFunctionClerkHeaders, edgeFunctionUrl, requireSupabasePublicEnv } from "@/lib/api/supabase-edge";

export type MaterialSearchHit = {
  product_name: string;
  price: string;
  image_url: string;
  product_url: string;
  store: "HomeDepot" | "Lowes";
  stock_status: "in_stock" | "out_of_stock" | "unknown";
};

export type MaterialSearchPayload = {
  image_urls?: string[];
  description?: string;
};

export type MaterialSearchResponse = {
  ai_recognized: Record<string, unknown>;
  in_stock: MaterialSearchHit[];
  out_of_stock: MaterialSearchHit[];
  unknown_stock: MaterialSearchHit[];
  search_id: string | null;
};

export async function searchMaterialPrices(
  getToken: () => Promise<string | null>,
  payload: MaterialSearchPayload,
): Promise<MaterialSearchResponse> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");
  const { url, anonKey } = requireSupabasePublicEnv();
  const res = await fetch(edgeFunctionUrl(url, "search-material"), {
    method: "POST",
    headers: {
      ...edgeFunctionClerkHeaders(anonKey, token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json: { data?: MaterialSearchResponse; error?: string | null; message?: string };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(res.ok ? "材料搜索返回非 JSON" : `材料搜索失败 (HTTP ${res.status})`);
  }
  if (!res.ok || json.error) {
    throw new Error((json.message ?? json.error ?? "").trim() || `材料搜索失败 (HTTP ${res.status})`);
  }
  if (!json.data) throw new Error(json.message ?? "未返回数据");
  return json.data;
}
