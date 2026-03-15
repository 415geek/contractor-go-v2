import { Ionicons } from "@expo/vector-icons";
import { Image, Linking, Pressable, Text, View } from "react-native";

import type { MaterialSearchHit } from "@/lib/nova-act-search";

type Props = { item: MaterialSearchHit };

const STOCK_STYLE: Record<string, { bg: string; label: string }> = {
  in_stock: { bg: "bg-green-500/20", label: "有现货" },
  out_of_stock: { bg: "bg-red-500/20", label: "无现货" },
  unknown: { bg: "bg-slate-500/20", label: "库存不详" },
};

export function MaterialResultCard({ item }: Props) {
  const style = STOCK_STYLE[item.stock_status] ?? STOCK_STYLE.unknown;

  return (
    <View className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
      {item.image_url ? (
        <View className="mb-3 h-20 w-full overflow-hidden rounded-lg bg-slate-700">
          <Image
            source={{ uri: item.image_url }}
            style={{ height: "100%", width: "100%" }}
            resizeMode="contain"
          />
        </View>
      ) : null}
      <Text className="text-base font-medium text-white" numberOfLines={2}>
        {item.product_name}
      </Text>
      <Text className="mt-1 text-2xl font-bold text-white">
        {item.price}
      </Text>
      <Text className="mt-0.5 text-sm text-slate-400">{item.store}</Text>
      <View className="mt-2 flex-row items-center justify-between">
        <View className={`rounded-lg px-2 py-1 ${style.bg}`}>
          <Text className="text-xs font-medium text-slate-200">
            {style.label}
          </Text>
        </View>
        <Pressable
          onPress={() => item.product_url && Linking.openURL(item.product_url)}
          className="flex-row items-center gap-1 rounded-lg bg-blue-600/80 px-3 py-2"
        >
          <Text className="text-sm font-medium text-white">查看详情</Text>
          <Ionicons name="open-outline" size={16} color="white" />
        </Pressable>
      </View>
    </View>
  );
}
