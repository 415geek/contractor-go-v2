# 工具模块导航（Tab + 嵌套 Stack）

## 问题背景

- Web 上曾使用 `window.location.assign` 做整页跳转，导致 **Expo Router 栈被清空**：返回无效、**底部 Tab 消失**。
- 工具子页若在根 Stack 的独立路由（如旧 `/workbench/*` 与根级 `/tools/*`）下打开，也会 **盖住整个 `(tabs)`**，Tab 栏不可见。

## 当前结构

- **工具中心与子工具**位于 `app/(tabs)/tools/`：
  - `_layout.tsx`：嵌套 `Stack`（`index`、`material-price`、`house-estimate`、`permit`（物业信息：内嵌 SF PIM 地图 + 许可摘要））。
  - 用户从「工具」Tab 进入子页时，**仍在 Tab 导航树内**，底部栏保持显示。
- **`lib/web-navigation.ts`**：`pushPath` / `replacePath` **统一使用 `router.push` / `router.replace`**（含 Web），保持 SPA 行为。
- **兼容旧链接**：`app/workbench/*` 仅 `Redirect` 到 `/tools/*`。

## UX 约定

- 子页顶栏使用 `ToolScreenChrome`：`ToolScreenHeader`（安全区 + 可点区域更大的返回）、`useToolScrollBottomPadding`（为 Tab 栏与 Home Indicator 预留底部留白）。
- **虚拟号码** `/voip` 仍为根 Stack 全屏流程，不强制显示 Tab（重流程独立界面）。
