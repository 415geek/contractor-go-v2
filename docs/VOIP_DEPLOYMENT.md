# Voip.ms 集成（已弃用）

> **当前生产虚拟号码已迁移至 Telnyx**，请改用 **`docs/TELNYX_SETUP.md`**。下文仅作历史参考。

依据 [Voip.ms REST API](https://voip.ms/resources/api)（账户内 **Main Menu → SOAP and REST/JSON API** 与 `docs/VOIP_MS_API_REFERENCE.md`）与本仓库实现整理。

---

## 1. 账户侧（必做）

| 项 | 说明 |
|----|------|
| 启用 API | 控制台启用 REST/SOAP API，设置 **API Password**（与登录密码不同） |
| IP 白名单 | Supabase Edge **无固定出站 IP**，需 **允许所有 IP** 或使用 **固定 IP 中继**（见 `docs/VOIP_IP_WHITELIST.md`） |
| 凭据 | `VOIPMS_USERNAME` = 登录邮箱；`VOIPMS_PASSWORD` = **API 密码** |

---

## 2. Supabase Secrets（生产）

在 **Project Settings → Edge Functions → Secrets** 配置：

| Secret | 必填 | 说明 |
|--------|------|------|
| `VOIPMS_USERNAME` | ✓ | Voip.ms 账户邮箱 |
| `VOIPMS_PASSWORD` | ✓ | API 密码 |
| `VOIP_RELAY_URL` | 可选 | 固定 IP 中继前缀，如 `https://api.example.com/voip`（无尾 `/`） |
| `VOIP_RELAY_SECRET` | 可选 | 与中继 `RELAY_SECRET` 一致，建议生产开启 |
| `VOIP_HTTP_TIMEOUT_MS` | 可选 | 调用 Voip 的 HTTP 超时（默认 `120000`） |

本地：`supabase/.env` 同上变量，`supabase functions serve` 会加载。

---

## 3. 部署 Edge Functions

修改 Voip 相关代码后，需重新部署对应函数，例如：

```bash
cd supabase
supabase functions deploy voip-available-numbers voip-rate-centers voip-purchase-number voip-my-numbers --project-ref <你的-project-ref>
```

或使用 Dashboard：**Edge Functions → 选择函数 → Deploy**（若已连接 Git 与 CI 则按流水线）。

---

## 4. 性能说明（搜索/购号）

- **官方 API** 无公开「并发上限」文档；本仓库对 `getDIDsUSA` 采用 **分批并行**（如 `rcParallel: 6`），避免对 Voip 端造成过大并发。
- **湾区列表 `bay_area=1`**：历史上曾对 **每个 NPA 重复调用 `getRateCentersUSA(CA)`**，导致请求量成倍放大。当前实现为 **单次 `getRateCentersUSA(CA)`**，再按 `getDIDsUSA(state, ratecenter)` 分批拉取，并对照 `mobile/lib/bay-area-voip.ts` 中的 NPA 列表过滤，显著降低延迟与失败率。
- **购号 `orderDID`** 为单次 API 调用，耗时主要取决于 Voip.ms 侧；函数日志会打印 `orderDID ok in XXXms` 便于排查。

---

## 5. 验证

```bash
# 需已 supabase login 且链接项目
supabase secrets list --project-ref <ref>

# 本地带 env 试跑（示例）
supabase functions serve voip-available-numbers --env-file ./supabase/.env
# 另开终端：
curl -sS "<SUPABASE_URL>/functions/v1/voip-available-numbers?bay_area=1" \
  -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>" | head -c 400
```

应返回 JSON，`status` 成功且 `data` 为数组。

---

## 6. 相关文件

| 文件 | 作用 |
|------|------|
| `supabase/functions/_shared/telnyx-client.ts` | Telnyx REST v2 |
| `supabase/functions/voip-available-numbers/index.ts` | 库存搜索（含湾区聚合） |
| `supabase/functions/voip-purchase-number/index.ts` | `orderDID` + 写库 |
| `scripts/voip-relay-server.mjs` | 固定 IP 透明中继 |
