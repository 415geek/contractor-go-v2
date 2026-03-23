# Telnyx 与 Contractor GO（SaaS 代用户购号）架构说明

本文档说明 **Telnyx 官方能力**与**本项目当前模式**（单一/少量 API Key + Supabase Edge 代下单）如何匹配，并给出**分阶段最优方案**与落地要点。

## 1. 先厘清两个概念

| 说法 | 在 Telnyx 里实际指什么 |
|------|------------------------|
| **「普通 API 集成」** | 使用 **一个 Telnyx 账号**下的 **V2 API Key**，调用 `available_phone_numbers`、`number_orders`、`messages` 等 REST API。这是 [开发者文档](https://developers.telnyx.com/docs/overview) 的默认路径。 |
| **「Reseller / 多租户 / 子账号」** | Telnyx 侧对应能力主要是 **Managed Accounts（托管子账号）**：由 **Manager 账号**通过 API 创建子账号，每个子账号有**独立 `api_key`、余额、发票**等。需 **Telnyx 明确批准** 才能成为 Manager。参考 [Create a managed account](https://developers.telnyx.com/api-reference/managed-accounts/create-a-new-managed-account)。 |

**结论**：没有第三种「神秘 Reseller API」——要么是 **单账号 API**，要么是 **Manager + Managed Accounts** 的多层级模型。

## 2. Contractor GO 属于哪种业务模式？

当前实现是典型 **「你方作为 Telnyx 客户，在应用内为终端用户代购号码」**：

- **计费关系**：Telnyx → **你们公司**；你们再通过 **订阅/用量**向终端用户收费（如 Stripe）。
- **数据归属**：号码在 Telnyx 控制台都挂在**你们账号**下；应用内用 **`virtual_numbers` + `user_id`** 区分归属。
- **这与「每个客户都是 Telnyx 独立付费方」不同**——后者才更需要 Managed Accounts 或客户自带 Key。

因此：**最优默认方案不是一上来就做 Managed Accounts**，而是先把 **单账号生产化**做对；仅在商业/合规需要时再上子账号。

## 3. 三种架构对比（按复杂度递增）

### 方案 A：单生产账号 + 单（或按环境拆分）API Key（**当前推荐基线**）

**做法**

- 生产环境 **独立** `TELNYX_API_KEY`，与开发/测试 **绝不共用**。
- 在 Telnyx Portal **升级套餐 / 提升号码订单额度**，避免试用账号的 `Only 1 order is allowed at your account level` 类限制。
- 应用层用 **`virtual_numbers` + 产品规则**（如每用户 1 号）约束；与 Telnyx **账号级**限制区分开（见 `TELNYX_SETUP.md` §6）。

**优点**：实现与运维最简单，与现有 Edge 函数一致。  
**缺点**：所有号码在同一 Telnyx 账号下；若 Key 泄露影响面大（需 Secret 管理与轮换）。

**适用**：MVP、中小规模、终端用户不直接向 Telnyx 付款。

---

### 方案 B：Managed Accounts（**「类 Reseller」正式能力**）

**做法**

- 向 Telnyx 申请成为 **Manager**，获批后使用 `POST /v2/managed_accounts` 等 API 创建子账号。
- 子账号创建响应中含 **`api_key`**，可对**该子账号**单独执行购号、发短信等（与单账号 API 相同，只是 Key 不同）。
- 可选 **`rollup_billing`**：子账号费用是否滚到 Manager 共享余额（**创建后变更需 Telnyx 支持介入**，见官方 OpenAPI 说明）。

**优点**

- **强隔离**：每客户/每组织独立余额、发票、Portal 可见性（视配置而定）。
- 适合 **MSP、大客户代管、或法律上要求「号码与话费归属客户主体」** 的场景。

**缺点**

- 需 **商务审批** + 工程改造：存 **`managed_account_id` / 子账号 API Key**（需安全存储与轮换）、Webhook 路由、失败重试与对账。
- 对「仅 C 端小承包商」产品，**往往过重**。

**适用**：企业客户、多组织 B2B、或你们要成为 **通信能力分销商** 且 Telnyx 已批准 Manager。

---

### 方案 C：BYOK（客户自带 Telnyx API Key）

**做法**：终端用户或企业在你们控制台粘贴自己的 Telnyx Key，请求走客户账号。

**优点**：话费与合规完全在客户侧。  
**缺点**：支持成本高、安全与 UX 差，一般仅 **Enterprise** 定制。

---

## 4. 针对本项目的「最优」建议（分阶段）

### 阶段 1（当前最优，优先做完）

1. **生产专用 Telnyx 账号/Key**，与测试环境物理隔离；禁止多人共用一把生产 Key 做本地调试。  
2. **在 Telnyx 侧解决账号级订购/试用限制**（升级、释放未完成订单等），避免与 App 内「每用户 1 号」混为一谈。  
3. 继续以 **`virtual_numbers` 为归属真相**，Telnyx 仅作号码与消息管道。

### 阶段 2（出现以下任一信号时再评估 Managed Accounts）

- 大客户要求 **发票与号码必须在其自己主体/余额**下。  
- 你们需要 **按组织** 在 Telnyx 侧做 **独立对账**，而不是只在自己数据库里分摊成本。  
- Telnyx 已批准 **Manager**，且产研愿意投入 **子账号生命周期 + Key 管理 + Webhook 多路**。

### 阶段 3

- 若仅个别超大客户需要，可 **单客户走 Managed Account 或 BYOK**，不必全量用户迁移。

## 5. 研发落地清单（方案 A → 方案 B 时需增量）

| 项目 | 方案 A | 方案 B |
|------|--------|--------|
| Secret | `TELNYX_API_KEY`（按环境） | Manager Key + 每子账号 Key 的存储（Vault/加密列） |
| DB | `virtual_numbers` | 增加 `telnyx_managed_account_id` 或子账号标识 |
| Edge | 统一用一把 Key 调 Telnyx | 按租户选 Key 或代理到子账号 |
| Webhook | 单 URL | 需区分来源账号或统一入口后按号码路由 |
| 合规与对账 | 你们统一向 Telnyx 付款 | 可按子账号或 rollup 设计 |

## 6. 官方参考（必读顺序）

1. [Telnyx API Overview](https://developers.telnyx.com/docs/overview)  
2. [Create a managed account](https://developers.telnyx.com/api-reference/managed-accounts/create-a-new-managed-account)（**需 Manager 审批**）  
3. 号码与消息：`number_orders`、`messages`、Webhook（与现有 `TELNYX_SETUP.md` 一致）

---

**一句话**：你们当前模式下的 **最优解** 是 **先把「单账号 + 生产级额度 + 环境隔离 Key」做到位**；**Managed Accounts** 是 Telnyx 对 **Reseller/MSP/强租户隔离** 的官方路径，在 **有明确商业与合规需求且获批 Manager** 后再上，避免过早增加系统复杂度。
