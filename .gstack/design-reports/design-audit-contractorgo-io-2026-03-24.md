# Design Audit — contractorgo.io

**Date:** 2026-03-24  
**Target:** https://www.contractorgo.io  
**Classifier:** **HYBRID** — `/landing` 偏营销首屏；`/home`、`/tools/*` 为 **App UI**（工作台 + 底部 Tab）。  
**Method:** Cursor IDE Browser（移动端视口快照）；未使用 gstack `$B`（本机 browse 未构建）。  
**Branch:** `main`（工作区仅有未跟踪 `.gstack/`，无已改源码）。

---

## 双 headline 评分

| 指标 | 等级 | 一句话 |
|------|------|--------|
| **Design Score** | **B−** | 深色壳子统一、信息层级清楚；若干「卡片拼盘」与线上断链拉低信任感。 |
| **AI Slop Score** | **C+** |  landing 的装饰圆与渐变、工作台三色 KPI 条带接近模板感，但整体有品牌色与中文语境，未到「紫渐变三列功能」重灾区。 |

### 分项等级（加权前）

| 类别 | 等级 | 备注 |
|------|------|------|
| Visual Hierarchy | B | 工作台标题区 + Tab 锚点清晰；材料页说明文字偏长。 |
| Typography | B | 无系统默认堆栈明显问题；长说明段在窄屏上可读性一般。 |
| Spacing & Layout | B− | **材料比价** 底部 Tab 与输入区视觉重叠感（需确认 safe-area / padding）。 |
| Color & Contrast | B | 深色底 + 青绿强调一致；部分灰字/虚线框对比可再验 WCAG。 |
| Interaction States | B | Tab 激活态（工具高亮 + 首页凸起按钮）明确。 |
| Responsive | B− | 本次未跑 375/768/1440 三连截图；建议补跑。 |
| Content Quality | B | 文案具体（多角色比价说明）；`/privacy` 线上缺失损害「合规/信任」叙事。 |
| AI Slop | C+ | 三色统计卡、landing 装饰背景略像套件。 |
| Motion | — | 静态快照未评。 |
| Performance Feel | — | 未采 LCP/CLS。 |

---

## Phase 1 — First Impression

- **工作台 `/home`：** 传达「专业深色工具 + 承包商场景」。眼睛先落在 **「工作台」标题**、**三色项目概览卡**、**底部凸起的首页按钮**。一个词：**「套件感」** — 可用但略像行业模板的仪表盘。
- **Landing `/landing`：** 传达「效率、报价、转化」价值主张。眼睛先落在 **品牌行**、**大渐变卡片里的对勾**、**三条卖点**。一个词：**「可信推销」** — 比纯 AI landing 克制，仍有装饰性背景。
- **材料比价 `/tools/material-price`：** 传达「上传 + 描述 → 多角色分析」。眼睛先落在 **标题**、**长说明**、**上传框**。一个词：**「功能说明页」** — 信息前置略挤。

---

## Phase 2 — Inferred Design System（基于快照，非 DOM 精确统计）

- **Fonts：** 无衬线、中文 + 拉丁混排；层级靠字号/字重区分。
- **Colors：** 深底（近黑/海军）+ 青绿/蓝强调 + 紫/绿统计卡 — **冷暖并存**，靠区块分隔尚可，但 KPI 三色易联想「模板仪表盘」。
- **Components：** 大圆角卡片、底部五 Tab、中间「首页」圆形强调 — **接近 iOS/常见 Expo Tab 范式**（与产品目标一致）。
- **Offer：** 若需要，可从本次观察整理一版 `DESIGN.md`（色板 token、圆角阶梯、Tab 规范）。

---

## Findings（带证据与建议）

### FINDING-001 — `/privacy` 线上为「页面不存在」（高）

- **影响：** 高 — App Store 隐私 URL、用户信任、合规叙事直接受损。  
- **证据：** 访问 `https://www.contractorgo.io/privacy` 为极简 404 +「返回首页」。  
- **根因（推断）：** 生产静态包未包含该路由或部署滞后（非 rewrite 唯一问题）。  
- **建议：** `mobile` 执行 `npm run build:web` 后部署 Vercel；部署后回归 `/privacy`。  
- **Fix status：** **deferred**（部署侧，非本次样式 commit）。

### FINDING-002 — 材料比价页底部导航与表单区视觉挤压（中）

- **影响：** 中 — 占位符/输入区底部被 Tab 遮挡感，易误触或误以为不可滚动。  
- **建议：** 为可滚动主内容区增加 `paddingBottom` / `useSafeAreaInsets`，或与 Tab 高度对齐的 spacer；键盘弹出场景再验。  
- **Fix status：** deferred（需改 `mobile` 布局，未在本次执行 fix loop）。

### FINDING-003 — 工作台「项目概览」三色横条卡（中，AI Slop 相邻）

- **影响：** 中 — 视觉像通用 SaaS KPI 三格，削弱品牌独特性。  
- **建议：** 减色到 **一种强调 + 中性表面层级**；或用列表/紧凑 inline 统计替代三张大色块；数字为 0 时考虑空状态文案而非三块大零。  
- **Fix status：** deferred。

### FINDING-004 — Landing 主卡片内装饰圆与渐变（低–中）

- **影响：** 低–中 — 接近「装饰填空白」；当前有中文卖点，尚可接受。  
- **建议：** 若继续打磨：减弱背景几何、让 **一条主卖点 + 单一 CTA** 更占主导（Landing 规则：一屏一构图）。  
- **Fix status：** deferred。

### FINDING-005 — 设计回归与证据链（流程）

- **影响：** polish — 本次未保存浏览器截图文件到 `.gstack/design-reports/screenshots/`（MCP 仅描述图）。  
- **建议：** 构建 gstack browse 或导出 PNG，便于 PR 与前后对比。  
- **Fix status：** deferred。

---

## Litmus（简答）

| 检查 | /home | /landing |
|------|-------|----------|
| 首屏品牌/产品可识别 | 是 | 是 |
| 强视觉锚点 | Tab + 凸起首页 | 大卡片对勾 |
| 仅扫标题可理解 | 大致 | 是 |
| 每区块单一职责 | 概览/现场 尚可 | 卡片内略满 |
| 卡片是否必要 | 统计卡可质疑 | 主卡片必要 |
| 去装饰阴影仍显高级 | 部分依赖光晕 | 依赖背景纹理 |

---

## Quick Wins（各 < 30 min 量级）

1. **部署 Web** 使 `/privacy` 可访问（最高 ROI）。  
2. **材料比价页** 增加底部 safe area / 内容区 `paddingBottom`。  
3. **项目概览** 合并或降饱和两格颜色，保留一格强调。  
4. **补三张响应式截图**（375 / 768 / 1280）写入 `.gstack/design-reports/screenshots/`。

---

## Phase 8 / 9 说明

- **未执行** 源码 fix loop 与 atomic style commits（技能要求干净 tree；且 FINDING-001 为部署问题）。  
- 若你确认 **stash 或提交 `.gstack/`** 后需要自动改 UI，可再开一轮仅针对 FINDING-002/003。

---

## PR 摘要（一行）

> Design review（线上）：5 项发现，0 项代码层已修；Design B− → 待部署与 safe-area 修复后可回升；AI Slop C+；**阻塞级：/privacy 404**。

---

## 同步提醒（仓库规则）

- **Git：** 若保留报告：`git add .gstack/design-reports` → commit → push。  
- **Web：** `cd mobile && npm run build:web` → 部署 Vercel（修复 `/privacy`）。  
- **Edge：** 与本次设计审计无关；`search-material` 若未部署请单独执行。
