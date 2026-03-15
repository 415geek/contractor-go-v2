import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import type { User } from "https://esm.sh/@supabase/supabase-js@2.49.1";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function getUserFromRequest(req: Request): Promise<User | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const client = createClient(
    getEnv("SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) return null;
  return user;
}
