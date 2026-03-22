# Contractor GO — 全局 UI/UX 设计系统（深色 · 对齐「物业信息」）

## 设计理念

- **深色海军底**：应用主背景 `#0a0e17`，外围/更深 `#050a1b`。
- **主操作（青绿）**：`#00a3bf` — 主按钮、进度、品牌强调（与物业信息「浏览器打开」等一致）。
- **电蓝强调**：`#1e90ff` — 底部 Tab 选中、中间首页凸起按钮、部分链接/图标。
- **表面层级**：卡片/输入 `#1c2237`，略亮层 `#252d42`，分段选中 `#2d364d`，边框 `#2d364d`。
- **文字**：主色 `#ffffff`，次要 `#8e9aaf`，辅助 `#64748b`。

## 令牌位置

| 用途 | 说明 |
|------|------|
| [mobile/lib/theme.ts](../mobile/lib/theme.ts) | TS 内联色（StatusBar、TabBar、Web 容器等） |
| [mobile/tailwind.config.js](../mobile/tailwind.config.js) | `primary`（青绿）、`electric`（电蓝）、`surface`、`ink`、阴影 |
| [mobile/global.css](../mobile/global.css) | Web 端 `body` 外围与安全区 |

## 品牌

- **LogoMark**：[mobile/components/brand/LogoMark.tsx](../mobile/components/brand/LogoMark.tsx) — 青绿底白标（`onLight`）/ 白底青绿标（`onDark`）。

## Admin（Next.js）

管理后台为独立主题；若需与 App 完全一致，可在 `admin/app/globals.css` 中同步变量（另开任务）。
