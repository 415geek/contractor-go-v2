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

/** 嵌在 Tab 内时，为 ScrollView 预留底部 Tab 栏 + 安全区，避免内容被遮挡 */
export function useToolScrollBottomPadding(extra = 16) {
  const tabH = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  return tabH + Math.max(insets.bottom, 8) + extra;
}
