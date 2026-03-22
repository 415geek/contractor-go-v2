import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  size?: number;
  /** 浅色背景上用深蓝图标；深色/彩色底上用白 */
  variant?: "onLight" | "onDark";
};

/**
 * 品牌符号：对勾 + 圆角方 — 易识别、低认知成本（参考 Proma / Apple 简洁符号）
 */
export function LogoMark({ size = 40, variant = "onLight" }: Props) {
  const bg = variant === "onLight" ? "#007AFF" : "#FFFFFF";
  const icon = variant === "onLight" ? "#FFFFFF" : "#007AFF";
  const r = Math.round(size * 0.22);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#007AFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: variant === "onLight" ? 0.25 : 0,
        shadowRadius: 8,
        elevation: variant === "onLight" ? 6 : 0,
      }}
    >
      <Ionicons name="checkmark" size={size * 0.5} color={icon} />
    </View>
  );
}
