import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator } from "react-native";

import { useConversations } from "@/hooks/useConversations";

const LANG_MAP: Record<string, string> = {
  "en-US": "EN",
  "en": "EN",
  "es": "ES",
  "zh-CN": "ZH",
  "zh": "ZH",
};

export default function MessagesIndexScreen() {
  const router = useRouter();
  const { conversations, isLoading, error, refetch } = useConversations();

  if (isLoading && conversations.length === 0) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900">
      <View className="pt-12 pb-4 px-4 border-b border-gray-800">
        <Text className="text-white text-2xl font-bold">消息</Text>
      </View>
      {error && (
        <View className="p-4 mx-4 mt-4 bg-red-900/30 rounded-lg">
          <Text className="text-red-400">{String(error)}</Text>
        </View>
      )}
      {conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="chatbubbles-outline" size={64} color="#6B7280" />
          <Text className="text-gray-400 text-center mt-4 text-lg">暂无对话</Text>
          <Text className="text-gray-500 text-center mt-2">点击右下角开始新对话</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/conversation/${item.id}`)}
              className="flex-row items-center px-4 py-4 border-b border-gray-800 active:bg-gray-800/50"
            >
              <View className="w-12 h-12 rounded-full bg-gray-700 items-center justify-center">
                <Text className="text-white font-semibold text-lg">
                  {(item.contact_name || item.contact_phone).slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1 ml-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white font-medium">{item.contact_name || item.contact_phone}</Text>
                  <Text className="text-gray-500 text-xs">
                    {item.last_message_at
                      ? new Date(item.last_message_at).toLocaleDateString("zh-CN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2 mt-0.5">
                  <Text className="text-gray-400 text-sm flex-1" numberOfLines={1}>
                    {item.contact_phone}
                  </Text>
                  <View className="bg-gray-700 px-2 py-0.5 rounded">
                    <Text className="text-gray-300 text-xs">
                      {LANG_MAP[item.contact_language] ?? item.contact_language}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>
          )}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3B82F6" />
          }
        />
      )}
      <Pressable
        onPress={() => router.push("/conversation/new" as never)}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </View>
  );
}
