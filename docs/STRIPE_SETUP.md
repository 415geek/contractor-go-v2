# Stripe 订阅配置（与 Supabase + Clerk）

> **安全**：永远不要把 `sk_` Secret Key 提交到 Git 或发给他人。若密钥曾出现在聊天、截图或公开仓库，请立即到 [Stripe Dashboard → API keys](https://dashboard.stripe.com/apikeys) **轮换（Roll key）**。

## 1. Stripe Dashboard

1. **创建产品**：Products → Add product，例如「Contractor Pro $39.99/mo」，类型 **Recurring**，保存后复制 **Price ID**（`price_...`）。
2. **获取密钥**：Developers → API keys  
   - **Publishable key** `pk_test_...` → 给 App 前端（仅公开）。  
   - **Secret key** `sk_test_...` → 仅服务器 / Supabase Secrets。
3. **Webhook**：Developers → Webhooks → Add endpoint  
   - **URL**：`https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook`  
   - **事件**（至少）：  
     - `checkout.session.completed`  
     - `customer.subscription.updated`  
     - `customer.subscription.deleted`  
   - 创建后复制 **Signing secret**（`whsec_...`）。

## 2. Supabase Secrets（生产 / 预览）

在 Project Settings → Edge Functions → **Secrets** 添加：

| Name | 说明 |
|------|------|
| `STRIPE_SECRET_KEY` | `sk_test_...` 或 `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...`（与上面 Webhook Endpoint 对应） |
| `STRIPE_PRICE_ID_PRO` | `price_...`（$39.99 那条 recurring price） |
| `PUBLIC_APP_URL` | 可选，默认 `https://www.contractorgo.io`；用于 Checkout 成功/取消跳转 |

保存后 **重新部署** 相关 Edge Functions。

## 3. 本地 `supabase/.env`（仅开发）

复制变量名，值填你自己的（勿提交）：

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
```

本地用 Stripe CLI 转发 Webhook 时：`stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`，CLI 会打印一个 **临时** `whsec_` 用于本地。

## 4. 前端（Expo / Web）

在 `mobile/.env` 与 Vercel 环境变量中添加（**仅 Publishable key**）：

```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 5. 数据库迁移

执行迁移 `202603200001_stripe_user_columns.sql`（为 `users` 增加 `stripe_customer_id`、`stripe_subscription_id`）。  
生产环境：`supabase db push` 或在 Dashboard 执行 SQL。

## 6. 流程说明

1. 用户登录（Clerk）后，App 调用 Edge **`create-stripe-checkout`**（POST + `Authorization: Bearer <Clerk JWT>`）。
2. 返回 Stripe Checkout **URL**，用户完成支付。
3. Stripe 调用 **`stripe-webhook`**：将 `public.users` 中对应 Clerk `id` 的 **`subscription_tier` 设为 `pro`**，并写入 **`subscription_expires_at`**、`stripe_customer_id`、`stripe_subscription_id`。
4. 订阅取消/删除时，Webhook 将 tier 置回 **`free`**（可按业务再改）。

## 7. 部署 Functions

```bash
supabase functions deploy stripe-webhook create-stripe-checkout --project-ref <PROJECT_REF>
```

## 8. 与「虚拟号码」权益

购号权限建议在 **`voip-purchase-number`** 中校验 `subscription_tier === 'pro'` 且未过期（可另开 PR 实现）。
