import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { EstimateSegment as SegmentType } from "@/hooks/useHouseEstimate";

type Props = { segment: SegmentType };

export function EstimateSegment({ segment }: Props) {
  const [expanded, setExpanded] = useState(false);
  const qty = segment.quantity;
  const ppu = segment.price_per_unit;
  const total = segment.total_price;
  const qtyStr = qty ? `${qty.value} ${qty.unit}` : "—";
  const priceStr = ppu ? `$${ppu.min} - $${ppu.max} / unit` : "—";
  const totalStr = total ? `$${total.min} - $${total.max}` : "—";

  return (
    <View className="rounded-xl border border-slate-700 bg-slate-800/80 overflow-hidden">
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        className="flex-row items-center justify-between p-4"
      >
        <View className="flex-1">
          <Text className="text-base font-medium text-white">
            {segment.material_name ?? segment.material_type ?? "Material"}
          </Text>
          <Text className="mt-1 text-sm text-slate-400">{qtyStr}</Text>
          <Text className="mt-0.5 text-lg font-semibold text-white">{totalStr}</Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#94A3B8"
        />
      </Pressable>
      {expanded && (
        <View className="border-t border-slate-700 px-4 pb-4 pt-2">
          <Text className="text-sm text-slate-400">单价: {priceStr}</Text>
          {segment.material_type ? (
            <Text className="mt-1 text-sm text-slate-500">类型: {segment.material_type}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}
