# Contractor GO v2

Phase 1 已完成以下基础能力：

- Supabase 数据库 Schema、索引与 RLS
- `send-otp` / `verify-otp` 两个 Edge Functions
- Expo Router + NativeWind + Zustand 移动端骨架
- Supabase 客户端封装与手机号 OTP 登录流程

## 目录说明

- `mobile/`: Expo 移动端
- `supabase/migrations/`: 数据库迁移
- `supabase/functions/`: Edge Functions

## 生产部署（配置 + 命令）

**一页汇总**：[`docs/DEPLOY_QUICKSTART.md`](docs/DEPLOY_QUICKSTART.md)（Vercel 用户端/后台、Supabase Secrets、CLI）。  
**用户端生产部署 = Vercel 项目 `contractorgo-web`**（仓库根目录、Root Directory 留空），不要用仅 `mobile` 子目录的其它项目绑 www。  
细节与域名：**[`docs/VERCEL_SETUP.md`](docs/VERCEL_SETUP.md)**；鉴权 401：**[`docs/DEBUG_AUTH.md`](docs/DEBUG_AUTH.md)**。  
Supabase URL 打错 ref：**[`docs/SUPABASE_REF_CHECK.md`](docs/SUPABASE_REF_CHECK.md)**。

## 环境变量

移动端环境变量参考 `mobile/.env.example`：

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Supabase Functions 环境变量参考 `supabase/.env.example`：

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

说明：

- Expo 只会把 `EXPO_PUBLIC_` 前缀变量暴露给客户端。
- Edge Functions 需要 `SERVICE_ROLE_KEY` 来写 `users` 和 `otp_rate_limits`。
- 不要把真实 `.env.local`、`.env.production` 提交到仓库。

## 本地联调

### 1. 安装前置依赖

- Node.js 20+
- Docker Desktop
- Supabase CLI

Supabase CLI 安装方式任选其一：

```bash
brew install supabase/tap/supabase
```

或

```bash
npm install -g supabase
```

### 2. 启动本地 Supabase

在项目根目录执行：

```bash
supabase start
```

第一次启动会拉取本地容器镜像。启动完成后查看本地地址和 key：

```bash
supabase status
```

如果你想用环境变量输出格式：

```bash
supabase status -o env
```

### 3. 初始化 Functions 环境变量

复制示例文件：

```bash
cp supabase/.env.example supabase/.env.local
```

然后把 `supabase status -o env` 输出中的值填入 `supabase/.env.local`。

常见填法：

- `SUPABASE_URL=http://127.0.0.1:55321`
- `SUPABASE_ANON_KEY=<local anon key>`
- `SUPABASE_SERVICE_ROLE_KEY=<local service role key>`

### 4. 应用数据库迁移

本地开发推荐直接重置并应用所有迁移：

```bash
supabase db reset
```

这会执行：

- `supabase/migrations/202603150001_phase1_core_schema.sql`
- `supabase/migrations/202603150002_phase1_schema.sql`

### 5. 本地运行 Edge Functions

在项目根目录执行：

```bash
supabase functions serve --env-file ./supabase/.env.local
```

如果只想单独调试一个函数：

```bash
supabase functions serve send-otp --env-file ./supabase/.env.local
supabase functions serve verify-otp --env-file ./supabase/.env.local
```

### 6. 初始化移动端环境变量

复制示例文件：

```bash
cp mobile/.env.example mobile/.env.local
```

然后填入本地 Supabase URL 和 anon key。

本地 URL 取值建议：

- iOS Simulator: `http://127.0.0.1:55321`
- Android Emulator: `http://10.0.2.2:55321`
- 真机调试: 把 `127.0.0.1` 替换成你电脑的局域网 IP

### 7. 启动移动端

```bash
cd mobile
npm install
npx expo start
```

### 8. 本地联调检查清单

- `supabase start` 正常启动
- `supabase db reset` 成功
- `supabase functions serve` 正常监听
- `mobile/.env.local` 已配置
- 登录页可发送验证码
- 验证成功后可以跳转到 `/(tabs)`
- 新用户自动写入 `public.users`

本地测试 OTP 可直接使用：

- `+15551234567` / `123456`
- `+8613800138000` / `123456`
- `+525512345678` / `123456`

## 线上部署

### 1. 创建 Supabase 线上项目

在 Supabase Dashboard 创建新项目后，记录以下信息：

- Project URL
- Project Reference
- Anon Key
- Service Role Key

### 2. 登录并绑定 Supabase 项目

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

### 3. 配置线上 Functions 环境变量

复制示例文件：

```bash
cp supabase/.env.example supabase/.env.production
```

填入线上项目的真实值后执行：

```bash
supabase secrets set --project-ref <your-project-ref> --env-file ./supabase/.env.production
```

### 4. 推送数据库迁移

```bash
supabase db push --project-ref <your-project-ref>
```

### 5. 部署 Edge Functions

```bash
supabase functions deploy send-otp --project-ref <your-project-ref>
supabase functions deploy verify-otp --project-ref <your-project-ref>
```

部署完成后可在 Dashboard 的 Functions 页面确认状态。

### 6. 配置移动端线上环境变量

复制示例文件：

```bash
cp mobile/.env.example mobile/.env.production
```

填入：

- `EXPO_PUBLIC_SUPABASE_URL=<your-project-url>`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>`

如果你使用 Expo/EAS，可以在对应环境里同步这些变量。

### 7. 线上验收建议

- `users`、`virtual_numbers`、`conversations` 等表已创建
- RLS 已启用
- `send-otp` / `verify-otp` 部署成功
- Supabase Auth 已开启 Phone 登录
- 短信模板与短信供应商配置可正常发送 OTP
- 移动端可连接线上 Supabase 并完成登录

## 常见问题

### 1. 移动端报缺少 `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`

- **本地**：复制 `mobile/.env.example` 为 `mobile/.env`（或 `.env.local`），填入两项后**重启** `npx expo`。
- **Vercel（www.contractorgo.io）**：在 **contractorgo-web** → **Settings** → **Environment Variables** 里为 **Production**（及需要的 Preview）添加同名变量，值与 `mobile/.env.example` 一致即可；**保存后必须 Redeploy**，否则构建阶段仍拿不到变量。详见 `docs/VERCEL_SETUP.md`。

### 2. Edge Function 报缺少 `SUPABASE_SERVICE_ROLE_KEY`

说明 `supabase/.env.local` 或线上 secrets 未设置完整。重新执行：

```bash
supabase secrets set --project-ref <your-project-ref> --env-file ./supabase/.env.production
```

### 3. 真机无法连接本地 Supabase

不要使用 `127.0.0.1`，改成你电脑的局域网 IP，并确保手机和电脑在同一网络。
