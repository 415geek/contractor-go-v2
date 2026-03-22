# Voip.ms API IP 白名单问题

## 错误现象

搜索号码时报错：`Error: This IP is not enabled for API use`

## 原因

Voip.ms API 要求调用方 IP 必须在账户白名单中。Supabase Edge Functions 运行在 Deno Deploy 上，**没有固定出站 IP**，因此无法预先加入 Voip.ms 白名单。

参考：[Supabase 官方说明](https://supabase.com/docs/guides/troubleshooting/why-supabase-edge-functions-cannot-provide-static-egress-ips-for-whitelisting)

## 解决方案

### 方案一：Voip.ms 允许所有 IP（推荐，若支持）

1. 登录 [Voip.ms 控制台](https://www.voip.ms/)
2. 进入 **Account** → **API** 或 **Security** 相关设置
3. 查找是否有「允许所有 IP」或「禁用 IP 限制」选项
4. 若支持，开启后即可从 Supabase Edge Functions 调用

### 方案二：自建中继（固定 IP，已接入代码）

1. 在 VPS 上部署中继（将 **该 VPS 公网 IP** 加入 Voip.ms API 白名单）：
   - 使用仓库内示例：`node scripts/voip-relay-server.mjs`（需 Node 18+）
   - 环境变量：`PORT`（默认 8787）、`RELAY_SECRET`（可选但强烈建议，随机长串）
   - 建议前面加 HTTPS 反向代理（Caddy / Nginx），对外例如 `https://api.example.com/voip`
2. 在 **Supabase Dashboard → Edge Functions → Secrets** 设置：
   - `VOIP_RELAY_URL` = 中继完整前缀，例如 `https://api.example.com/voip`（不要末尾 `/`，**不要**写成 `…com./voip` 或 `…io./voip`——多点会导致 Edge 上 DNS 失败）
   - **重要**：`VOIP_RELAY_URL` 里的主机名必须在**公网 DNS** 可解析（如 `dig api.example.com @8.8.8.8` 能查到 A/AAAA）。仅在本机 `hosts` 或内网 DNS 有记录时，Supabase Edge 会报 `dns error: Name or service not known`。
   - `VOIP_RELAY_SECRET` = 与 VPS 上 `RELAY_SECRET` 相同（若中继启用了校验）
3. 重新部署 Edge Functions。之后旧版 `voip-client` 会经中继访问 Voip.ms，Voip 看到的来源 IP 为你的 VPS。

> **说明**：当前仓库已默认使用 **Telnyx**（API Key 认证，一般**不需要**固定 IP 中继），见 `docs/TELNYX_SETUP.md`。

本地开发可在 `supabase/.env` 中配置同上变量（`supabase functions serve` 会读取）。

#### 报错：`Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

说明 Edge 收到的是 **HTML 页面**（不是 Voip 的 JSON）。常见原因：

| 原因 | 处理 |
|------|------|
| `VOIP_RELAY_URL` 写错域名/路径 | 与浏览器/ `curl` 能访问的中继地址一致；勿指到网站首页 |
| Nginx 把请求落到前端 SPA | `location` 要单独匹配中继路径并 `proxy_pass` 到 Node 端口 |
| 未带 `Authorization` 被返回登录页 | 中继开了 `RELAY_SECRET` 时，Supabase 必须配置相同的 `VOIP_RELAY_SECRET` |
| 502/404 错误页 | 确认 Node 在监听、`proxy_pass` 端口正确 |

Nginx 示例（`/voip` 与 `VOIP_RELAY_URL=https://你的域名/voip` 一致）：

```nginx
location /voip {
  proxy_pass http://127.0.0.1:8787;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header Authorization $http_authorization;
}
```

自测（把域名与密钥换成你的）：

```bash
curl -sS -H "Authorization: Bearer YOUR_RELAY_SECRET" \
  "https://你的域名/voip?api_username=test&api_password=test&method=getRateCentersUSA&state=CA" \
  | head -c 200
```

应看到 **`{` 开头的 JSON**；若仍是 `<!DOCTYPE`，说明还没打到中继。

### 方案三：联系 Voip.ms 支持

询问 Voip.ms 是否支持：
- 为 API 账户关闭 IP 限制
- 或提供可加入白名单的 IP 段（若 Supabase/Deno Deploy 有公开 IP 段）
