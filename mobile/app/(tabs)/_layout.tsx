import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 49 + Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#64748B",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginTop: -2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: Platform.OS === "ios" ? "transparent" : "rgba(15, 23, 42, 0.95)",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: "rgba(255, 255, 255, 0.1)",
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        sceneStyle: {
          backgroundColor: "#0F172A",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "消息",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: "项目",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: "工具",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "我的",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
