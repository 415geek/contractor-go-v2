# ContractorGo：信息模块接入 Twilio Toll-Free（过渡期）架构方案

> **角色定位**：在保留现有 Telnyx / 虚拟号 / 10DLC 相关代码与数据模型的前提下，新增 **Twilio Toll-Free + Messaging Service** 作为信息模块的 **interim 主发送通道**；未来可与 **10DLC 长码池**、**WhatsApp** 并行路由。  
> **现状对齐**：当前实现为 Supabase Edge（`send-message`、`translate`、`voip-webhook`）、`conversations` / `messages` / `virtual_numbers`、Clerk 鉴权、移动端会话 UI。

---

## 1) 架构原则

### 1.1 不删除、不替换 10DLC / Telnyx 路径

- **保留**：`telnyx-client.ts`、`send-message` 内 Telnyx 分支、`voip-webhook`（Telnyx 入站/终态）、`TELNYX_*` 环境变量、`virtual_numbers`、购号相关 Edge、`messages.external_message_id`（继续存放 **上游 Message ID**，Telnyx 或 Twilio 共用字段名，见 §3）。
- **新增**：Twilio 专用模块（如 `_shared/twilio-messaging.ts`）、可选新 Edge `twilio-messaging-webhook`（或在 `voip-webhook` 增加 **按路径/签名** 分流，**推荐独立函数** 便于签名校验与日志隔离）。
- **路由**：在 **单一出站编排点**（建议为 `send-message` 内部抽函数 `dispatchOutboundSms`）根据 **routing 策略** 选择 `provider = telnyx | twilio`，**禁止**在上层 duplicate 两套 HTTP 入口（移动端仍只调 `send-message`）。

### 1.2 发送通道抽象（provider / channel）

定义三层概念（命名建议与 DB 一致）：

| 概念 | 说明 |
|------|------|
| **messaging_channel** | 产品语义：`toll_free` \| `10dlc_long_code` \| `whatsapp`（预留） |
| **sms_provider** | 实现适配器：`twilio` \| `telnyx` |
| **sender_identity** | 实际发信号码或池：Twilio Messaging Service SID；Telnyx `virtual_number_id` + E.164 |

**OutboundPort 接口（逻辑）**：

```ts
type OutboundSmsRequest = {
  fromHint: { type: "messaging_service_sid"; sid: string } | { type: "e164"; number: string };
  toE164: string;
  body: string;           // 已翻译、最终待发英文（或目标语）
  statusCallbackUrl: string;
  mediaUrls?: string[];   // 预留 MMS
};

type OutboundSmsResult = { providerMessageId: string; raw?: unknown };
```

- Telnyx 适配器：封装现有 `telnyxSendSmsWithProfileRepair`。
- Twilio 适配器：`Messages.create({ messagingServiceSid, to, body, statusCallback })`。

### 1.3 未来切换规则（10DLC / WhatsApp）

- **配置驱动**：`messaging_routing_policies`（或远程配置表）定义：`default_channel`、`per_tenant_override`（未来）、`fallback_chain`。
- **会话级覆盖**：`conversations.outbound_channel`（nullable）— 未填则走全局默认；10DLC 通过后可将 **新会话** 默认改为 `10dlc_long_code`，老会话保持 `toll_free` 直至迁移。
- **并行**：同一用户可存在 **多条会话** 使用不同 channel；**禁止**硬编码全局单一路由（除 Phase 1 临时开关）。

### 1.4 上层业务不感知通道

- **移动端 / BFF**：只调用 `send-message`、`get-messages`、`update-conversation`（语言偏好）、`translate`（或合并进 send 的 preview 端点）。
- **禁止**：UI 直接调 Twilio REST。
- **返回**：`messages` 行带 `provider` + `external_message_id` + `status` + `last_error_code`（可选），UI 仅展示状态枚举，不分支 Telnyx/Twilio 逻辑。

---

## 2) 信息模块消息流（完整）

