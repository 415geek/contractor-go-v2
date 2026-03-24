import { Pressable, Text, View } from "react-native";

import { iosComm } from "@/lib/ios-comm-theme";
import { pushPath } from "@/lib/web-navigation";

/** VoIP 在根 Stack 无底部 Tab，提供与主导航的快捷跳转（样式与信息/电话模块一致） */
export function VoipQuickNav() {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        gap: 28,
        borderBottomWidth: 0.33,
        borderBottomColor: iosComm.separator,
        backgroundColor: iosComm.bg,
        paddingVertical: 10,
      }}
    >
      <Pressable onPress={() => pushPath("/home")} hitSlop={8} accessibilityRole="button" accessibilityLabel="应用首页">
        <Text style={{ fontSize: 15, fontWeight: "500", color: iosComm.systemBlue }}>信息</Text>
      </Pressable>
      <Pressable onPress={() => pushPath("/tools")} hitSlop={8} accessibilityRole="button" accessibilityLabel="工具中心">
        <Text style={{ fontSize: 15, fontWeight: "500", color: iosComm.systemBlue }}>工具</Text>
      </Pressable>
      <Pressable onPress={() => pushPath("/profile")} hitSlop={8} accessibilityRole="button" accessibilityLabel="我的">
        <Text style={{ fontSize: 15, fontWeight: "500", color: iosComm.systemBlue }}>我的</Text>
      </Pressable>
    </View>
  );
}
