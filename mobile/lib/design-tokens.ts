/**
 * Contractor GO v2 — Design System Tokens
 * 设计系统令牌 — 包工头的数字化身份象征
 *
 * 设计原则:
 * 1. 单手拇指操作 (Thumb Zone First) — 高频操作在屏幕下半部分
 * 2. 3秒原则 — 任何核心任务 ≤ 3步完成
 * 3. 工地友好 — 高对比度、大字体、防误触
 * 4. 情感共鸣 — 专业但温暖，让用户感到被尊重
 * 5. 渐进式复杂度 — 核心功能一目了然
 */

export const colors = {
  // 主色：建筑蓝 — 代表专业、可靠、天空
  primary: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#2563EB",
    600: "#1D4ED8",
    700: "#1E40AF",
    800: "#1E3A8A",
    900: "#172554",
  },
  // 辅助色：工地橙 — 代表能量、安全、活力
  accent: {
    50: "#FFF7ED",
    100: "#FFEDD5",
    200: "#FED7AA",
    300: "#FDBA74",
    400: "#FB923C",
    500: "#F97316",
    600: "#EA580C",
    700: "#C2410C",
  },
  // 成功色：完工绿
  success: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    200: "#BBF7D0",
    500: "#22C55E",
    600: "#16A34A",
    700: "#15803D",
  },
  // 警告色：注意黄
  warning: {
    50: "#FEFCE8",
    100: "#FEF9C3",
    200: "#FEF08A",
    500: "#EAB308",
    600: "#CA8A04",
  },
  // 错误色：警示红
  error: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    500: "#EF4444",
    600: "#DC2626",
  },
  // 深色表面层级 (工地强光下更易读)
  surface: {
    app: "#0F172A",      // 最底层背景
    card: "#1E293B",     // 卡片背景
    elevated: "#334155", // 抬升元素
    border: "#475569",   // 边框
    borderMuted: "#334155", // 弱化边框
  },
  // 中性色：工业灰
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
    950: "#030712",
  },
  // 文字层级
  text: {
    primary: "#F8FAFC",
    secondary: "#94A3B8",
    tertiary: "#64748B",
    inverse: "#0F172A",
  },
} as const;

export const spacing = {
  0: 0,
  1: 4,    // xs
  2: 8,    // sm
  3: 12,
  4: 16,   // md
  5: 20,
  6: 24,   // lg
  7: 28,
  8: 32,   // xl
  9: 36,
  10: 40,
  11: 44,  // min touch target
  12: 48,  // xxl
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const typography = {
  fontFamily: {
    sans: 'Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    mono: '"SF Mono", "JetBrains Mono", monospace',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,  // 最小可读字号
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 48,
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
  lineHeight: {
    tight: 1.25,    // 标题
    normal: 1.5,    // 正文
    relaxed: 1.75,  // 长文本
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
} as const;

export const borderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(0,0,0,0.05)",
  md: "0 4px 6px rgba(0,0,0,0.07)",
  lg: "0 10px 15px rgba(0,0,0,0.1)",
  xl: "0 20px 25px rgba(0,0,0,0.15)",
} as const;

export const animation = {
  duration: {
    instant: 50,
    fast: 100,     // 微交互: 按钮反馈
    normal: 200,
    slow: 300,     // 转场: 页面切换
    slower: 400,
    slowest: 600,  // 复杂动画: 成功庆祝
  },
  easing: {
    bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",  // 弹性
    smooth: "cubic-bezier(0.4, 0, 0.2, 1)",        // 流畅
    decel: "cubic-bezier(0, 0, 0.2, 1)",            // 减速
    accel: "cubic-bezier(0.4, 0, 1, 1)",            // 加速
  },
} as const;

// 触控规范 (WCAG / Apple HIG / Material Design)
export const touchTarget = {
  min: 44,      // 最小触控区域 44pt
  comfort: 48,  // 舒适触控区域 48pt
  large: 56,    // 大按钮 56pt
} as const;

// 布局规范
export const layout = {
  screenPaddingH: 16,
  screenPaddingV: 16,
  cardPadding: 16,
  sectionGap: 24,
  itemGap: 12,
} as const;

// 语义化别名 (快捷方式)
export const semantic = {
  // 状态颜色
  statusColors: {
    active: { bg: colors.success[100], text: colors.success[600], dot: colors.success[500] },
    planning: { bg: colors.primary[100], text: colors.primary[700], dot: colors.primary[500] },
    on_hold: { bg: colors.warning[100], text: colors.warning[600], dot: colors.warning[500] },
    completed: { bg: "#F1F5F9", text: "#64748B", dot: "#94A3B8" },
    cancelled: { bg: "#F1F5F9", text: "#64748B", dot: "#94A3B8" },
  },
  // 暗色模式状态颜色
  statusColorsDark: {
    active: { bg: "#052e16", text: colors.success[500], dot: colors.success[500] },
    planning: { bg: "#1e3a8a", text: colors.primary[300], dot: colors.primary[400] },
    on_hold: { bg: "#422006", text: colors.warning[500], dot: colors.warning[500] },
    completed: { bg: colors.surface.elevated, text: colors.text.secondary, dot: "#64748B" },
    cancelled: { bg: colors.surface.elevated, text: colors.text.secondary, dot: "#64748B" },
  },
} as const;

// 旧版 theme 兼容导出 (向后兼容)
export const theme = {
  colors: {
    primary: colors.primary,
    surface: colors.surface,
    text: colors.text,
    success: colors.success[500],
    error: colors.error[500],
    warning: colors.warning[500],
  },
  spacing,
  radius: borderRadius,
  typography: {
    hero: "text-3xl font-bold tracking-tight",
    title: "text-xl font-semibold",
    body: "text-base",
    caption: "text-sm",
    label: "text-sm font-medium",
  },
  minTouchTarget: touchTarget.min,
} as const;

export default {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  animation,
  touchTarget,
  layout,
  semantic,
};
