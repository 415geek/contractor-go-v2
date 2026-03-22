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

/**
 * 调用需识别 Clerk 用户的 Edge Function。
 * - `apikey` + `Authorization: Bearer <Clerk Session JWT>`：`verify_jwt=false` 时网关会放行并把 JWT 传到 Edge。
 * - 同时带 `X-Clerk-Authorization` 作备份：若网关/代理剥离自定义头，仍可从 `Authorization` 解析 Clerk（见 get-user.ts）。
 * - 仅发 anon 在 `Authorization` 曾导致部分环境剥离 `X-Clerk` 后无法识别用户。
 */
export function edgeFunctionClerkHeaders(anonKey: string, clerkJwt: string): Record<string, string> {
  return {
    Authorization: `Bearer ${clerkJwt}`,
    apikey: anonKey,
    "X-Clerk-Authorization": `Bearer ${clerkJwt}`,
  };
}
