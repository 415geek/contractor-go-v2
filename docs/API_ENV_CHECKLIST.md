# API 与功能环境变量清单

确保以下环境变量已配置，各功能才能正常运行。

## Supabase Edge Functions Secrets

在 Supabase Dashboard → Project Settings → Edge Functions → Secrets 中配置：

| 变量 | 用途 | 必需 |
|------|------|------|
| `SUPABASE_URL` | 自动注入 | ✓ |
| `SUPABASE_ANON_KEY` | 自动注入 | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | 自动注入 | ✓ |
| `OPENAI_API_KEY` | Chat Completions（项目解析、生成计划、翻译、材料/房屋视觉、Permit 解析）+ Whisper（项目语音） | ✓（AI/语音相关功能） |
| `OPENAI_CHAT_MODEL` | 覆盖默认聊天模型（默认 `gpt-4o-mini`）；也可设 `OPENAI_MODEL` | 可选 |
| `STRIPE_SECRET_KEY` | `create-stripe-checkout` / 服务端 | 若启用 Stripe 订阅 |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook` 签名校验 | 若启用 Stripe 订阅 |
| `STRIPE_PRICE_ID_PRO` | Pro 月付 Price（`price_...`） | 若启用 Checkout |
| `TELNYX_API_KEY` | Telnyx 搜索/购买号码、发短信 | ✓（若用虚拟号码） |
| `TELNYX_MESSAGING_PROFILE_ID` | 订购时绑定 Messaging Profile（推荐） | 可选 |
| `TELNYX_CONNECTION_ID` | 订购时绑定语音 Connection | 可选 |
| `SOCRATA_APP_TOKEN` | Permit 查询走 SF DataSF（Socrata）时可选，提高 API 限额 | 可选 |
| `CLERK_SECRET_KEY` | Edge `get-user` 内 `verifyToken`（兼容 Clerk JWE Session；会拉 JWKS） | 生产 Session 为 JWE 时**二选一** |
| `CLERK_JWT_KEY` | Clerk Dashboard → API Keys → **JWT verification key**（PEM）；`verifyToken({ jwtKey })`，Edge 上**无网络**拉 JWKS | 与上一行**二选一**（推荐冷启动更快的 Edge） |
| `CLERK_AUTHORIZED_PARTIES` | 逗号分隔的前端来源，如 `https://www.contractorgo.io,https://contractorgo.io`；传给 `verifyToken` 的 `authorizedParties` | 若校验 session 报 azp/来源相关错误时再配 |

## 用户端 Web（Vercel 环境变量）

> 以下变量只配在 **`contractorgo-web`** 项目（Git 根目录、Root Directory 留空），与 `www.contractorgo.io` 正式站一致。勿只配在 Root=`mobile` 的预览项目。

| 变量 | 用途 |
|------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 连接 |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名 key |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk 认证 |
| `EXPO_PUBLIC_APP_URL` | 应用 URL（如 https://www.contractorgo.io） |

## 管理后台（Vercel 环境变量）

| 变量 | 用途 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 连接 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名 key |
| `SUPABASE_SERVICE_ROLE_KEY` | 管理后台 API 用 |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk 认证 |
| `CLERK_SECRET_KEY` | Clerk 服务端 |
| `ADMIN_USER_IDS` | 管理员白名单（Clerk user id，逗号分隔） |

## 功能与 Edge Function 对应

| 功能 | Edge Function | 依赖 |
|------|---------------|------|
| 消息/对话列表 | get-conversations, get-messages, create-conversation | - |
| 发消息 | send-message | TELNYX_API_KEY, translate |
| 虚拟号码列表 | voip-my-numbers | - |
| 搜索号码 | voip-available-numbers | TELNYX_API_KEY；`bay_area` / `state` / `area_code` / `state`+`ratecenter` |
| 购买号码 | voip-purchase-number | TELNYX_API_KEY；可选 TELNYX_MESSAGING_PROFILE_ID |
| 项目 CRUD | projects | - |
| 项目解析（语音/文字） | parse-project | `OPENAI_API_KEY`（文字/结构化用 Chat；语音另需 Whisper 同 key） |
| 生成计划 | generate-plan | `OPENAI_API_KEY` |
| 房屋估价 | estimate-house | `OPENAI_API_KEY`（视觉） |
| 材料搜索 | search-material | `OPENAI_API_KEY`（视觉） |
| 工具图片上传 | upload-tool-image | Storage `material-images` bucket；沿用自动注入的 Service Role |
| Permit 查询 | search-permit | `OPENAI_API_KEY`；可选 `SOCRATA_APP_TOKEN`（SF DataSF 限额） |
| 翻译 | translate | `OPENAI_API_KEY` |

## Clerk + Edge Functions（重要）

用户端请求 Edge 时：

- **`apikey`**：anon key（必填）；
- **`Authorization: Bearer <Clerk Session JWT>`**：与 `config.toml` 里各函数的 **`verify_jwt = false`** 配合，网关将 JWT 原样传到 Edge；
- **`X-Clerk-Authorization`**：与上面相同 Clerk JWT 的备份头；`get-user.ts` 优先读此头，避免个别代理行为差异。

在 Supabase Secrets 至少配置 **`CLERK_SECRET_KEY`** 或 **`CLERK_JWT_KEY`**（二选一），Edge 内使用 `@clerk/backend` 的 `verifyToken` 解析 Session（**生产常见为 JWE，无法仅靠手动 Base64 解码**）。未配置时仅能对 **3 段 JWT** 做无签名校验式解析，易导致 401。

## 存储上传说明

材料比价、房屋估价的图片经 Edge Function **`upload-tool-image`** 使用 **Service Role** 写入 Storage（客户端带 **Clerk JWT + apikey**），避免「仅用 anon + Clerk」时 Storage RLS 拒绝上传。

- 必须在 Supabase 存在 **`material-images`** bucket（**Public**，便于 AI 用公网 URL 拉图）。仓库已提供迁移 `supabase/migrations/202603210001_storage_material_images_bucket.sql`；新环境执行 `supabase db push` 即可创建。若报错 **Bucket not found**，在 Dashboard → **SQL Editor** 执行该文件中的 `INSERT INTO storage.buckets ...` 亦可。
- 部署：`supabase functions deploy upload-tool-image`
