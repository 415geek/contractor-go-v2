/**
 * 从 anon JWT payload 取 project ref（与 URL 子域应对齐）。
 */
function decodeJwtPayloadJson(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const part = parts[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padLen);
    if (typeof atob === "undefined") return null;
    const binary = atob(padded);
    return JSON.parse(binary) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** 例如 https://wvqyoyfiqixtmxssvlco.supabase.co → wvqyoyfiqixtmxssvlco */
export function supabaseProjectRefFromUrl(urlString: string): string | null {
  try {
    const host = new URL(urlString.trim()).hostname.toLowerCase();
    if (!host.endsWith(".supabase.co")) return null;
    return host.slice(0, -".supabase.co".length);
  } catch {
    return null;
  }
}

/**
 * Vercel 上手工粘贴 URL 时极易把 ref 打错（如 q/g、tmx/mxx），会导致 Edge 打到别的项目 → 401。
 * anon key JWT 内含 `ref`，与 hostname 必须一致。
 */
export function assertSupabaseUrlMatchesAnonKey(url: string, anonKey: string): void {
  const refFromUrl = supabaseProjectRefFromUrl(url);
  if (!refFromUrl) return;
  const payload = decodeJwtPayloadJson(anonKey);
  const refFromJwt = payload?.ref;
  if (typeof refFromJwt !== "string" || !refFromJwt) return;
  if (refFromUrl === refFromJwt) return;
  throw new Error(
    `Supabase 配置不一致：EXPO_PUBLIC_SUPABASE_URL 中的项目为「${refFromUrl}」，但 anon key 对应「${refFromJwt}」。请到 Supabase Dashboard → Project Settings → API 同一页复制 Project URL 与 anon public key，更新 Vercel Environment Variables 后 Redeploy。`,
  );
}

/**
 * 浏览器 / Web 调用 Supabase Edge Functions 时，需同时携带 Authorization 与 apikey（与 supabase-js invoke 一致）。
 */
export function requireSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY");
  }
  assertSupabaseUrlMatchesAnonKey(url, anonKey);
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
