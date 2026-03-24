# QA Report — contractorgo.io

**Date:** 2026-03-24  
**Target:** https://www.contractorgo.io  
**Tier:** Standard（记录 critical/high/medium；修复 medium+ 的可代码化项）  
**Browser:** Cursor IDE Browser（非 gstack `$B`）  
**Branch:** `main`（QA 开始时工作区干净）

---

## 摘要

| 指标 | 值 |
|------|-----|
| **Health Score（修复前，粗算）** | **~82** |
| **Health Score（代码修复后预期）** | **~90**（需重新部署 Web 后在生产控制台确认） |
| **访问页面** | `/landing`, `/home`, `/privacy`, `/tools`, `/tools/material-price` |
| **修复** | ISSUE-001 verified（源码）；ISSUE-002 verified（源码）；部署后需回归 |

### Top 3

1. **控制台：** Web 上 `Animated useNativeDriver` 报错（landing 首屏必现）→ 已在源码关闭 Web 的 native driver。  
2. **布局：** 材料比价页描述区与底部 Tab（含凸起首页）视觉重叠 → 已为 Web 增加额外 `paddingBottom`。  
3. **合规：** `/privacy` **线上已可访问**（完整隐私政策正文），与此前 404 报告对比为 **已恢复/已部署**。

---

## 控制台健康

| 来源 | 说明 |
|------|------|
| `[CursorBrowser] Native dialog overrides…` | 自动化环境注入，**不计入产品分** |
| `Animated: useNativeDriver is not supported…` | **ISSUE-001**，来自 RN Web；已修复于 `mobile/app/landing.tsx` 等 |

---

## ISSUE 清单

### ISSUE-001 — Web 控制台 Animated `useNativeDriver` 错误（medium）

- **页面：** `/landing`（登录前动效）  
- **现象：** 控制台 `error`，提示 native animated module missing，回退 JS。  
- **根因：** `useNativeDriver: true` 在 **web** 不适用。  
- **修复：** 新增 `mobile/lib/animated-native-driver.ts`，在 `landing`、`TouchableScale`、`login`、`verify` 使用 `animatedUseNativeDriver`（仅 iOS/Android 为 true）。  
- **Commit:** `d46d775`  
- **状态：** **verified**（源码）；生产需 `build:web` 部署后再抓控制台确认。

### ISSUE-002 — 工具子页底部内容与 Tab 栏重叠（medium）

- **页面：** `/tools/material-price`（快照中描述框底部贴 Tab）  
- **修复：** `useToolScrollBottomPadding` 在 **web** 上增加 `webFabSlop`（28px），对应中间凸起首页按钮上沿。  
- **Commit:** `3c81dfe`  
- **状态：** **verified**（源码）；部署后建议再截图回归。

### ISSUE-003 — 工作台底部导航区「透字」观感（low，待确认）

- **页面：** `/home`  
- **现象（来自快照描述）：** Tab 后方似可见「我的项目」「全部」等字样，可能为滚动内容 + 固定 Tab 的层叠视觉，**需真实 PNG 复核**。  
- **状态：** **deferred**（未改代码）。

### ~~ISSUE-004~~ — `/privacy` 404（此前 high）

- **当前：** 线上 `/privacy` **正常**，展示《隐私政策》全文与公开 URL。  
- **状态：** **resolved**（生产侧已更新，非本次 commit）。

---

## 分类得分（修复前粗算）

| 类别 | 分 | 说明 |
|------|-----|------|
| Console | 70 | 2× RN Animated error |
| Links | 100 | 主要路由可达 |
| Visual | 88 | Tab 与表单间距偏紧 |
| Functional | 90 | 未测登录后深度流程 |
| UX | 85 | 同上 |
| Performance | — | 未测 LCP |
| Content | 95 | 隐私页可访问 |
| A11y | — | 未系统测 |

---

## PR 一行摘要

> QA：修复 Web Animated 控制台错误与工具页底部安全留白；隐私页线上已可用；部署 Web 后请回归控制台与材料比价截图。

---

## 部署

```bash
cd mobile && npm run build:web
```

将产物部署到 Vercel（或项目既定流程）。  

`git push` 在本地 commit 后执行。
