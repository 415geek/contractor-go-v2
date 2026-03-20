/**
 * 浏览器 / Web 调用 Supabase Edge Functions 时，需同时携带 Authorization 与 apikey（与 supabase-js invoke 一致）。
 */
export function requireSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY");
  }
  return { url, anonKey };
}

export function supabaseAnonAuthHeaders(anonKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${anonKey}`,
    apikey: anonKey,
  };
}

export function edgeFunctionUrl(baseUrl: string, name: string, searchParams?: URLSearchParams): string {
  const q = searchParams?.toString();
  return `${baseUrl.replace(/\/$/, "")}/functions/v1/${name}${q ? `?${q}` : ""}`;
}
