/**
 * 全局视觉令牌：与「物业信息」模块对齐 — 深色海军底、青绿主操作、电蓝强调（Tab/激活态）
 */
export const theme = {
  /** 应用主背景 */
  bg: "#0a0e17",
  /** 更深背景（Web 外围、渐变底） */
  bgDeep: "#050a1b",
  /** 卡片 / 浮层 */
  bgElevated: "#1c2237",
  /** 分段控件选中、略亮表面 */
  segmentActive: "#2d364d",
  ink: "#FFFFFF",
  inkSecondary: "#8e9aaf",
  inkTertiary: "#64748b",
  border: "#2d364d",
  borderStrong: "#3d4a5c",
  /** 主 CTA：青绿 / 青蓝（与物业信息主按钮一致） */
  primary: "#00a3bf",
  primaryPressed: "#008fa8",
  /** Tab、链接高亮、中间首页按钮外发光 */
  electric: "#1e90ff",
  electricPressed: "#1877cc",
  /** 兼容旧代码：primary 曾指 iOS 蓝，现映射为电蓝强调 */
  legacyBlue: "#1e90ff",
  accentPurple: "#8b5cf6",
  success: "#30d158",
  warning: "#ff9f0a",
  danger: "#ff453a",
} as const;
