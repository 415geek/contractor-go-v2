import { Stack } from "expo-router";
import { Platform } from "react-native";

/**
 * 工具 Tab 内嵌 Stack：从工具中心进入子工具时保留底部 Tab，返回栈可用（Web 勿用整页跳转）。
 */
export default function ToolsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#020617" },
        animation: "slide_from_right",
        gestureEnabled: Platform.OS === "ios",
      }}
    />
  );
}
