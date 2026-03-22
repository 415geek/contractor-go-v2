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

## 用户端 Web（Vercel 环境变量）

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

## 存储上传说明

材料比价、房屋估价的图片经 Edge Function **`upload-tool-image`** 使用 **Service Role** 写入 Storage（客户端带 **Clerk JWT + apikey**），避免「仅用 anon + Clerk」时 Storage RLS 拒绝上传。

- 需在 Supabase 创建 **`material-images`** bucket；建议 **Public bucket**（或至少对匿名读开放），以便 AI 视觉接口通过公网 URL 拉取图片。
- 部署：`supabase functions deploy upload-tool-image`
