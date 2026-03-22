# Contractor GO — 全局 UI/UX 设计系统（浅色优先）

## 设计理念

- **最低学习成本**：对齐 iOS / Uber / DoorDash 等常见消费级应用的布局与控件习惯。
- **高可读**：主文字 `#1C1C1E`（ink），次要 `#636366`，辅助 `#8E8E93`。
- **主操作单色**：`#007AFF`（系统蓝），一眼识别可点击与进度。
- **表面层级**：应用底 `#F5F5F7`，卡片 `#FFFFFF`，细边框 `#E5E5EA`，轻阴影（见 `tailwind.config.js`）。

## 令牌位置

| 用途 | 说明 |
|------|------|
| [mobile/lib/theme.ts](../mobile/lib/theme.ts) | TS 内联色（StatusBar、ErrorBoundary、Web 容器等） |
| [mobile/tailwind.config.js](../mobile/tailwind.config.js) | `primary`、`surface`、`ink`、阴影 |
| [mobile/global.css](../mobile/global.css) | Web 端 `body` 背景与安全区 |

## 品牌

- **LogoMark**：[mobile/components/brand/LogoMark.tsx](../mobile/components/brand/LogoMark.tsx) — 圆角方 + 对勾，蓝底白标（浅色页）/ 白底蓝标（彩色 Hero）。

## Admin（Next.js）

管理后台仍为独立主题；若需与 App 完全一致，可在 `admin/app/globals.css` 中同步浅色变量（另开任务）。