1. 用户在 ContractorGo 选择 **会话**（当前数据模型为 `conversations`，联系人字段在会话上；若引入 `contacts` 表则 `conversation.contact_id` 关联）。
2. 读取 **`contact_language` / preferred_language`**（现有 `conversations.contact_language` 可映射为 preferred target for outbound translation）。
3. 用户输入 **中文**（或任意源语言）→ 客户端可选先调 **`translateDraft`** 做预览（或仅 send 前服务端翻译）。
4. **检测源语言**（可选）：`translate` 支持 `source_lang: "auto"` 或与客户端声明的 `source_lang` 合并；落库 `messages.original_language`。
5. **翻译**为目标语（默认对方 **英文**）→ 得到 `translated_body`；支持 **tone**（见 §6）在 translate 层追加 system 片段。
6. **持久化**：插入 `messages`：`original_content`、`translated_content`（待发副本）、`body`（与现有一致：展示/兼容字段）、`direction=outbound`、`status=queued`（建议新增 queued，或暂用 `sent` 在 Twilio 接受前改为 `queued` 需与现有 enum 对齐，见 §3）。
7. **dispatchOutboundSms**：若 `MESSAGE_DEFAULT_CHANNEL=toll_free` → Twilio **Messaging Service** 发送；写回 `external_message_id = SMxxxx`（Twilio SID），`sms_provider=twilio`，`messaging_channel=toll_free`。
8. **Twilio Status Callback** → `delivery_events` 追加行 + 更新 `messages.status`（`sent` / `delivered` / `undelivered` / `failed`）；错误码写入 `delivery_events.error_code`。
9. **对方回复** → Twilio **Inbound Webhook**（同号 Toll-Free）→ 解析 `From` / `To` / `Body` / `MessageSid`。
10. **会话归属**：`(To = 我方 Toll-Free)` + `(From = contact_phone 规范化)` → 查 `conversations`：`contact_phone` 匹配且 **`user_id` 唯一性规则**（见风险 §11）；必要时 **最近活跃会话** + **时间窗**。
11. **入站可选翻译**：将英文译为 **用户 default_language**（`users.default_language`），写入 `translated_content`；`original_content` 存对方英文。
12. **UI**：气泡展示 **原文/译文**、**发送状态**、**失败重试**、**STOP 提示**（若 Twilio 标记 opt-out）。

---

## 3) 数据库设计

> **原则**：尽量 **扩展** 现有 `conversations` / `messages`，新增表承载 **多通道、投递轨迹、审计**；**不删除** `virtual_number_id`、`external_message_id` 等 Telnyx 相关列。

### 3.1 `conversations`（扩展，兼容现有）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | uuid | Y | 现有主键 |
| `user_id` | text | Y | Clerk 用户，现有 |
| `virtual_number_id` | uuid, nullable | N | **保留**；Toll-Free 阶段可为 **NULL**（不绑用户独号） |
| `contact_phone` | text | Y | E.164，现有 |
| `contact_name` | text | N | 现有 |
| `contact_company` | text | N | 现有 |
| `contact_notes` | text | N | 现有 |
| `contact_language` | text | Y | **对方偏好语言 / outbound 目标语**（现有，等同 preferred_language） |
| `outbound_channel` | text | N | `toll_free` \| `10dlc_long_code` \| `whatsapp`；默认 NULL = 走全局策略 |
| `last_message_at` | timestamptz | N | 现有 |
| `created_at` | timestamptz | Y | 现有 |

### 3.2 `messages`（扩展）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | uuid | Y | 现有 |
| `conversation_id` | uuid | Y | 现有 |
| `user_id` | text | Y | 现有 |
| `direction` | enum | Y | inbound / outbound |
| `message_type` | text | Y | text / image / video，现有 |
| `body` | text | Y | 现有；建议规范：**用户主展示文本**（出站：可与 original 一致；入站：原文） |
| `original_content` | text | N | 现有；**原文** |
| `translated_content` | text | N | 现有；**译文**（出站存目标语副本；入站存译给用户看的语言） |
| `original_language` | text | N | 现有 |
| `translated_language` | text | N | 现有 |
| `status` | message_status | Y | 建议扩展 enum：`queued`（若 DB 允许迁移）或复用 `sent` + `delivery_events` 表达细粒度 |
| `external_message_id` | text | N | **保留**；存 Telnyx **或** Twilio SID（**同一列多提供商**，查询时配合 `sms_provider`） |
| `sms_provider` | text | N | **`telnyx` \| `twilio`**，新增 |
| `messaging_channel` | text | N | **`toll_free` \| `10dlc_long_code` \| …**，新增 |
| `media_url` | text | N | 现有 |
| `translation_tone` | text | N | `professional` \| `friendly` \| `firm` \| `concise`，新增 |
| `translation_edited` | boolean | N | 是否用户改写过译文再发，默认 false |
| `edited_translated_content` | text | N | 若编辑发送，存最终发出文本快照（可与 `translated_content` 合并策略二选一） |
| `idempotency_key` | text | N | 客户端 UUID，防重复插入，新增 unique (user_id, idempotency_key) 可选 |

### 3.3 `message_translations`（可选，审计增强）

当需要 **一次发送多轮翻译尝试** 或严格审计时，从 `messages` 拆出；**MVP 可省略**，用 `messages` 列即可。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | uuid | Y | PK |
| `message_id` | uuid | Y | FK → messages |
| `step` | text | Y | `draft_auto` \| `user_edit` \| `final` |
| `source_text` | text | Y | |
| `target_text` | text | Y | |
| `source_lang` | text | N | |
| `target_lang` | text | N | |
| `tone` | text | N | |
| `created_by_user_id` | text | N | |
| `created_at` | timestamptz | Y | |

### 3.4 `messaging_channels`（通道配置）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | uuid | Y | PK |
| `channel_key` | text | Y | `toll_free` \| `10dlc_long_code` \| `whatsapp` |
| `sms_provider` | text | Y | `twilio` \| `telnyx` |
| `is_active` | boolean | Y | |
| `config` | jsonb | Y | 如 `{ "messaging_service_sid": "MG...", "toll_free_number": "+18..." }`，**勿存 auth token** |
| `priority` | int | N | 路由排序 |
| `created_at` | timestamptz | Y | |

### 3.5 `delivery_events`（投递事件，幂等 + 对账）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | uuid | Y | PK |
| `message_id` | uuid | Y | FK |
| `sms_provider` | text | Y | |
| `provider_message_id` | text | Y | Twilio SID / Telnyx id |
| `event_status` | text | Y | Twilio: queued,sent,delivered,undelivered,failed；Telnyx 映射写入 |
| `error_code` | text | N | |
| `raw_payload` | jsonb | N | 原始 webhook 片段（注意 PII 与体积，可截断） |
| `received_at` | timestamptz | Y | |
| **唯一约束** | | | `UNIQUE(provider_message_id, event_status, received_at)` 或 `UNIQUE(provider_message_id, event_status)` 若 Twilio 不重复同状态 |

### 3.6 `outbound_templates`（可选）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | uuid | PK |
| `user_id` | text | 所有者 |
| `name` | text | 模板名 |
| `body_zh` | text | 可选 |
| `body_en` | text | 可选 |
| `tone_default` | text | |

### 3.7 `contact_language_preferences`（可选）

若长期独立联系人簿，可从 `conversations` 剥离；**Phase 1** 可 **仅用 `conversations.contact_language`**，本表作为未来 `contacts` 子表。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | uuid | |
| `contact_id` | uuid | FK contacts |
| `locale` | text | BCP-47 |
| `is_primary` | boolean | |

### 3.8 `contacts`（可选，未来）

当前产品 **无独立 contacts 表**；若引入：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | uuid | |
| `user_id` | text | 所有者 |
| `phone_e164` | text | unique per user |
| `display_name` | text | |
| `preferred_language` | text | 映射到会话创建时的 `contact_language` |

---

## 4) 后端接口设计（Edge / REST）

以下与现有风格一致：`{ data, error, message }`，Clerk JWT，`invokeEdgeWithClerkFromAuth`。

### 4.1 `createConversation`（已有 `create-conversation`）

- **Request**：`{ contact_phone, contact_name?, virtual_number_id?, outbound_channel? }`  
- **Validation**：E.164 规范化；Toll-Free 阶段 **`virtual_number_id` 可空**。  
- **Response**：`Conversation`  
- **Idempotency**：可选 `Idempotency-Key` header → 相同用户+电话+日内返回同会话（复杂，可 Phase 2）。

### 4.2 `sendMessage`（扩展 `send-message`）

- **Request**：  
  `{ conversation_id, content, media_urls?, media_kind?, idempotency_key?, translation_tone?, translated_override? }`  
  - `translated_override`：用户手动改英文后再发（跳过或覆盖自动翻译）。  
- **Response**：`Message`（含 `sms_provider`, `messaging_channel`, `status`, `external_message_id`）  
- **Validation**：配额、非空 SMS body、会话归属。  
- **Error**：`twilio_error`, `telnyx_error`, `routing_misconfigured`, `opt_out_blocked`  
- **Idempotency**：`idempotency_key` 已存在则返回同一 message。

### 4.3 `listMessages`（已有 `get-messages`）

- **Request**：`{ conversation_id, cursor? }`  
- **Response**：`Message[]` + `delivery_summary?`（可选聚合）  
- **Idempotency**：只读。

### 4.4 `inboundWebhookHandler`（新 `twilio-messaging-webhook`）

- **Method**：POST（`application/x-www-form-urlencoded`）  
- **Auth**：`X-Twilio-Signature` HMAC 校验（使用 `TWILIO_AUTH_TOKEN`）  
- **Response**：Twilio 期望 `200` + 可选 TwiML（SMS 不需要）  
- **Idempotency**：`MessageSid` + `From` + `To` + `Body` hash 去重表，或 `inbound_messages` staging unique。

### 4.5 `deliveryStatusWebhookHandler`

- 可与 inbound **同一 Edge**，路径区分 `/status` vs `/inbound`，或 Query `type=status`。  
- **Idempotency**：`MessageSid` + `MessageStatus` 重复更新安全（UPSERT delivery_events）。

### 4.6 `retryFailedMessage`

- **Request**：`{ message_id }`  
- **Auth**：仅会话所有者；状态为 `failed` / `undelivered`。  
- **行为**：生成 **新** `external_message_id`（禁止复用旧 SID），或 Twilio 重发 API（若支持场景）。  
- **Idempotency**：对同一 `message_id` 短窗内只允许一次 retry。

### 4.7 `translateDraftMessage`（新或扩展 `translate`）

- **Request**：`{ text, source_lang?, target_lang, tone? }`  
- **Response**：`{ translated_text, detected_source_lang? }`  
- **Idempotency**：只读；可缓存 hash（可选）。

### 4.8 `updateContactLanguagePreference`（已有 `update-conversation`）

- **Request**：`{ conversation_id, contact_language }`  
- **Response**：更新后的 `Conversation`  
- **Validation**：允许的语言列表。

---

## 5) Twilio 集成层设计

### 5.1 Messaging Service（必须）

- 创建 **Messaging Service**，绑定 **已验证的 Toll-Free Number**。  
- **所有出站**使用 `MessagingServiceSid`（`MG...`），避免应用层散落 `From`。  
- **未来 10DLC**：将 **长码 Sender Pool** 加入 **同一** Messaging Service 的 **Sender Pool**，通过 Twilio 控制台或 API 维护；路由层只改 `config`，少改代码。

### 5.2 Status Callback

- URL：`https://<project>.supabase.co/functions/v1/twilio-messaging-webhook?type=status`（示例）  
- 在 `Messages.create` 传入 `statusCallback`、`statusCallbackMethod=POST`。  
- 生命周期映射：

