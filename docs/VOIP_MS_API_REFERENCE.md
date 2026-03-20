# Voip.ms API 参考文档

> 基于 `API.zip` 官方文档（WSDL / REST 示例）整理；线上说明页 `https://voip.ms/m/apidocs.php` 可能被 Cloudflare 拦截自动化访问，以账户内 **API / Developers** 文档为准。

---

## 1. 基础信息

| 项目 | 值 |
|------|-----|
| **REST Base URL** | `https://voip.ms/api/v1/rest.php` |
| **SOAP Endpoint** | `https://voip.ms/api/v1/server.php` |
| **认证方式** | URL 参数 `api_username`、`api_password` |
| **响应格式** | JSON |

### REST 调用示例

```
GET https://voip.ms/api/v1/rest.php?api_username=xxx&api_password=xxx&method=getLanguages
```

---

## 2. Phase 2 相关 API

### 2.1 获取美国可用号码 `getDIDsUSA`

**官方参数**（来自 WSDL / class.voipms.php）：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| state | string | ✓ | 州代码，如 `CA`、`FL` |
| ratecenter | string | ✓ | 费率中心，需先通过 `getRateCentersUSA` 获取 |

**REST 调用**：
```
GET .../rest.php?api_username=xxx&api_password=xxx&method=getDIDsUSA&state=CA&ratecenter=SANFRANCISCO
```

**返回**：可用号码列表，含 `did`、`monthly`、`setup`、`province`、`ratecenter` 等字段。

> ⚠️ **注意**：官方 API 使用 `state` + `ratecenter`，**不是** `npa`（区号）。若需按区号（如 415）搜索，需先建立「区号 → 州 → 费率中心」映射，或先调用 `getRateCentersUSA(state)` 获取该州下的 ratecenter 列表。

---

### 2.2 获取美国费率中心 `getRateCentersUSA`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| state | string | ✓ | 州代码，如 `CA` |

**用途**：获取某州下的 ratecenter 列表，供 `getDIDsUSA` 使用。

---

### 2.3 购买号码 `orderDID`

**参数**（来自 WSDL orderDIDInput）：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| did | string | ✓ | 要购买的号码 |
| routing | string | ✓ | 路由，如 `account:main` |
| failover_busy | string | | 忙时转移 |
| failover_unreachable | string | | 不可达转移 |
| failover_noanswer | string | | 无应答转移 |
| voicemail | string | | 语音信箱 |
| pop | integer | | POP 节点 |
| dialtime | integer | | 拨号时长 |
| cnam | integer | | CNAM 显示 |
| callerid_prefix | string | | 主叫前缀 |
| note | string | | 备注 |
| billing_type | integer | ✓ | 计费类型，`1`=月付 |
| account | string | | 子账户 |
| monthly | string | | 月费（从 getDIDsUSA 返回获取） |
| setup | string | | 开通费 |
| minute | string | | 每分钟费率 |
| test | boolean | | 测试模式 |

**最小调用示例**：
```
method=orderDID&did=14155551234&routing=account:main&billing_type=1&account=main
```

> ⚠️ **`did` 格式**：必须为 **纯数字**（通常 11 位美国号码 `1` + 10 位），**不要**包含 `+` 或空格。使用 `+14155551234` 可能导致订购失败。  
> 建议在调用 `orderDID` 时传入 `monthly`、`setup`（与 `getDIDsUSA` 返回字段一致），与控制台下单行为对齐。

---

### 2.4 发送短信 `sendSMS`

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| did | string | ✓ | 发送方虚拟号码 |
| dst | string | ✓ | 接收方手机号 |
| message | string | ✓ | 短信内容 |

**REST 调用**：
```
POST/GET .../rest.php?api_username=xxx&api_password=xxx&method=sendSMS&did=14155551234&dst=14155559999&message=Hello
```

---

## 3. 区号 (NPA) 与 state/ratecenter 的对应关系

官方 API 没有直接的 `npa` 参数。常见做法：

1. **方案 A**：维护「区号 → 州」映射表（如 415→CA, 212→NY）
2. **方案 B**：用户先选州，再选 ratecenter，再搜索号码
3. **方案 C**：若 Voip.ms 有非公开的 npa 参数，需联系其支持确认

**建议**：Phase 2 可先实现「州 + ratecenter」流程；若需「按区号搜索」，再增加区号→州映射或调用 `getRateCentersUSA` 遍历。

---

## 4. 响应格式

### 成功示例

```json
{
  "status": "success",
  "dids": [
    {
      "did": "14155551234",
      "monthly": "1.00",
      "setup": "0.00",
      "province": "CA",
      "ratecenter": "SANFRANCISCO"
    }
  ]
}
```

部分环境下 `dids` / `ratecenters` 可能以 **JSON 对象**（键为 `"0"`,`"1"`…）而非数组返回，集成时需 `Object.values()` 归一化为数组后再展示。

### 错误示例

```json
{
  "status": "invalid_username",
  "message": "Invalid API credentials"
}
```

---

## 5. 环境变量

| 变量名 | 说明 |
|--------|------|
| VOIPMS_USERNAME | Voip.ms 账号邮箱 |
| VOIPMS_PASSWORD | Voip.ms API 密码 |

---

## 6. 参考文件（来自 API.zip）

- `API/server.wsdl` - 完整 WSDL 定义
- `API/Examples REST for PHP/` - REST 调用示例
- `API/Examples SOAP for PHP5/class.voipms.php` - PHP 封装类（含所有方法签名）
