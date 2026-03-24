/**
 * iOS「信息 / 电话」深色模式语义色（与系统 Messages、Phone 深色界面一致）
 * 参考 Apple HIG：清晰层级、高对比、44pt 最小触控、分隔线与分组背景。
 */
export const iosComm = {
  /** 主背景（与系统黑接近） */
  bg: "#000000",
  /** 分组 / 次级表面 */
  groupedSecondary: "#1C1C1E",
  /** 输入条、抬升区域 */
  elevated: "#1C1C1E",
  /** 输入框填充 */
  inputFill: "#2C2C2E",
  /** 分隔线 */
  separator: "rgba(84, 84, 88, 0.65)",
  /** 发出气泡（iMessage 蓝） */
  bubbleSent: "#007AFF",
  /** 收到气泡 */
  bubbleReceived: "#3A3A3C",
  /** 主文案 */
  label: "#FFFFFF",
  /** 次级文案 */
  secondaryLabel: "rgba(235, 235, 245, 0.6)",
  /** 三级 / 占位 */
  tertiaryLabel: "rgba(235, 235, 245, 0.3)",
  /** 系统蓝（链接、发送激活） */
  systemBlue: "#0A84FF",
  /** 成功 / 发送可用（与系统绿接近） */
  systemGreen: "#30D158",
  /** 列表行按下 */
  highlight: "rgba(118, 118, 128, 0.24)",
  /** 导航栏底边 */
  navSeparator: "rgba(84, 84, 88, 0.65)",
  /** 最小触控 ~44pt */
  minTouch: 44,
  /** 大标题与内容边距 */
  screenPaddingH: 16,
  /** 气泡圆角 */
  bubbleRadius: 18,
} as const;