| Twilio | `messages.status` |
|--------|-------------------|
| queued | queued（若 enum 支持）或 sent |
| sent | sent |
| delivered | delivered |
| undelivered | failed 或 undelivered（建议扩展 enum 或 `delivery_events` 存细粒度） |
| failed | failed |

### 5.3 Inbound Webhook

- 指向同一 Edge 的 `type=inbound`；校验签名。  
- 保存 `MessageSid` 到 **入站** `messages` 行（`external_message_id`），`sms_provider=twilio`。

### 5.4 异常处理

- **Carrier filtering / invalid number**：`error_code` 写入 `delivery_events`，UI 展示可行动文案。  
- **Rate limit**：Twilio 429 → 退避重试队列（Phase 2：Supabase `pgmq` 或外部队列）。  
- **Opt-out**：Twilio STOP → 维护 `sms_opt_outs` 表（phone + toll_free_number + opted_at）；出站前拦截。

### 5.5 与 10DLC 长码池兼容

- **同一 Messaging Service** 同时挂 Toll-Free + 10DLC 号码时，Twilio 按 **规则** 选择 sender；业务层仍只认 `MessagingServiceSid`。  
- **Telnyx 路径**保持独立，直到产品决定 **是否** 将美国短信统一到 Twilio（策略决策，本方案不要求）。

