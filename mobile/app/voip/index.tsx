import { Ionicons } from "@expo/vector-icons";
import { View, Text, Pressable, FlatList, ActivityIndicator } from "react-native";

import { VoipHeader } from "@/components/voip/VoipHeader";
import { VoipQuickNav } from "@/components/voip/VoipQuickNav";
import { NumberCard } from "@/components/voip/NumberCard";
import { useVirtualNumbers } from "@/hooks/useVirtualNumbers";
import { pushPath } from "@/lib/web-navigation";

export default function VoipIndexScreen() {
  const { numbers, isLoading, error, refetch } = useVirtualNumbers();

  const buyButton = (
    <Pressable
      onPress={() => pushPath("/voip/purchase")}
      className="flex-row items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 active:opacity-80"
    >
      <Ionicons name="add" size={18} color="white" />
      <Text className="text-sm font-medium text-white">购买</Text>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-900">
        <VoipHeader title="我的号码" right={buyButton} />
        <VoipQuickNav />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900">
      <VoipHeader title="我的号码" right={buyButton} />
      <VoipQuickNav />
      {error && (
        <View className="p-4 bg-red-900/30 mx-4 mt-4 rounded-lg">
          <Text className="text-red-400">{error instanceof Error ? error.message : (error as { message?: string })?.message ?? "Unknown error"}</Text>
        </View>
      )}
      {numbers.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="call-outline" size={64} color="#6B7280" />
          <Text className="text-gray-400 text-center mt-4 text-lg">您还没有虚拟号码</Text>
          <Text className="text-gray-500 text-center mt-2">点击下方按钮购买</Text>
          <Pressable
            onPress={() => pushPath("/voip/purchase")}
            className="mt-6 bg-blue-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-medium">购买新号码</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={numbers}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4 gap-4"
          renderItem={({ item }) => (
            <NumberCard
              did={item.phone_number}
              monthly={String(item.metadata?.monthly_cost ?? 0)}
              status={item.status}
            />
          )}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      )}
    </View>
  );
}
