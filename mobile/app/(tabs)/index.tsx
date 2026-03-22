import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useConversations } from "@/hooks/useConversations";
import { pushPath } from "@/lib/web-navigation";

const LANG_MAP: Record<string, string> = {
  "en-US": "EN",
  "en": "EN",
  "es": "ES",
  "zh-CN": "ZH",
  "zh": "ZH",
};

function getInitial(name: string): string {
  return (name || "?").slice(0, 1).toUpperCase();
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}小时前`;
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

const AVATAR_COLORS = [
  "bg-primary-700",
  "bg-accent-600",
  "bg-success-700",
  "bg-warning-600",
  "bg-purple-700",
  "bg-pink-700",
];

function getAvatarColor(name: string): string {
  const code = (name || "?").charCodeAt(0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export default function MessagesIndexScreen() {
  const router = useRouter();
  const { conversations, isLoading, error, refetch } = useConversations();

  if (isLoading && conversations.length === 0) {
    return (
      <View className="flex-1 bg-surface-app items-center justify-center">
        <ActivityIndicator size="large" color="#00a3bf" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-app" edges={["top"]}>
      {/* 顶部标题栏 */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
        <Text className="text-2xl font-bold text-ink">消息</Text>
        <Pressable
          className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center active:opacity-70"
          accessibilityLabel="搜索"
          hitSlop={8}
        >
          <Ionicons name="search-outline" size={20} color="#8e9aaf" />
        </Pressable>
      </View>

      {/* 虚拟号码条 */}
      <Pressable
        onPress={() => pushPath("/voip")}
        className="mx-4 mb-3 rounded-xl bg-primary-500 px-4 py-3 flex-row items-center active:bg-primary-600 shadow-button"
      >
        <Ionicons name="call" size={18} color="white" />
        <Text className="flex-1 ml-2.5 text-sm font-medium text-white">
          获取虚拟号码，开始接单
        </Text>
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
      </Pressable>

      {/* 错误提示 */}
      {error && (
        <View className="mx-4 mb-3 px-4 py-3 bg-error-500/20 rounded-xl border border-error-500/30">
          <Text className="text-error-500 text-sm">{error instanceof Error ? error.message : (error as { message?: string })?.message ?? "Unknown error"}</Text>
        </View>
      )}

      {/* 对话列表 / 空状态 */}
      {conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-surface-elevated items-center justify-center mb-4">
            <Ionicons name="chatbubbles-outline" size={40} color="#64748b" />
          </View>
          <Text className="text-ink text-lg font-semibold text-center">还没有对话</Text>
          <Text className="text-ink-secondary text-sm text-center mt-2 leading-relaxed">
            购买虚拟号码后，{"\n"}客户的消息会出现在这里
          </Text>
          <Pressable
            onPress={() => pushPath("/voip")}
            className="mt-6 bg-primary-500 rounded-xl px-6 py-3.5 active:bg-primary-600 shadow-button"
          >
            <Text className="text-white font-semibold">获取虚拟号码</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#00a3bf" />
          }
          renderItem={({ item }) => {
            const displayName = item.contact_name || item.contact_phone;
            const langCode = LANG_MAP[item.contact_language] ?? "EN";
            const avatarBg = getAvatarColor(displayName);

            return (
              <Pressable
                onPress={() => router.push(`/conversation/${item.id}`)}
                className="flex-row items-center px-4 py-3.5 border-b border-surface-border active:bg-surface-elevated"
              >
                {/* 头像 */}
                <View className={`w-12 h-12 rounded-full ${avatarBg} items-center justify-center flex-shrink-0`}>
                  <Text className="text-white font-bold text-lg">
                    {getInitial(displayName)}
                  </Text>
                </View>

                {/* 内容 */}
                <View className="flex-1 ml-3 min-w-0">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="text-ink font-semibold text-base flex-shrink-1" numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text className="text-ink-tertiary text-xs flex-shrink-0">
                      {formatTime(item.last_message_at)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2 mt-0.5">
                    <Text className="text-ink-secondary text-sm flex-1" numberOfLines={1}>
                      {item.contact_phone}
                    </Text>
                    <View className="rounded bg-surface-elevated px-1.5 py-0.5">
                      <Text className="text-ink-secondary text-xs font-medium">
                        {langCode}
                      </Text>
                    </View>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={16} color="#64748b" style={{ marginLeft: 8 }} />
              </Pressable>
            );
          }}
        />
      )}

      {/* 悬浮新建按钮 */}
      <Pressable
        onPress={() => router.push("/conversation/new" as never)}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-electric-500 items-center justify-center active:bg-electric-600 shadow-button-lg"
        accessibilityLabel="新建对话"
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}