---

## 6) 翻译模块集成

### 6.1 位置

- **Draft**：`translateDraftMessage`（用户输入时 debounce）。  
- **Send 前**：`send-message` 内若未提供 `translated_override` 则调用内部 `translate`（与现有一致）。  
- **Incoming**：`twilio-messaging-webhook` 入站后异步调用 `translate`（`source_lang=auto`, `target_lang=users.default_language`）。

### 6.2 Pipeline（message translation pipeline）

1. **detect**：`source_lang` = 客户端声明或 `auto`。  
2. **map target**：`conversations.contact_language`（对方看到的语言）；用户输入中文 → target `en` 或 `en-US`。  
3. **translate**：调用现有 OpenAI translate Edge。  
4. **tone rewrite**（可选第二步）：`tone` 注入 system：professional / friendly / firm / concise。  
5. **persist**：`original_content`、`translated_content`、`translation_tone`；若用户编辑 → `translation_edited=true`，`edited_translated_content` 为最终发出文本。

---

## 7) 权限与审计

| 能力 | 角色（建议） |
|------|----------------|
| 发消息 | 登录用户仅能向 **自己** `conversations` 发 |
| 看全部消息 | 仅 **本人**；未来 `org_admin` 可读组织内（表 `organization_members` 预留） |
| 审计表 `messaging_audit_logs` | `id`, `user_id`, `action`, `message_id`, `metadata jsonb`, `created_at` |

