import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/**
 * 解码 JWT 第二段（payload）。Base64URL 常省略 padding。
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const part = parts[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padLen);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as Record<string, unknown>;
  } catch (e) {
    console.warn("[get-user] JWT payload decode failed:", e);
    return null;
  }
}

/** Supabase 签发的 JWT：issuer 在 supabase.co，或 role 为 anon / service_role */
function looksLikeSupabaseJwtPayload(payload: Record<string, unknown>): boolean {
  const iss = payload.iss;
  if (typeof iss === "string" && iss.includes("supabase.co")) return true;
  const role = payload.role;
  if (typeof role === "string" && (role === "anon" || role === "service_role")) {
    return true;
  }
  return false;
}

/**
 * Clerk Session JWT：sub 为 user_…，或 issuer 含 clerk
 * 注意：不要把 role==="authenticated" 当成 Supabase —— Clerk 也常用该值，误判会导致 Authorization 里的 Clerk JWT 被丢弃 → 401。
 */
function looksLikeClerkJwtPayload(payload: Record<string, unknown>): boolean {
  const sub = payload.sub;
  if (typeof sub === "string" && sub.startsWith("user_")) return true;
  const iss = payload.iss;
  if (typeof iss === "string" && (iss.includes("clerk") || iss.includes("clerk.accounts"))) return true;
  return false;
}

/**
 * 从请求头取出 **Clerk** 会话 JWT：
 * 1) 优先 `X-Clerk-Authorization`
 * 2) 否则 `Authorization`：若明显是 Supabase anon/service JWT 则忽略；若明显是 Clerk 则采用
 */
function extractClerkBearerToken(req: Request): string | null {
  const xRaw = req.headers.get("x-clerk-authorization") ?? req.headers.get("X-Clerk-Authorization");
  if (xRaw?.startsWith("Bearer ")) {
    const t = xRaw.slice(7).trim();
    if (t) return t;
  }
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return token;
  }
  if (looksLikeClerkJwtPayload(payload)) {
    return token;
  }
  if (looksLikeSupabaseJwtPayload(payload)) {
    return null;
  }
  return token;
}

function pickEmailFromPayload(payload: Record<string, unknown>): string | null {
  const e = payload.email;
  if (typeof e === "string" && e.trim()) return e.trim();
  const p = payload.primary_email_address;
  if (typeof p === "string" && p.trim()) return p.trim();
  return null;
}

/**
 * Clerk verifyToken 可选：允许的浏览器来源（生产域名需在 Clerk Dashboard 与此前缀一致）。
 * Supabase Secret：`CLERK_AUTHORIZED_PARTIES` = `https://www.contractorgo.io,https://contractorgo.io`
 */
function clerkVerifyExtraOptions(): { authorizedParties?: string[] } {
  const raw = Deno.env.get("CLERK_AUTHORIZED_PARTIES")?.trim();
  if (!raw) return {};
  const parties = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return parties.length ? { authorizedParties: parties } : {};
}

function pickUserIdAndEmailFromVerifiedClaims(
  p: Record<string, unknown>,
): { userId: string; email: string | null } | null {
  const userId =
    typeof p.sub === "string"
      ? p.sub
      : typeof p.user_id === "string"
        ? p.user_id
        : null;
  if (!userId) return null;
  const email =
    typeof p.email === "string"
      ? p.email
      : typeof p.primary_email_address === "string"
        ? p.primary_email_address
        : null;
  return { userId, email };
}

async function resolveClerkUserIdAndEmail(token: string): Promise<{ userId: string; email: string | null } | null> {
  const secret = Deno.env.get("CLERK_SECRET_KEY")?.trim();
  const jwtKey = Deno.env.get("CLERK_JWT_KEY")?.trim();
  const parts = token.split(".");

  if (secret || jwtKey) {
    const { verifyToken } = await import("npm:@clerk/backend@2.33.0");
    const extra = clerkVerifyExtraOptions();
    if (secret) {
      try {
        const p = await verifyToken(token, { secretKey: secret, ...extra });
        const out = pickUserIdAndEmailFromVerifiedClaims(p as Record<string, unknown>);
        if (out) return out;
      } catch (e) {
        console.warn("[get-user] verifyToken(secretKey) failed:", e);
      }
    }
    /** PEM 公钥：Edge 无网络拉 JWKS 时推荐；Dashboard → API Keys → JWT verification key */
    if (jwtKey) {
      try {
        const p = await verifyToken(token, { jwtKey, ...extra });
        const out = pickUserIdAndEmailFromVerifiedClaims(p as Record<string, unknown>);
        if (out) return out;
      } catch (e) {
        console.warn("[get-user] verifyToken(jwtKey) failed:", e);
      }
    }
  }

  if (parts.length === 5 && !secret && !jwtKey) {
    console.warn(
      "[get-user] Clerk session looks like JWE (5 segments). Set CLERK_SECRET_KEY or CLERK_JWT_KEY in Edge Function secrets.",
    );
  }

  if (parts.length >= 3) {
    const payload = decodeJwtPayload(token);
    if (payload) {
      const userId =
        typeof payload.sub === "string"
          ? payload.sub
          : typeof payload.user_id === "string"
            ? payload.user_id
            : null;
      const email = pickEmailFromPayload(payload);
      if (userId) return { userId, email };
    }
  }
  return null;
}

export type RequestUser = { id: string; email: string | null };

export async function getUserFromRequest(req: Request): Promise<RequestUser | null> {
  const token = extractClerkBearerToken(req);
  if (!token) return null;

  const resolved = await resolveClerkUserIdAndEmail(token);
  if (!resolved) return null;

  const { userId, email } = resolved;

  const client = createClient(
    getEnv("SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { error: upsertErr } = await client.from("users").upsert({ id: userId }, { onConflict: "id" });
  if (upsertErr) {
    console.error("[get-user] public.users upsert failed:", upsertErr.message, upsertErr);
    return null;
  }

  if (email) {
    const { error: emailErr } = await client.from("users").update({ email }).eq("id", userId);
    if (emailErr) {
      console.warn("[get-user] email update skipped (duplicate or invalid):", emailErr.message);
    }
  }

  return { id: userId, email };
}
