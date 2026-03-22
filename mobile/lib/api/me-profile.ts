import { edgeFunctionClerkHeaders, edgeFunctionUrl, requireSupabasePublicEnv } from "@/lib/api/supabase-edge";

export type MeProfileUsage = {
  sms_outbound_sent: number;
  sms_outbound_limit: number | null;
  voice_seconds_used: number;
  voice_seconds_limit: number | null;
};

export type MeProfileVirtualNumber = {
  id: string;
  phone_number: string;
  status?: string;
  metadata?: Record<string, unknown>;
};

export type MeProfileData = {
  subscription_tier: string;
  subscription_expires_at: string | null;
  is_pro: boolean;
  virtual_numbers: MeProfileVirtualNumber[];
  usage: MeProfileUsage;
};

/**
 * 拉取当前用户订阅状态与虚拟号用量（Edge `me-profile`）。
 */
export async function fetchMeProfile(clerkJwt: string): Promise<MeProfileData> {
  const { url, anonKey } = requireSupabasePublicEnv();
  const res = await fetch(edgeFunctionUrl(url, "me-profile"), {
    method: "GET",
    headers: edgeFunctionClerkHeaders(anonKey, clerkJwt),
  });
  const text = await res.text();
  let json: { data?: MeProfileData; error?: string | null; message?: string };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(res.ok ? "me-profile 返回非 JSON" : `me-profile 异常 (HTTP ${res.status})`);
  }
  if (!res.ok || json.error) {
    throw new Error((json.message ?? json.error ?? "").trim() || `请求失败 (HTTP ${res.status})`);
  }
  const d = json.data;
  if (!d) throw new Error(json.message?.trim() || "无数据");
  return d;
}
