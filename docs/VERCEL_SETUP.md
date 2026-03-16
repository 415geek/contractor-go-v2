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

在配置页展开 **Environment Variables**，为 **Production** 添加：

| Name | Value |
|------|--------|
| `EXPO_PUBLIC_SUPABASE_URL` | 你的 Supabase URL（如 `https://wvqyoyfiqixtmxssvlco.supabase.co`） |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | 你的 Supabase anon key |
| `EXPO_PUBLIC_APP_URL` | `https://www.contractorgo.io` |

### 4. 部署

点 **Deploy**，等构建完成。

### 5. 绑定域名 www.contractorgo.io

1. 进入该项目 → **Settings** → **Domains**
2. 在 **Domain** 输入框填：`www.contractorgo.io` → **Add**
3. 按页面提示到域名商（如 Hostinger）把 **www** 的 CNAME 指到 Vercel 给出的地址（通常是 `cname.vercel-dns.com` 或项目给的域名）

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

## 三、检查清单

- [ ] **用户端**：Root Directory **留空**，Framework = **Other**，域名只绑 **www.contractorgo.io**
- [ ] **管理后台**：Root Directory = **admin**，Framework = **Next.js**，域名绑 **admin.contractorgo.io**（不要绑 www）
- [ ] 若 www.contractorgo.io 之前绑在 admin 项目上，已在该项目的 **Domains** 里**移除** www.contractorgo.io

完成后：打开 https://www.contractorgo.io 应看到用户端（手机号登录）；打开 https://admin.contractorgo.io 应看到管理后台（邮箱+密码登录）。
