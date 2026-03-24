import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { iosComm } from "@/lib/ios-comm-theme";

type Props = {
  title: string;
  subtitle?: string;
  /** 右侧：语音通话入口（占位） */
  onCallPress?: () => void;
  /** 跳转通讯录式编辑页 */
  onContactPress?: () => void;
  /** 例如「对方看到的语言 · English」 */
  languageLine?: string;
  onLanguagePress?: () => void;
};

/**
 * 类 iOS Messages 顶部导航：左返回、居中标题 + 副标题、右联系人 + 通话；可选语言快捷行。
 */
export function IOSConversationHeader({
  title,
  subtitle,
  onCallPress,
  onContactPress,
  languageLine,
  onLanguagePress,
}: Props) {
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
          {languageLine && onLanguagePress ? (
            <Pressable onPress={onLanguagePress} hitSlop={6} style={{ marginTop: 6 }} accessibilityRole="button">
              <Text style={{ fontSize: 12, color: iosComm.systemBlue }} numberOfLines={1}>
                {languageLine}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            minWidth: iosComm.minTouch,
            gap: 2,
          }}
        >
          {onContactPress ? (
            <Pressable
              onPress={onContactPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="联系人信息"
              style={{ width: iosComm.minTouch, height: iosComm.minTouch, alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="person-circle-outline" size={26} color={iosComm.systemBlue} />
            </Pressable>
          ) : null}
          {onCallPress ? (
            <Pressable
              onPress={onCallPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="通话"
              style={{ width: iosComm.minTouch, height: iosComm.minTouch, alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="call-outline" size={22} color={iosComm.systemGreen} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
