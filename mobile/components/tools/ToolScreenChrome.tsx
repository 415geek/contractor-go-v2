import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * 工具子页顶栏：安全区 + 44pt 级触控返回（对齐 iOS 可点区域习惯）。
 */
export function ToolScreenHeader({ title }: { title: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/tools");
  };

  return (
    <View
      className="border-b border-slate-800 bg-slate-950 px-3 pb-2"
      style={{ paddingTop: Math.max(insets.top, 6) }}
    >
      <View className="h-11 flex-row items-center justify-center">
        <Pressable
          onPress={goBack}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          accessibilityRole="button"
          accessibilityLabel="返回"
          className="absolute left-0 z-10 h-11 w-11 items-center justify-center active:opacity-60"
        >
          <Ionicons name="chevron-back" size={28} color="#F8FAFC" />
        </Pressable>
        <Text className="mx-14 text-center text-lg font-semibold text-white" numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>
  );
}

/**
 * 嵌在 Tab 内时，为 ScrollView 预留底部空间。
 * `CenterHomeTabBar` 未在 `tabBarStyle` 写死高度时，`useBottomTabBarHeight()` 常偏小（尤其 Web），
 * 会导致表单最后一行被 Tab / 中间凸起首页按钮挡住；此处与 `CenterHomeTabBar` 的 wrapper 高度对齐。
 */
export function useToolScrollBottomPadding(extra = 20) {
  const reported = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const centerHomeBarTotal = 52 + bottomPad + 18;
  const tabH = Math.max(reported, centerHomeBarTotal);
  return tabH + extra;
}
