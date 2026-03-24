import { Ionicons } from "@expo/vector-icons";
import { View, Text, Pressable, FlatList, ActivityIndicator } from "react-native";

import { VoipHeader } from "@/components/voip/VoipHeader";
import { VoipQuickNav } from "@/components/voip/VoipQuickNav";
import { NumberCard } from "@/components/voip/NumberCard";
import { useVirtualNumbers } from "@/hooks/useVirtualNumbers";
import { useMeProfile } from "@/hooks/useMeProfile";
import { iosComm } from "@/lib/ios-comm-theme";
import { pushPath } from "@/lib/web-navigation";

export default function VoipIndexScreen() {
  const { numbers, isLoading, error, refetch } = useVirtualNumbers();
  const { data: me } = useMeProfile();

  const buyButton = (
    <Pressable
      onPress={() => pushPath("/voip/purchase")}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        borderRadius: 10,
        backgroundColor: iosComm.systemBlue,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <Ionicons name="add" size={18} color="white" />
      <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>购买</Text>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: iosComm.bg }}>
        <VoipHeader title="电话号码" right={buyButton} />
        <VoipQuickNav />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={iosComm.systemBlue} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: iosComm.bg }}>
      <VoipHeader title="电话号码" right={buyButton} />
      <VoipQuickNav />
      {me && !me.is_pro && (
        <Pressable
          onPress={() => pushPath("/subscription")}
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            borderRadius: 10,
            borderWidth: 0.33,
            borderColor: "rgba(255, 159, 10, 0.45)",
            backgroundColor: "rgba(255, 159, 10, 0.12)",
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: "#FF9F0A", fontSize: 15, fontWeight: "600" }}>用量与订阅</Text>
          <Text style={{ color: "rgba(255, 214, 170, 0.95)", fontSize: 13, marginTop: 4 }}>
            短信 {me.usage.sms_outbound_sent}/{me.usage.sms_outbound_limit ?? 50} · 升级 Pro 无限发送
          </Text>
        </Pressable>
      )}
      {error && (
        <View style={{ margin: 16, padding: 12, borderRadius: 10, backgroundColor: "rgba(255, 69, 58, 0.12)" }}>
          <Text style={{ color: "#FF453A" }}>
            {error instanceof Error ? error.message : (error as { message?: string })?.message ?? "Unknown error"}
          </Text>
        </View>
      )}
      {numbers.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: iosComm.groupedSecondary,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="call-outline" size={40} color={iosComm.secondaryLabel as string} />
          </View>
          <Text style={{ color: iosComm.label, fontSize: 20, fontWeight: "600", textAlign: "center" }}>
            尚未添加号码
          </Text>
          <Text style={{ color: iosComm.secondaryLabel, textAlign: "center", marginTop: 10, lineHeight: 22, fontSize: 15 }}>
            购买成功后，号码会显示在这里，用于收发短信与通话（通话能力依供应商开通情况）。
          </Text>
          <Pressable
            onPress={() => pushPath("/voip/purchase")}
            style={{
              marginTop: 24,
              backgroundColor: iosComm.systemGreen,
              paddingHorizontal: 28,
              paddingVertical: 14,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>选取号码</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={numbers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
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
