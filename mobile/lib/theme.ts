/**
 * Contractor GO — 设计令牌 (Award-level UI/UX)
 * 原则: 清晰层级、单一主操作、信任感、无障碍、移动优先
 */
export const theme = {
  colors: {
    // 品牌主色 — 高对比、可访问
    primary: {
      50: "#EFF6FF",
      100: "#DBEAFE",
      200: "#BFDBFE",
      300: "#93C5FD",
      400: "#60A5FA",
      500: "#3B82F6",
      600: "#2563EB",
      700: "#1D4ED8",
    },
    // 表面层级
    surface: {
      app: "#0F172A",
      card: "#1E293B",
      elevated: "#334155",
      border: "#475569",
      borderMuted: "#334155",
    },
    // 文字层级
    text: {
      primary: "#F8FAFC",
      secondary: "#94A3B8",
      tertiary: "#64748B",
      inverse: "#0F172A",
    },
    // 语义
    success: "#22C55E",
    error: "#EF4444",
    warning: "#F59E0B",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  typography: {
    hero: "text-3xl font-bold tracking-tight",
    title: "text-xl font-semibold",
    body: "text-base",
    caption: "text-sm",
    label: "text-sm font-medium",
  },
  // 最小触控区域 (WCAG / Apple HIG)
  minTouchTarget: 44,
} as const;
