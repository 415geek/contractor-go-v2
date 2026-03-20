# 部署检查清单

## HTTPS 证书

- **www.contractorgo.io**：由 Traefik + Let's Encrypt 提供，有效期至约 6 个月
- 检查命令：`echo | openssl s_client -connect www.contractorgo.io:443 -servername www.contractorgo.io 2>/dev/null | openssl x509 -noout -dates -subject`

## 空白页面排查

若 www.contractorgo.io 打开为空白：

1. **Clerk 域名配置**：在 [Clerk Dashboard](https://dashboard.clerk.com/) → Domains 添加 `www.contractorgo.io`
2. **生产密钥**：生产环境应使用 `pk_live_` 而非 `pk_test_`
3. **控制台错误**：按 F12 打开开发者工具，查看 Console 是否有报错
4. **ErrorBoundary**：若已部署，错误会显示在页面上

## HTTP → HTTPS

- VPS：由 Traefik 处理 80→443 重定向
- Vercel：根目录 `middleware.js` 会将 http 重定向到 https

## 部署后验证

```bash
# 本地运行健康检查
bash scripts/health-check.sh

# 或 SSH 到服务器后
cd /opt/contractor-go-v2 && bash scripts/health-check.sh
```
