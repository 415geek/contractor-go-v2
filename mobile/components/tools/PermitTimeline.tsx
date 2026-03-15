import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { PermitItem } from "@/hooks/usePermitSearch";

type Props = { permits: PermitItem[] };

const STATUS_STYLE: Record<string, { bg: string; label: string }> = {
  finaled: { bg: "bg-green-500/20", label: "已完工" },
  approved: { bg: "bg-blue-500/20", label: "已批准" },
  pending: { bg: "bg-amber-500/20", label: "待审" },
};

export function PermitTimeline({ permits }: Props) {
  if (permits.length === 0) {
    return (
      <View className="py-4">
        <Text className="text-slate-500">暂无 Permit 记录</Text>
      </View>
    );
  }

  return (
    <View className="relative">
      {permits.map((p, i) => {
        const style = STATUS_STYLE[p.status ?? ""] ?? { bg: "bg-slate-500/20", label: p.status ?? "—" };
        const isLast = i === permits.length - 1;
        return (
          <View key={i} className="flex-row">
            <View className="w-6 items-center">
              <View className={`h-3 w-3 rounded-full ${style.bg}`} />
              {!isLast && <View className="mt-0.5 h-full w-0.5 self-center bg-slate-600" style={{ minHeight: 40 }} />}
            </View>
            <View className="ml-3 flex-1 pb-6">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-medium text-white">
                  {p.issued_date ?? "—"}
                </Text>
                <View className={`rounded px-2 py-0.5 ${style.bg}`}>
                  <Text className="text-xs font-medium text-slate-200">{style.label}</Text>
                </View>
              </View>
              <Text className="mt-0.5 text-base font-medium text-white">
                {p.type ?? p.description ?? "Permit"}
              </Text>
              {p.permit_number ? (
                <Text className="mt-0.5 text-sm text-slate-400">#{p.permit_number}</Text>
              ) : null}
              {p.estimated_cost != null ? (
                <Text className="mt-0.5 text-sm text-slate-400">预算: ${p.estimated_cost.toLocaleString()}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
