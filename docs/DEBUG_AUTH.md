# 调试：消息 / VoIP / 项目 报「Invalid or missing token」或 401

现象多为 **Supabase Edge** 里 `get-user` 无法从 Clerk Session 解析出用户，与「昨天能用、今天不行」常见原因如下。

## 1. 先区分：401 来自网关还是 Edge？

在浏览器 **Network** 里点开失败的 `.../functions/v1/get-conversations`（或 `me-profile`）：

| 情况 | 含义 |
|------|------|
| 响应体是 JSON，含 `message: "Invalid or missing token"` | **Edge 内** `getUserFromRequest` 失败（本文重点） |
| 401 且 body 为空或非项目 JSON | 多为 **Supabase 网关**（例如 `verify_jwt`、API key） |

## 2. Edge 解析失败：最常见 4 条

### A. 未配置或配错 `CLERK_SECRET_KEY` / `CLERK_JWT_KEY`

生产环境 Clerk Session 常为 **JWE（token 里约 5 段 `.`）**，必须在 **Supabase → Project Settings → Edge Functions → Secrets** 配置：

- **`CLERK_SECRET_KEY`**（`sk_live_...` 与前端 **`pk_live_` 同一 Clerk 应用**），或  
- **`CLERK_JWT_KEY`**（PEM）

**不要**前端用 `pk_live_`、Secret 里却留 `sk_test_`（或反过来），否则会 `verifyToken` 失败。

### B. `CLERK_AUTHORIZED_PARTIES` 与当前访问域名不一致

若在 Secrets 里配置了例如：

`https://www.contractorgo.io`

用户却从 **`https://contractorgo.io`**（无 www）打开，Clerk 的 `azp` 校验可能失败。

**处理：**

- 把两个都写进 Secret（逗号分隔，无空格）：  
  `https://www.contractorgo.io,https://contractorgo.io`  
- 或 **先删掉** `CLERK_AUTHORIZED_PARTIES` 验证是否恢复（代码已支持：带 parties 失败时会**再试**不校验 azp，但日志里会有提示）。

### C. Vercel 构建变量与生产 Clerk 不一致

`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` 在 **构建时** 打进静态包。若误用占位符、或改了 Clerk 实例未 **Redeploy**，会出现登录异常或 token 与后端 Secret 不匹配。

### D. `public.users` 写入失败（少见）

若日志里有 **`[get-user] public.users upsert failed`**，鉴权已通过，是数据库/RLS/表结构问题，与 Clerk 无关；需在 Supabase **Logs → Edge Functions** 里看具体 PG 错误。

## 3. 看 Edge 日志（必做）

Supabase Dashboard → **Edge Functions** → 选函数 → **Logs**，搜索：

- `[get-user] token present but Clerk user unresolved` → 看 JSON 里的 `hint`、`hasClerkSecretKey`
- `[get-user] verifyToken` → 密钥或 parties 问题
- `[get-user] no Clerk bearer token` → 请求头未带到 Edge（检查前端 `Authorization` / `X-Clerk-Authorization`）

## 4. 本地快速核对清单

- [ ] Secrets：`CLERK_SECRET_KEY` 或 `CLERK_JWT_KEY` 已设，且与前端 `pk_*` 同环境、同应用  
- [ ] `CLERK_AUTHORIZED_PARTIES` 覆盖实际访问的完整 origin（含 www / 非 www）或暂时删除  
- [ ] Vercel Production 已配置真实 `EXPO_PUBLIC_*` 并已 **Redeploy**  
- [ ] `supabase functions deploy` 已执行，与当前仓库 `_shared/get-user.ts` 一致  
