/**
 * 全局视觉令牌：浅色优先、高可读、低学习成本（对齐 Apple HIG / Uber / DoorDash 消费级体验）
 */
export const theme = {
  bg: "#F5F5F7",
  bgElevated: "#FFFFFF",
  ink: "#1C1C1E",
  inkSecondary: "#636366",
  inkTertiary: "#8E8E93",
  border: "#E5E5EA",
  borderStrong: "#D1D1D6",
  /** iOS 系统蓝 — 主操作 */
  primary: "#007AFF",
  primaryPressed: "#0062CC",
  /** Proma 风格点缀：柔和紫用于渐变/徽章 */
  accentPurple: "#5856D6",
  success: "#34C759",
  warning: "#FF9500",
  danger: "#FF3B30",
} as const;
