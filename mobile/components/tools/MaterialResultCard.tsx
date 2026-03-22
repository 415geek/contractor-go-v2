import { Ionicons } from "@expo/vector-icons";
import { Image, Linking, Pressable, Text, View } from "react-native";

import type { MaterialSearchHit } from "@/lib/nova-act-search";

type Props = { item: MaterialSearchHit };

const STOCK_STYLE: Record<string, { bg: string; label: string; text: string }> = {
  in_stock: { bg: "bg-emerald-500/20", label: "有现货", text: "text-emerald-300" },
  out_of_stock: { bg: "bg-red-500/20", label: "无现货", text: "text-red-300" },
  unknown: { bg: "bg-surface-elevated", label: "库存不详", text: "text-ink-tertiary" },
};

export function MaterialResultCard({ item }: Props) {
  const style = STOCK_STYLE[item.stock_status] ?? STOCK_STYLE.unknown;
  const stockText = style.text;

  return (
    <View className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card">
      {item.image_url ? (
        <View className="mb-3 h-20 w-full overflow-hidden rounded-lg bg-surface-elevated">
          <Image
            source={{ uri: item.image_url }}
            style={{ height: "100%", width: "100%" }}
            resizeMode="contain"
          />
        </View>
      ) : null}
      <Text className="text-base font-medium text-ink" numberOfLines={2}>
        {item.product_name}
      </Text>
      <Text className="mt-1 text-2xl font-bold text-ink">
        {item.price}
      </Text>
      <Text className="mt-0.5 text-sm text-ink-secondary">{item.store}</Text>
      <View className="mt-2 flex-row items-center justify-between">
        <View className={`rounded-lg px-2 py-1 ${style.bg}`}>
          <Text className={`text-xs font-medium ${stockText}`}>
            {style.label}
          </Text>
        </View>
        <Pressable
          onPress={() => item.product_url && Linking.openURL(item.product_url)}
          className="flex-row items-center gap-1 rounded-lg bg-primary-500 px-3 py-2 active:bg-primary-600"
        >
          <Text className="text-sm font-medium text-white">查看详情</Text>
          <Ionicons name="open-outline" size={16} color="white" />
        </Pressable>
      </View>
    </View>
  );
}
