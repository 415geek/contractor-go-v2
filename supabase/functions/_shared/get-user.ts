import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const padded = part.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export type RequestUser = { id: string; email: string | null };

export async function getUserFromRequest(req: Request): Promise<RequestUser | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);

  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const userId = typeof payload.sub === "string" ? payload.sub : null;
  const email = typeof payload.email === "string" ? payload.email : null;
  if (!userId) return null;

  const client = createClient(
    getEnv("SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Ensure a row exists in public.users for this Clerk user.
  // On first sign-in via Clerk, no row exists yet — upsert it.
  await client
    .from("users")
    .upsert(
      { id: userId, email },
      { onConflict: "id", ignoreDuplicates: true },
    );

  return { id: userId, email };
}
