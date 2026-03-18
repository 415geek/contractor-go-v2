import { View, Text, Pressable } from "react-native";

type NumberCardProps = {
  did: string;
  monthly?: string;
  status?: string;
  onAction?: () => void;
  actionLabel?: string;
};

export function NumberCard({ did, monthly = "0", status = "active", onAction, actionLabel = "购买" }: NumberCardProps) {
  const badgeColor =
    status === "active" ? "bg-green-600" : status === "available" ? "bg-blue-600" : "bg-amber-500";
  return (
    <View className="rounded-xl bg-gray-800 p-4 flex-row items-center justify-between">
      <View>
        <Text className="text-white font-mono text-lg">{did}</Text>
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
