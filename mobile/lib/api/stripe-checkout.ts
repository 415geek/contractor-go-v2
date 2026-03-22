import { edgeFunctionClerkHeaders, edgeFunctionUrl, requireSupabasePublicEnv } from "@/lib/api/supabase-edge";

export type CreateStripeCheckoutResult = { url: string; id: string };

/**
 * 创建 Stripe Checkout 订阅会话（需登录）。成功/取消跳转 URL 可选覆盖。
 */
export async function createStripeCheckoutSession(
  clerkJwt: string,
  options?: { success_url?: string; cancel_url?: string },
): Promise<CreateStripeCheckoutResult> {
  const { url, anonKey } = requireSupabasePublicEnv();
  const res = await fetch(edgeFunctionUrl(url, "create-stripe-checkout"), {
    method: "POST",
    headers: {
      ...edgeFunctionClerkHeaders(anonKey, clerkJwt),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options ?? {}),
  });
  const text = await res.text();
  let json: { data?: { url?: string; id?: string }; error?: string | null; message?: string };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(res.ok ? "订阅服务返回非 JSON" : `订阅服务异常 (HTTP ${res.status})`);
  }
  if (!res.ok || json.error) {
    throw new Error((json.message ?? json.error ?? "").trim() || `请求失败 (HTTP ${res.status})`);
  }
  const u = json.data?.url;
  const id = json.data?.id;
  if (!u || !id) throw new Error(json.message?.trim() || "未返回 Checkout 链接");
  return { url: u, id };
}
