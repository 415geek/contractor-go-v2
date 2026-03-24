# QA Report — www.contractorgo.io

| Field | Value |
|-------|--------|
| Date | 2026-03-24 |
| Branch | `main` (working tree clean) |
| Target | `https://www.contractorgo.io` |
| Mode | Quick / smoke (gstack `browse` binary **NEEDS_SETUP** — used Cursor IDE browser MCP) |
| Pages visited | `/` → `/home`, `/tools`, `/tools/material-price`, `/privacy` |

## Summary

- **首页 / 工作台**：可加载，底栏 Tab（信息、项目、首页、工具、我的）可见。
- **材料比价** `/tools/material-price`：页面正常；含说明文案、上传区、描述输入、返回按钮。
- **隐私政策** `/privacy`：**失败** — 显示应用内「页面不存在」与「返回首页」，**不满足 App Store 隐私政策 URL 要求**（直至重新部署包含该路由的 Web 构建）。

## Console

- 仅见 Cursor 浏览器注入的 `Native dialog overrides` 警告，**无应用明显 JS error**。

## Issues

### ISSUE-001 — `/privacy` 线上为 404（高）

- **Severity:** High（阻塞 App Store 隐私链接、合规）
- **Repro:** 浏览器打开 `https://www.contractorgo.io/privacy`
- **Expected:** 显示隐私政策正文
- **Actual:** 「页面不存在」+「返回首页」
- **Likely cause:** 线上 Vercel 仍为**旧静态包**（未包含 `app/privacy.tsx` 路由），非 `vercel.json` rewrite 问题（根目录已有 `/(.*) → /index.html`）。
- **Fix:** 在 `mobile` 执行 `npm run build:web`，将 `dist` 部署到绑定 `www.contractorgo.io` 的项目并 Redeploy；部署后复查 `/privacy`。

## Health score (rough)

- **Functional:** ~70（核心 Tab + 材料比价可用；隐私页阻断合规项）
- **Overall estimate:** ~72

## Top 3

1. **立即重新部署 Web**，使 `/privacy` 可访问。  
2. 部署后在真机与桌面浏览器各验证一次 `/privacy`。  
3. （可选）本地安装 gstack `browse` 后重跑完整 `/qa` 以生成截图证据链。

## PR 一句话

> QA：生产站 `/privacy` 仍 404，需用含隐私页的最新 `build:web` 重新部署；`/home` 与 `/tools/material-price` 正常。

---

**STATUS:** DONE_WITH_CONCERNS
