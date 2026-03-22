import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    [
      "缺少 Supabase 环境变量：EXPO_PUBLIC_SUPABASE_URL 或 EXPO_PUBLIC_SUPABASE_ANON_KEY。",
      "这些变量必须在「构建 expo export」时已存在（会打进静态包）。",
      "Vercel：Project → Settings → Environment Variables → Production 添加两项，保存后对最新 commit 执行 Redeploy。",
      "本地：复制 mobile/.env.example 为 mobile/.env 并填写，然后重启 npx expo。",
      "详见 docs/VERCEL_SETUP.md。",
    ].join(" "),
  );
}

// 使用 Clerk 认证，不持久化 Supabase Auth session，避免旧 session 导致 "No suitable key"
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export function createAuthenticatedClient(token: string) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