记录：**谁触发翻译**、**谁修改终稿**（`translation_edited` + `audit_logs`）。

---

## 8) UI/UX 升级建议

- **会话页 Composer**：中文输入区 + **「Will send in English」** 预览（`translateDraft`）。  
- **编辑译文**：「编辑英文」→ `translated_override`。  
- **Send**：带 loading；失败展示 **Twilio error_code** 简短说明 + **重试**。  
- **Timeline**：出站双语气泡（原文灰、译文主色）；入站同理。  
- **Badge**：头部保留 **对方语言**（现有）。  
- **Opt-out**：若号码在 `sms_opt_outs`，Composer 禁用并提示 **不可发直至合规处理**。

---

## 9) Phased Rollout（兼容 10DLC）

| Phase | 内容 |
|-------|------|
| **0** | **不动** Telnyx 购号、`send-message` Telnyx 分支、`voip-webhook`、10DLC 文档与 Dashboard 流程。 |
| **1** | 新增 Twilio 凭据、Messaging Service、Toll-Free Verification；部署 `twilio-messaging-webhook`；DB migration 加列/表。 |
| **2** | `MESSAGE_DEFAULT_CHANNEL=toll_free`，`send-message` **默认** `dispatchOutboundSms` → Twilio；Telnyx 代码路径 **保留**，由 `routing` 开关触发。 |
| **3** | 10DLC（Telnyx 或 Twilio 长码）就绪后，`ENABLE_10DLC_ROUTING=true`，`messaging_routing_policies` 指定新会话走 `10dlc_long_code`。 |
| **4** | 按 **地区 / 用途 / 成本** 调整 `fallback_chain`（例如 TF 备用）。 |
| **约束** | 任何 Phase **不得删除** 现有 Telnyx/10DLC 相关实体与服务类。 |

---

## 10) 环境变量与配置清单

| 变量 | 作用 |
|------|------|
| `TWILIO_ACCOUNT_SID` | Twilio 账户 |
| `TWILIO_AUTH_TOKEN` | REST + Webhook 签名校验 |
| `TWILIO_API_KEY_SID` / `TWILIO_API_KEY_SECRET` | （可选）子密钥，最小权限 |
| `TWILIO_MESSAGING_SERVICE_SID` | **出站必用** MG… |
| `TWILIO_TOLL_FREE_NUMBER` | 文档/对账用；发送仍走 Messaging Service |
| `TWILIO_STATUS_CALLBACK_URL` | Status 回调完整 URL（或函数内拼接） |
| `TWILIO_INBOUND_WEBHOOK_URL` | Inbound 完整 URL |
| `MESSAGE_DEFAULT_CHANNEL` | `toll_free` \| `10dlc_long_code` |
| `ENABLE_AUTO_TRANSLATION` | 入站是否自动翻译 |
| `DEFAULT_OUTBOUND_LANGUAGE` | 默认对方语言，如 `en` |
| `ENABLE_10DLC_ROUTING` | 功能开关，默认 `false` |
| **现有保留** | `TELNYX_*`、`CLERK_*`、`OPENAI_*`、`SUPABASE_*` 等 **全部保留** |

