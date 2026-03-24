import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { iosComm } from "@/lib/ios-comm-theme";

type VoipHeaderProps = {
  title: string;
  /** 浏览器/路由无后退栈时的回退目标 */
  fallbackRoute?: "/" | "/home" | "/voip";
  right?: ReactNode;
};

/**
 * 类 iOS「电话」子页导航：与信息模块统一的深色导航栏。
 */
export function VoipHeader({ title, fallbackRoute = "/home", right }: VoipHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallbackRoute as never);
  };

  return (
    <View
      style={{
        borderBottomWidth: 0.33,
        borderBottomColor: iosComm.navSeparator,
        backgroundColor: iosComm.bg,
        paddingTop: Math.max(insets.top, 6),
        paddingBottom: 10,
      }}
    >
      <View className="min-h-11 flex-row items-center px-2">
        <Pressable
          onPress={goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="返回"
          className="h-11 w-11 shrink-0 items-center justify-center active:opacity-60"
        >
          <Ionicons name="chevron-back" size={28} color={iosComm.systemBlue} />
        </Pressable>
        <Text
          className="min-w-0 flex-1 px-1 text-center text-[17px] font-semibold"
          style={{ color: iosComm.label }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View className="max-w-[52%] shrink-0 items-end justify-center pl-1">{right ?? <View className="h-11 w-2" />}</View>
      </View>
    </View>
  );
}
