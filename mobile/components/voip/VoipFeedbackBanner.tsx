import { View, Text } from "react-native";

type VoipFeedbackBannerProps = {
  kind: "error" | "info";
  text: string;
};

/** Web 上 Alert 不可靠，搜索/购号流程用横幅展示结果与错误 */
export function VoipFeedbackBanner({ kind, text }: VoipFeedbackBannerProps) {
  const isErr = kind === "error";
  return (
    <View className={`mt-3 p-3 rounded-lg ${isErr ? "bg-red-900/50" : "bg-blue-900/40"}`}>
      <Text className={isErr ? "text-red-200" : "text-blue-100"}>{text}</Text>
    </View>
  );
}