---

## 11) 风险控制

| 风险 | 缓解 |
|------|------|
| Toll-Free Verification 未通过 | **禁止**切主流量；保留 Telnyx 路由为 fallback（配置 `fallback_chain`） |
| 用户误以为自有独立号 | UI 文案：**「由 ContractorGo 统一号码发送」**；设置页说明 |
| 同 TF 多客户会话混淆 | **E.164 规范化** + **`user_id` 维度**：同一电话仅绑定 **一个** 活跃会话/用户；冲突时用 **最近 `last_message_at`** + **人工合并工具**（未来） |
| STOP/HELP | Twilio 合规；`sms_opt_outs` + 出站拦截 |
| 与 10DLC 并行 snowshoeing | **同一用户同一目的** 避免多通道狂发；速率限制、内容审计 |
| 高并发 | 队列 + 退避；Twilio 429 处理；webhook 快速 200 + 异步处理（可选） |

---

## 12) 交付物汇总

### 12.1 架构说明

见 §1–§2。

### 12.2 DB Schema

见 §3（迁移文件建议：`20260326xxxx_messaging_twilio_multichannel.sql`）。

### 12.3 API

见 §4。

### 12.4 Webhook 流程

- Inbound：验签 → 归会话 → 写 `messages` → 可选翻译 → 200。  
- Status：验签 → `delivery_events` → 更新 `messages.status` → 200。

### 12.5 发送时序（文本版）

```
User → App: 输入中文
App → translateDraft (optional): 预览英文
User → App: 发送
App → send-message: { conversation_id, content, tone, idempotency_key }
send-message → DB: INSERT message (queued)
send-message → translate (if needed)
send-message → Twilio Messages API (Messaging Service)
Twilio → twilio-messaging-webhook: status=sent
Webhook → DB: delivery_events + update message.status
Twilio → User phone: SMS delivered
User → Twilio: reply SMS
Twilio → twilio-messaging-webhook: inbound
Webhook → DB: INSERT inbound message + optional translate
App → get-messages: 轮询/实时拉取展示
```

### 12.6 UI 模块拆解

Composer、预览、编辑译文、Timeline、状态、Opt-out 提示、语言 Badge。

### 12.7 Phased rollout

见 §9。

### 12.8 风险与待确认

- Toll-Free **Verification** 周期与材料。  
- **是否** 未来美国短信统一 Twilio（与 Telnyx 虚拟号并存策略）。  
- `message_status` enum 是否新增 `queued` / `undelivered`（需 migration）。

### 12.9 Implementation checklist（工程）

- [ ] Migration：`messages.sms_provider`, `messages.messaging_channel`, `messages.translation_*`, `delivery_events`, `messaging_channels`, `sms_opt_outs`, `messaging_audit_logs`  
- [ ] `_shared/twilio-messaging.ts`：`sendSms`, `validateRequest`  
- [ ] Edge：`twilio-messaging-webhook`（inbound + status）  
- [ ] Refactor：`send-message` 内 `dispatchOutboundSms` + `resolveRouting()`  
- [ ] 配置：`TWILIO_*` Secrets + Twilio 控制台 Webhook  
- [ ] `translate`：支持 `tone` 参数  
- [ ] 移动端：`translateDraft`、编辑译文、`idempotency_key`、失败/重试 UI  
- [ ] E2E：发一条 TF 短信 → status 回调 → 回复 → 入站归属  
- [ ] 文档：更新 `API_ENV_CHECKLIST.md`、`TELNYX_SETUP.md` 旁增加 **Twilio Toll-Free** 小节（不删 Telnyx）  
- [ ] 开关：`MESSAGE_DEFAULT_CHANNEL`、`ENABLE_10DLC_ROUTING` 在 Supabase Secrets 与内部路由表一致  

---

**文档版本**：v1.0  
**维护**：与代码库 `send-message` / `voip-webhook` 变更同步更新。
