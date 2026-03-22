# 部署快速指南（配置 + 命令）

面向 **www.contractorgo.io（用户端 Web）** + **Supabase Edge** + 可选 **管理后台**。详细说明见 `VERCEL_SETUP.md`、`API_ENV_CHECKLIST.md`；鉴权 401 见 `DEBUG_AUTH.md`。

---

## 架构（不要搞混）

| 组件 | 说明 |
|------|------|
| **Vercel 项目 A：用户端** | 连接 **本仓库根目录**，`Root Directory` **留空**，用根目录 `vercel.json` 构建 `mobile/dist` |
| **Vercel 项目 B：管理后台** | `Root Directory` = `admin`，Next.js |
| **Supabase** | 数据库 + Edge Functions；**Project URL 与 anon key 必须同一页复制** |

不要用「只导入 `mobile/` 子目录」的项目去绑 **www.contractorgo.io**，除非你在该项目里也配齐全部 `EXPO_PUBLIC_*`（易与根目录项目重复、搞错变量）。

---

## 第一步：Supabase（Dashboard）

### 1.1 取连接信息（关键）

打开 **Project Settings → API**，在同一页复制：

- **Project URL** → 填 Vercel 的 `EXPO_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** → 填 `EXPO_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** → 仅服务端：Supabase Edge Secrets（多数自动注入）、管理后台 `SUPABASE_SERVICE_ROLE_KEY`

**禁止手打 URL 里的 project ref**（易把 `q` 打成 `g`、`tmx` 打成 `mxx`）。前端构建后会校验 URL 与 anon JWT 内 `ref` 是否一致。

### 1.2 Edge Functions → Secrets（Dashboard 或 CLI）

至少保证消息 / VoIP / 项目接口可用：

| Secret | 说明 |
|--------|------|
| **`CLERK_SECRET_KEY`** | Clerk **Secret**（`sk_live_` / `sk_test_`），与前端 **`pk_*` 同一应用**；生产 JWE 会话**必需**（或与下二选一） |
| **`CLERK_JWT_KEY`** | 可选：PEM，见 Clerk API Keys → JWT verification key |
| **`CLERK_AUTHORIZED_PARTIES`** | 可选：`https://www.contractorgo.io,https://contractorgo.io`（两域都写）；不配也可先排查 |
| **`OPENAI_API_KEY`** | AI 相关 Edge |
| **`TELNYX_API_KEY`** | 虚拟号码 / 短信（若启用） |

其余见 `API_ENV_CHECKLIST.md`。

### 1.3 数据库迁移

```bash
cd /path/to/contractor-go-v2
supabase link --project-ref <你的_PROJECT_REF>   # 若尚未 link
supabase db push --yes
```

---

## 第二步：Vercel — 用户端（www.contractorgo.io）

### 2.1 项目设置

| 项 | 值 |
|----|-----|
| Root Directory | **留空**（仓库根） |
| Framework | **Other** |
| Build / Output | 使用根目录 `vercel.json`（`npm run build:web` → `mobile/dist`） |

### 2.2 Production 环境变量

| 变量 | 来源 |
|------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase API 页 **Project URL** |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | 同页 **anon public** |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk → API Keys → Publishable（生产用 `pk_live_`） |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 若用 Stripe 结账（仅 `pk_`） |
| `EXPO_PUBLIC_APP_URL` | `https://www.contractorgo.io` |

保存后：**Deployments → 对最新 commit Redeploy**（改环境变量不自动重打旧包）。

### 2.3 域名

**Settings → Domains**：添加 `www.contractorgo.io` 与 `contractorgo.io`，按提示配 DNS。

---

## 第三步：Vercel — 管理后台（可选）

| 项 | 值 |
|----|-----|
| Root Directory | `admin` |
| Framework | Next.js |

环境变量：`NEXT_PUBLIC_SUPABASE_*`、`SUPABASE_SERVICE_ROLE_KEY`、`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`、`CLERK_SECRET_KEY`、`ADMIN_USER_IDS`（见 `API_ENV_CHECKLIST.md`）。

---

## 第四步：本机 CLI 部署 Edge Functions

在项目根目录（已 `supabase link` 到目标项目）：

```bash
supabase functions deploy --project-ref <你的_PROJECT_REF>
```

或已 link 时：

```bash
supabase functions deploy
```

修改了 `_shared/get-user.ts` 等共享代码后，建议**全量 deploy**（上式不带函数名即部署全部）。

---

## 第五步：验收清单

- [ ] 浏览器访问站点，F12 → Network：`get-conversations` 的域名是 **Supabase API 页上的同一个** `*.supabase.co`
- [ ] 已登录 Clerk 后，消息页无 `Invalid or missing token`
- [ ] Supabase → Edge → Logs 无持续 `[get-user] verifyToken failed`（若有可能要核对 `sk_`/`pk_` 同应用）

---

## 相关文档

- `docs/VERCEL_SETUP.md` — 分步截图级说明、常见问题  
- `docs/API_ENV_CHECKLIST.md` — 全量环境变量表  
- `docs/DEBUG_AUTH.md` — 401 / URL 打错 / Clerk 排查  
