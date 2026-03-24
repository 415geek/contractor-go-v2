import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { iosComm } from "@/lib/ios-comm-theme";

type Props = {
  title: string;
  subtitle?: string;
  /** 右侧：例如语音通话入口（占位） */
  onCallPress?: () => void;
};

/**
 * 类 iOS Messages 顶部导航：左返回、居中标题 + 副标题（号码）、右操作可选。
 */
export function IOSConversationHeader({ title, subtitle, onCallPress }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: Math.max(insets.top, 8),
        paddingBottom: 10,
        borderBottomWidth: 0.33,
        borderBottomColor: iosComm.navSeparator,
        backgroundColor: iosComm.bg,
      }}
    >
      <View className="min-h-[44px] flex-row items-center px-2">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/" as never))}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="返回"
          style={{ width: iosComm.minTouch, height: iosComm.minTouch, justifyContent: "center", alignItems: "center" }}
        >
          <Ionicons name="chevron-back" size={28} color={iosComm.systemBlue} />
        </Pressable>
        <View className="flex-1 items-center justify-center px-1 min-w-0">
          <Text className="text-[17px] font-semibold text-white text-center" numberOfLines={1}>
            {title || "信息"}
          </Text>
          {subtitle ? (
            <Text
              className="text-[13px] text-center mt-0.5"
              style={{ color: iosComm.secondaryLabel }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={{ width: iosComm.minTouch, height: iosComm.minTouch, alignItems: "center", justifyContent: "center" }}>
          {onCallPress ? (
            <Pressable
              onPress={onCallPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="通话"
            >
              <Ionicons name="call-outline" size={22} color={iosComm.systemGreen} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
