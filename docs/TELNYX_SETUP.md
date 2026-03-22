# Telnyx 虚拟号码（替代 Voip.ms）

参考 [Telnyx 开发者文档](https://developers.telnyx.com/docs/overview) 与本项目 Edge 实现。

## 1. 控制台准备

1. 注册 [Telnyx](https://telnyx.com)，创建 **API Key**（V2）。
2. **Messaging Profile**（美国短信/长码）：  
   [Messaging → Messaging profiles](https://portal.telnyx.com/) 创建 Profile，配置 **Webhook URL** 为：  
   `https://<PROJECT_REF>.supabase.co/functions/v1/voip-webhook`  
   事件需包含 **`message.received`**（Inbound）。
3. 在 Profile 中关联 **10DLC Campaign**（美国本地号发短信通常需要，见 [10DLC 快速开始](https://developers.telnyx.com/docs/messaging/10dlc/quickstart/index)）。
4. 购号时可选：将 **Messaging Profile ID** 写入 Supabase Secret `TELNYX_MESSAGING_PROFILE_ID`，新号码会自动绑定该 Profile。

## 2. Supabase Secrets

| Secret | 说明 |
|--------|------|
| `TELNYX_API_KEY` | **必填**，Bearer `Authorization` |
| `TELNYX_MESSAGING_PROFILE_ID` | 可选，但推荐订购时绑定 |
| `TELNYX_CONNECTION_ID` | 可选，语音 SIP Connection |

移除旧变量：`VOIPMS_*`、`VOIP_RELAY_*`（已不再使用）。

## 3. 使用的 API（与代码对应）

| 能力 | Telnyx 端点 | 文档 |
|------|-------------|------|
| 搜索可用号 | `GET /v2/available_phone_numbers` | [List available phone numbers](https://developers.telnyx.com/api-reference/phone-number-search/list-available-phone-numbers.md) |
| 订购号码 | `POST /v2/number_orders` | [Create a number order](https://developers.telnyx.com/api-reference/phone-number-orders/create-a-number-order.md) |
| 发短信 | `POST /v2/messages` | [Send a message](https://developers.telnyx.com/api-reference/messages/send-a-message.md) |
| 入站短信 | Webhook `message.received` | [Receiving Webhooks](https://developers.telnyx.com/docs/messaging/messages/receiving-webhooks) |

## 4. 部署

```bash
supabase functions deploy voip-available-numbers voip-rate-centers voip-purchase-number voip-my-numbers voip-webhook send-message --project-ref <ref>
```

## 5. 数据库

`virtual_numbers.provider` 新购号码为 `telnyx`；历史 `voipms` 行仍保留，直至迁移或手动更新。
