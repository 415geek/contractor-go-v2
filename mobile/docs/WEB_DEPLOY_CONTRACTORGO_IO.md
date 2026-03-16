# Web App 部署到 www.contractorgo.io

## 1. 环境变量

部署或构建 Web 版时设置：

- `EXPO_PUBLIC_APP_URL=https://www.contractorgo.io`（已写入 `.env.example` / `.env.local`，生产构建时需在 CI/托管平台配置）

## 2. Supabase 控制台

在 [Supabase Dashboard](https://supabase.com/dashboard) → 当前项目 → **Authentication** → **URL Configuration**：

- **Site URL**：`https://www.contractorgo.io`
- **Redirect URLs** 中新增：`https://www.contractorgo.io/**`（或至少 `https://www.contractorgo.io/`）

否则邮箱验证、魔法链接等会无法正确跳回 Web App。

## 3. 部署步骤

1. 构建 Web 产物：
   ```bash
   cd mobile
   npm run build:web
   ```
2. 将输出目录（如 `dist/`）部署到已绑定 **www.contractorgo.io** 的托管（Vercel / Netlify / 自有服务器）。
3. 在托管平台的环境变量中配置 `EXPO_PUBLIC_APP_URL=https://www.contractorgo.io`（若支持构建时注入）。

## 4. 代码中的使用

- `lib/constants.ts` 中的 `WEB_APP_URL` 会使用 `EXPO_PUBLIC_APP_URL`，未设置时默认为 `https://www.contractorgo.io`。
- Supabase Auth 在 Web 上会将重定向地址设为该域名，便于登录回调。
