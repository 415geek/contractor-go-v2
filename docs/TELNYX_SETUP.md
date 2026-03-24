# Telnyx 虚拟号码（替代 Voip.ms）

参考 [Telnyx 开发者文档](https://developers.telnyx.com/docs/overview) 与本项目 Edge 实现。

## 1. 控制台准备

1. 注册 [Telnyx](https://telnyx.com)，创建 **API Key**（V2）。
2. **Messaging Profile**（美国短信/长码）：  
   [Messaging → Messaging profiles](https://portal.telnyx.com/) 创建 Profile，配置 **Webhook URL** 为：  
   `https://<PROJECT_REF>.supabase.co/functions/v1/voip-webhook`  
   事件需包含 **`message.received`**（Inbound）。
3. 在 Profile 中关联 **10DLC Campaign**（美国本地号发短信通常需要，见 [10DLC 快速开始](https://developers.telnyx.com/docs/messaging/10dlc/quickstart/index)）。
4. 购号时可选：将 **Messaging Profile ID**（控制台里该 Profile 的 **UUID**，形如 `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）写入 Supabase Secret `TELNYX_MESSAGING_PROFILE_ID`，新号码会自动绑定该 Profile。  
   **不要**把 `TELNYX_API_KEY`（以 `KEY` 开头）填进此项，否则会报 `Invalid Messaging Profile ID`。

## 2. Supabase Secrets

| Secret | 说明 |
|--------|------|
| `TELNYX_API_KEY` | **必填**，Bearer `Authorization` |
| `TELNYX_MESSAGING_PROFILE_ID` | **强烈建议**：购号绑定 + 发短信时传入 Profile；若号码曾未绑定，`send-message` 会在首次「from / Messaging Profile」错误时尝试 **PATCH 号码** 绑定到该 UUID 并重试一次 |
| `TELNYX_CONNECTION_ID` | 可选，语音 SIP Connection |

移除旧变量：`VOIPMS_*`、`VOIP_RELAY_*`（已不再使用）。

## 3. 使用的 API（与代码对应）

| 能力 | Telnyx 端点 | 文档 |
|------|-------------|------|
| 搜索可用号 | `GET /v2/available_phone_numbers` | [List available phone numbers](https://developers.telnyx.com/api-reference/phone-number-search/list-available-phone-numbers.md) |
| 订购号码 | `POST /v2/number_orders` | [Create a number order](https://developers.telnyx.com/api-reference/phone-number-orders/create-a-number-order.md) |
| 发短信 | `POST /v2/messages` | [Send a message](https://developers.telnyx.com/api-reference/messages/send-a-message.md) |
| 按号码查 ID / 绑定短信 Profile | `GET /v2/phone_numbers`、`PATCH /v2/phone_numbers/{id}/messaging` | `send-message` 自动修复（**不可**再 PATCH 根路径写 `messaging_profile_id`） |
| 入站短信 | Webhook `message.received` | [Receiving Webhooks](https://developers.telnyx.com/docs/messaging/messages/receiving-webhooks) |

## 4. 部署

```bash
supabase functions deploy voip-available-numbers voip-rate-centers voip-purchase-number voip-my-numbers voip-webhook send-message --project-ref <ref>
```

## 5. 数据库

`virtual_numbers.provider` 新购号码为 `telnyx`；历史 `voipms` 行仍保留，直至迁移或手动更新。

## 6. 常见错误：Only 1 order is allowed at your account level

这是 **Telnyx 对当前 API Key 对应账号** 的限制（试用/低等级账号常见：整账号只允许有限笔 `number_orders`），**不是** Contractor GO 产品文案里「免费档每用户 1 个号码」的同一件事。

- 若多人/多环境共用同一个 `TELNYX_API_KEY`，**任一环境先下单**都可能占满 Telnyx 侧额度，其他人会收到该英文报错，且 **App 内「我的号码」仍为空**（因为订单未成功完成、未写入 `virtual_numbers`）。
- 处理：在 [Telnyx Portal](https://portal.telnyx.com/) 升级套餐、使用生产专用 Key，或释放/完成已有号码订单；详见官方 [upgrade](https://telnyx.com/upgrade) 与计费说明。

## 7. SaaS 模式：单账号 API vs Managed Accounts（Reseller）

若需理解 **「普通 API」与「类经销商子账号」**、以及 **何时上 Managed Accounts**，见 **[TELNYX_SAAS_ARCHITECTURE.md](./TELNYX_SAAS_ARCHITECTURE.md)**。

## 8. 能发出短信但 App 里收不到回复（入站）

入站依赖 **Telnyx → 你们的 Webhook → Supabase `voip-webhook`**，请逐项核对：

1. **Messaging Profile 的 Webhook URL**  
   必须为：  
   `https://<PROJECT_REF>.supabase.co/functions/v1/voip-webhook`  
   且勾选 / 启用 **`message.received`**。改完后 Telnyx 侧可发一条测试短信看 **Webhook 投递日志**是否 2xx。

2. **号码挂在该 Profile 上**  
   购号时若配置了 `TELNYX_MESSAGING_PROFILE_ID`，号码会绑定该 Profile；若手动在 Telnyx 改过号码的 Messaging 设置，需仍指向带上述 Webhook 的 Profile。

3. **Supabase 日志**  
   Dashboard → Edge Functions → `voip-webhook` → Logs：  
   - `Unknown number`：入站 `to` 与 `virtual_numbers.phone_number` 不一致（格式应为 `+1XXXXXXXXXX`）。  
   - `invalid_body`：Webhook 体与预期不符（已兼容 Telnyx 常见 `from`/`to` 字符串与 `text`/`body`；部署最新 `voip-webhook` 后再试）。

4. **部署**  
   修改过 `voip-webhook` 后执行：  
   `supabase functions deploy voip-webhook --project-ref <ref>`
