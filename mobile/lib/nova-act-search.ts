import { edgeFunctionClerkHeaders, edgeFunctionUrl, requireSupabasePublicEnv } from "@/lib/api/supabase-edge";
import { getClerkSessionTokenForEdge } from "@/lib/clerk-session-token";

export type MaterialSearchHit = {
  product_name: string;
  price: string;
  image_url: string;
  product_url: string;
  store: "HomeDepot" | "Lowes";
  stock_status: "in_stock" | "out_of_stock" | "unknown";
};

/** 大模型给出的比价焦点选项（用户点选后带 search_keywords 再请求） */
export type MaterialClarificationOption = {
  id: string;
  label_zh: string;
  search_keywords: string[];
};

export type MaterialSearchPayload = {
  image_urls?: string[];
  description?: string;
  /** 用户选定选项或自定义后传入，跳过视觉分析直接按关键词比价 */
  search_keywords?: string[];
};

export type MaterialSearchResponse = {
  ai_recognized: Record<string, unknown>;
  /** 需用户从选项中选一项或自定义后再搜 */
  needs_clarification: boolean;
  clarification_question_zh: string | null;
  clarification_options: MaterialClarificationOption[];
  allow_custom_focus: boolean;
  in_stock: MaterialSearchHit[];
  out_of_stock: MaterialSearchHit[];
  unknown_stock: MaterialSearchHit[];
  search_id: string | null;
};

export async function searchMaterialPrices(
  getToken: () => Promise<string | null>,
  payload: MaterialSearchPayload,
): Promise<MaterialSearchResponse> {
  const token = await getClerkSessionTokenForEdge(getToken);
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
  const d = json.data;
  return {
    ...d,
    needs_clarification: d.needs_clarification === true,
    clarification_question_zh: d.clarification_question_zh ?? null,
    clarification_options: Array.isArray(d.clarification_options) ? d.clarification_options : [],
    allow_custom_focus: d.allow_custom_focus !== false,
  };
}
