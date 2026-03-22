import { Pressable, Text, View } from "react-native";

import { pushPath } from "@/lib/web-navigation";

/** VoIP 在根 Stack 无底部 Tab，提供与主导航的快捷跳转 */
export function VoipQuickNav() {
  return (
    <View className="flex-row justify-center gap-8 border-b border-gray-800/90 bg-gray-900 py-2">
      <Pressable onPress={() => pushPath("/home")} hitSlop={8} accessibilityRole="button" accessibilityLabel="应用首页">
        <Text className="text-sm font-medium text-blue-400">消息</Text>
      </Pressable>
      <Pressable onPress={() => pushPath("/tools")} hitSlop={8} accessibilityRole="button" accessibilityLabel="工具中心">
        <Text className="text-sm font-medium text-blue-400">工具</Text>
      </Pressable>
      <Pressable onPress={() => pushPath("/profile")} hitSlop={8} accessibilityRole="button" accessibilityLabel="我的">
        <Text className="text-sm font-medium text-blue-400">我的</Text>
      </Pressable>
    </View>
  );
}
