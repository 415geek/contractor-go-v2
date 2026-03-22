import { Tabs } from "expo-router";

import { CenterHomeTabBar } from "@/components/navigation/CenterHomeTabBar";
import { theme } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="home"
      tabBar={(props) => <CenterHomeTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
        },
        sceneStyle: {
          backgroundColor: theme.bg,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "消息" }} />
      <Tabs.Screen name="projects" options={{ title: "项目" }} />
      <Tabs.Screen name="home" options={{ title: "首页" }} />
      <Tabs.Screen name="tools" options={{ title: "工具" }} />
      <Tabs.Screen name="profile" options={{ title: "我的" }} />
    </Tabs>
  );
}
