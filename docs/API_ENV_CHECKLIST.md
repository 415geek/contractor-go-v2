# API 与功能环境变量清单

确保以下环境变量已配置，各功能才能正常运行。

## Supabase Edge Functions Secrets

在 Supabase Dashboard → Project Settings → Edge Functions → Secrets 中配置：

| 变量 | 用途 | 必需 |
|------|------|------|
| `SUPABASE_URL` | 自动注入 | ✓ |
| `SUPABASE_ANON_KEY` | 自动注入 | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | 自动注入 | ✓ |
| `ANTHROPIC_API_KEY` | 翻译、房屋估价、材料搜索、Permit 解析、项目解析、生成计划 | ✓ |
| `OPENAI_API_KEY` | 项目语音转文字（Whisper） | ✓（若用语音输入） |
| `VOIPMS_USERNAME` | Voip.ms 搜索/购买号码、发短信 | ✓（若用虚拟号码） |
| `VOIPMS_PASSWORD` | Voip.ms API 密码 | ✓（若用虚拟号码） |

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
| 发消息 | send-message | VOIPMS_*, translate |
| 虚拟号码列表 | voip-my-numbers | - |
| 搜索号码 | voip-available-numbers | VOIPMS_* |
| 购买号码 | voip-purchase-number | VOIPMS_* |
| 项目 CRUD | projects | - |
| 项目解析（语音/文字） | parse-project | ANTHROPIC_API_KEY, OPENAI_API_KEY |
| 生成计划 | generate-plan | ANTHROPIC_API_KEY |
| 房屋估价 | estimate-house | ANTHROPIC_API_KEY |
| 材料搜索 | search-material | ANTHROPIC_API_KEY |
| Permit 查询 | search-permit | ANTHROPIC_API_KEY, Nova ACT API |
| 翻译 | translate | ANTHROPIC_API_KEY |

## 存储上传说明

材料比价、房屋估价的图片上传使用 Supabase Storage 的 `material-images` bucket。需确保该 bucket 的 RLS 策略允许上传。若使用 Clerk 认证，Supabase Storage 可能无法验证 Clerk JWT，建议将 `material-images` 配置为允许匿名上传（或通过 Edge Function 代理上传）。
