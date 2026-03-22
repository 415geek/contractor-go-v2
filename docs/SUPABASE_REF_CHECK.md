# 核对 Supabase Project URL（避免手打错 ref）

## 现象

浏览器 DevTools → Network 里，请求类似：

`https://<一段 ref>.supabase.co/functions/v1/...`

若出现 **401 / Invalid or missing token**，先核对 **`<一段 ref>`** 是否就是你在 Supabase Dashboard 里**当前项目**的 ref。

## 本仓库文档/示例里用的 ref（对照用）

`mobile/.env.example` 中的示例 URL 为：

```text
https://wvqyoyfiqixtmxssvlco.supabase.co
```

即 ref = **`wvqyoyfiqixtmxssvlco`**（23 个字符，注意 **`q` 不是 `g`**，**`tmx`** 不是 **`kmx` / `mxx`** 等）。

若你线上 Network 里看到的是别的字符串（例如曾出现过的 `wvgy...`、`...figixk...`），说明 **Vercel `EXPO_PUBLIC_SUPABASE_URL` 仍不是从 Dashboard 复制的**，或与 anon key 一起整段抄错。

## 正确做法（不要手打 ref）

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard) → 选中**你要用的那个项目**。  
2. **Project Settings → API**。  
3. 用 **Copy** 复制 **Project URL**（整段 `https://xxxx.supabase.co`）。  
4. 同一页再复制 **anon public** key。  
5. 粘贴到 Vercel **`contractorgo-web`** → **Environment Variables**：  
   - `EXPO_PUBLIC_SUPABASE_URL` = 刚复制的 URL  
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = 刚复制的 anon key  
6. **Save → Redeploy Production**。

## 若你的项目不是示例里的 ref

可以新建项目，ref 会不同——**以 Dashboard 显示的 URL 为准**。关键是：**URL 与 anon key 必须来自同一页、同一次复制**，且 redeploy 后 Network 里的 hostname 与 Dashboard **逐字符一致**。

## Edge 仍 401 时

在 **该 Supabase 项目**的 **Edge Functions → Secrets** 配置 **`CLERK_SECRET_KEY`**（与前端 Clerk `pk_*` 同一应用）。详见 `DEBUG_AUTH.md`。
