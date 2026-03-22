import { View, Text } from "react-native";

type VoipFeedbackBannerProps = {
  kind: "error" | "info";
  text: string;
  /** 紧凑模式：更少边距、更小字号，适合与列表同屏 */
  compact?: boolean;
};

/** Web 上 Alert 不可靠，搜索/购号流程用横幅展示结果与错误 */
export function VoipFeedbackBanner({ kind, text, compact }: VoipFeedbackBannerProps) {
  const isErr = kind === "error";
  return (
    <View
      className={`rounded-lg ${compact ? "mt-2 p-2" : "mt-3 p-3"} ${isErr ? "bg-red-900/50" : "bg-blue-900/40"}`}
    >
      <Text
        className={`${isErr ? "text-red-200" : "text-blue-100"} ${compact ? "text-xs leading-4" : ""}`}
        numberOfLines={compact ? 4 : undefined}
      >
        {text}
      </Text>
    </View>
  );
}
