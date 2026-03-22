import { View, Text, Pressable } from "react-native";

type NumberCardProps = {
  did: string;
  monthly?: string;
  status?: string;
  /** 区域 / rate center 等副标题 */
  subtitle?: string;
  onAction?: () => void;
  actionLabel?: string;
};

export function NumberCard({
  did,
  monthly = "0",
  status = "active",
  subtitle,
  onAction,
  actionLabel = "购买",
}: NumberCardProps) {
  const badgeColor =
    status === "active" ? "bg-green-600" : status === "available" ? "bg-blue-600" : "bg-amber-500";
  return (
    <View className="rounded-xl bg-gray-800 p-4 flex-row items-center justify-between">
      <View className="min-w-0 flex-1 pr-2">
        <Text className="text-white font-mono text-lg">{did}</Text>
        {subtitle ? (
          <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-2 mt-1">
          <View className={`px-2 py-0.5 rounded ${badgeColor}`}>
            <Text className="text-white text-xs">{status}</Text>
          </View>
          <Text className="text-gray-400 text-sm">${monthly}/月</Text>
        </View>
      </View>
      {onAction && (
        <Pressable
          onPress={onAction}
          className="bg-blue-600 px-4 py-2 rounded-lg active:opacity-80"
        >
          <Text className="text-white font-medium">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
