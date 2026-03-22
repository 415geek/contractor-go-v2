# Vercel 部署设置：用户端 + 管理后台

同一个 GitHub 仓库需要**两个 Vercel 项目**：一个给用户端 Web（www.contractorgo.io），一个给管理后台（建议 admin.contractorgo.io）。

---

## 一、用户端 Web App（www.contractorgo.io）

### 1. 新建项目（若还没有）

1. 打开 [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** 选你的 **contractor-go-v2**（或 415geek/contractor-go-v2）
3. 点 **Import**

### 2. 项目配置（重要）

在导入后的配置页：

| 设置项 | 值 |
|--------|-----|
| **Project Name** | 填 `contractorgo-web`（或任意，用于区分） |
| **Root Directory** | 留空**不要改**（用仓库根目录） |
| **Framework Preset** | 选 **Other**（不要选 Next.js） |
| **Build Command** | 留空（用根目录 `vercel.json` 里的 `npm run build:web`） |
| **Output Directory** | 留空（用根目录 `vercel.json` 里的 `mobile/dist`） |
| **Install Command** | 留空（用 `npm install`） |

### 3. 环境变量（Environment Variables）

> **必需**：`EXPO_PUBLIC_*` 在 **`expo export` 构建时**写入静态包。若 Vercel 未配置 Supabase 两项，线上会报 `Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY` — **在 Dashboard 保存变量后务必 Redeploy**。

在配置页展开 **Environment Variables**，为 **Production**（及需要的 Preview）添加：

| Name | Value |
|------|--------|
| `EXPO_PUBLIC_SUPABASE_URL` | 你的 Supabase URL（如 `https://wvqyoyfiqixtmxssvlco.supabase.co`） |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | 你的 Supabase anon key（Dashboard → Project Settings → API） |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Publishable key（`pk_live_...` / `pk_test_...`） |
| `EXPO_PUBLIC_APP_URL` | `https://www.contractorgo.io` |

### 4. 部署

点 **Deploy**，等构建完成。

### 5. 绑定域名（重要：避免「不安全」提示）

1. 进入该项目 → **Settings** → **Domains**
2. 添加 **www.contractorgo.io** → **Add**
3. 添加 **contractorgo.io**（根域名）→ **Add**
4. 按 Vercel 提示到域名商配置：
   - **www**：CNAME 指向 `cname.vercel-dns.com`（或 Vercel 给出的地址）
   - **根域名 contractorgo.io**：A 记录指向 `76.76.21.21`，或使用 ALIAS/ANAME 指向 `cname.vercel-dns.com`（部分 DNS 商支持）
5. 确保两个域名都显示 **Valid** 和 **HTTPS 已启用**，否则手机访问会显示「不安全」

---

## 二、管理后台（建议 admin.contractorgo.io）

### 1. 再建一个项目

1. 再次打开 [vercel.com/new](https://vercel.com/new)
2. 同样 **Import** 同一个仓库 **contractor-go-v2**

### 2. 项目配置

| 设置项 | 值 |
|--------|-----|
| **Project Name** | 填 `contractorgo-admin` |
| **Root Directory** | 点 **Edit**，填 **`admin`** |
| **Framework Preset** | 选 **Next.js** |
| **Build Command** | 留空（默认 `npm run build`） |
| **Output Directory** | 留空（Next.js 默认） |
| **Install Command** | 留空 |

### 3. 环境变量

为 **Production** 添加：

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | 同上 Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 同上 anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 你的 service_role key（从 Supabase 控制台复制） |

### 4. 部署并绑定域名

1. 点 **Deploy**，等完成。
2. **Settings** → **Domains** → 添加 **admin.contractorgo.io**（在域名商里为 `admin` 添加 CNAME 指向 Vercel）。

---

## 三、Supabase + Clerk 配置（消息/对话功能）

Clerk 作为 Supabase 第三方认证时，需在 Supabase Dashboard 中配置：

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard/project/wvqyoyfiqixtmxssvlco) → **Authentication** → **Third-party providers**
2. 添加 **Clerk** 集成
3. **Domain** 填：`clerk.contractorgo.io`（Clerk Frontend API 域名，不含 https://）
4. 在 [Clerk Connect with Supabase](https://dashboard.clerk.com/setup/supabase) 完成 Clerk 侧配置

本地开发时，`supabase/.env` 已配置 `CLERK_DOMAIN=clerk.contractorgo.io`，运行 `supabase link`、`supabase functions deploy` 等命令时会自动使用。

---

## 四、检查清单

- [ ] **用户端**：Root Directory **留空**，Framework = **Other**，域名只绑 **www.contractorgo.io**
- [ ] **管理后台**：Root Directory = **admin**，Framework = **Next.js**，域名绑 **admin.contractorgo.io**（不要绑 www）
- [ ] 若 www.contractorgo.io 之前绑在 admin 项目上，已在该项目的 **Domains** 里**移除** www.contractorgo.io
- [ ] **Supabase**：Authentication → Third-party → Clerk 已添加，Domain = `clerk.contractorgo.io`

完成后：打开 https://www.contractorgo.io 应看到用户端（手机号登录）；打开 https://admin.contractorgo.io 应看到管理后台（邮箱+密码登录）。

---

## 五、SPA 路由与 `/home`（工作台）

用户端为 **Expo Web 静态导出**：`/`、`/home`、`/home/monitoring`、`/project/xxx` 等均由 **同一 `index.html`** 内的 Expo Router 解析。

- **仓库根目录部署**（推荐）：根目录 `vercel.json` 已配置 `rewrites`，将未命中静态文件的路径统一切到 `/index.html`，**直接刷新 `/home` 不会 404**。
- **仅将 `mobile` 作为 Vercel Root Directory 时**：请使用 `mobile/vercel.json`（已含同上 `rewrites`），否则深链会返回 404。
- **根目录 `middleware.js`**：把 `contractorgo.io` 转到 `www` 时会 **保留路径**（如 `/home` → `https://www.contractorgo.io/home`）。

**Clerk（Web OAuth）**：登录流程里 `redirectUrlComplete` 指向 **`/home`**。请在 [Clerk Dashboard](https://dashboard.clerk.com) → 你的应用 → **Paths / Redirect URLs** 中确保允许：

- `https://www.contractorgo.io/sso-callback`（OAuth 回跳，**必需**）
- `https://www.contractorgo.io/home`（及预览域名对应路径，如有）

---

## 六、根域名 contractorgo.io 显示「不安全」、www 正常

项目已配置 `middleware.js`：访问 `contractorgo.io` 会自动 308 重定向到 `https://www.contractorgo.io`（**保留路径与查询串**）。

**前提**：根域名必须指向 Vercel，否则请求不会到达 Vercel，重定向不会生效。

1. **Vercel**：Settings → Domains → 添加 `contractorgo.io`（与 www 同项目）
2. **DNS**：根域名 A 记录指向 `76.76.21.21`，或 ALIAS/ANAME 指向 `cname.vercel-dns.com`
3. 部署后，访问 `contractorgo.io` 会跳转到 `https://www.contractorgo.io`，不再显示「不安全」
