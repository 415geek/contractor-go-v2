import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/lib/theme";

const TAB_ORDER = ["index", "projects", "home", "tools", "profile"] as const;

type TabName = (typeof TAB_ORDER)[number];

const TAB_META: Record<
  Exclude<TabName, "home">,
  { label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }
> = {
  index: { label: "消息", icon: "chatbubble-ellipses-outline", iconActive: "chatbubble-ellipses" },
  projects: { label: "项目", icon: "briefcase-outline", iconActive: "briefcase" },
  tools: { label: "工具", icon: "construct-outline", iconActive: "construct" },
  profile: { label: "我的", icon: "person-outline", iconActive: "person" },
};

const INACTIVE = "#8e9aaf";
const ACTIVE = theme.electric;

function triggerHaptic() {
  if (Platform.OS === "ios") {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/**
 * 底部 Tab：深色底栏 + 中间凸起圆形「首页」（电蓝外发光，与物业信息系一致）
 */
export function CenterHomeTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const barHeight = 52 + bottomPad;
  const currentName = state.routes[state.index]?.name;

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { height: barHeight + 18 }]}>
      {Platform.OS === "ios" ? (
        <BlurView intensity={80} tint="dark" style={[StyleSheet.absoluteFill, { height: barHeight }]} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { height: barHeight, backgroundColor: "rgba(10, 14, 23, 0.96)" }]} />
      )}
      <View
        style={[
          styles.row,
          {
            height: barHeight,
            paddingBottom: bottomPad,
            borderTopColor: "rgba(255,255,255,0.08)",
          },
        ]}
      >
        {TAB_ORDER.map((name) => {
          const route = state.routes.find((r) => r.name === name);
          if (!route) return null;
          const focused = currentName === name;

          if (name === "home") {
            return (
              <View key={route.key} style={styles.cell}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="首页"
                  accessibilityState={{ selected: focused }}
                  onPress={() => {
                    triggerHaptic();
                    const event = navigation.emit({
                      type: "tabPress",
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (event.defaultPrevented) return;
                    if (focused) {
                      navigation.navigate("home", { screen: "index" } as never);
                      return;
                    }
                    navigation.navigate(route.name, route.params);
                  }}
                  style={({ pressed }) => [styles.homeFab, pressed && { transform: [{ scale: 0.96 }] }]}
                >
                  <Ionicons name="home" size={28} color="#FFFFFF" />
                </Pressable>
                <Text style={[styles.homeLabel, { color: focused ? ACTIVE : INACTIVE }]} numberOfLines={1}>
                  首页
                </Text>
              </View>
            );
          }

          const meta = TAB_META[name];
          const { options } = descriptors[route.key];
          const color = focused ? ACTIVE : INACTIVE;
          const iconName = focused ? meta.iconActive : meta.icon;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={options.title?.toString() ?? meta.label}
              accessibilityState={{ selected: focused }}
              onPress={() => {
                triggerHaptic();
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              style={styles.cell}
            >
              <Ionicons name={iconName} size={24} color={color} />
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
    overflow: "visible",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
    minHeight: 48,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  homeFab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.electric,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    marginTop: -26,
    shadowColor: theme.electric,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
  homeLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
});
