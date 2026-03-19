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

### 方案二：自建代理

在 VPS（如 AWS EC2、DigitalOcean）上部署简单 HTTP 代理，将 VPS 公网 IP 加入 Voip.ms 白名单，Edge Function 通过该代理调用 Voip.ms。

### 方案三：联系 Voip.ms 支持

询问 Voip.ms 是否支持：
- 为 API 账户关闭 IP 限制
- 或提供可加入白名单的 IP 段（若 Supabase/Deno Deploy 有公开 IP 段）
