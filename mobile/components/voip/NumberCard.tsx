import { View, Text, Pressable } from "react-native";

import { iosComm } from "@/lib/ios-comm-theme";

type NumberCardProps = {
  did: string;
  monthly?: string;
  status?: string;
  /** 区域 / rate center 等副标题 */
  subtitle?: string;
  onAction?: () => void;
  actionLabel?: string;
};

/**
 * 类 iOS 分组列表中的号码行：圆角卡片 + 状态胶囊。
 */
export function NumberCard({
  did,
  monthly = "0",
  status = "active",
  subtitle,
  onAction,
  actionLabel = "购买",
}: NumberCardProps) {
  const badgeBg =
    status === "active"
      ? iosComm.systemGreen
      : status === "available"
        ? iosComm.systemBlue
        : "#FF9F0A";
  return (
    <View
      style={{
        borderRadius: 12,
        backgroundColor: iosComm.groupedSecondary,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View className="min-w-0 flex-1 pr-2">
        <Text style={{ color: iosComm.label, fontSize: 19 }}>{did}</Text>
        {subtitle ? (
          <Text style={{ color: iosComm.secondaryLabel, fontSize: 13, marginTop: 4 }} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-2 mt-2">
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: badgeBg }}>
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>{status}</Text>
          </View>
          <Text style={{ color: iosComm.secondaryLabel, fontSize: 15 }}>${monthly}/月</Text>
        </View>
      </View>
      {onAction && (
        <Pressable
          onPress={onAction}
          style={{
            backgroundColor: iosComm.systemBlue,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
