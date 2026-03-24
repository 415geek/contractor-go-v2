import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { CommSegmentedControl, type CommHubTab } from "@/components/comm/CommSegmentedControl";
import { PhoneDialPadTab } from "@/components/comm/PhoneDialPadTab";
import { useConversations, type Conversation } from "@/hooks/useConversations";
import { useVirtualNumbers } from "@/hooks/useVirtualNumbers";
import { iosComm } from "@/lib/ios-comm-theme";
import { pushPath } from "@/lib/web-navigation";

const LANG_MAP: Record<string, string> = {
  "en-US": "英语",
  en: "英语",
  es: "西语",
  "zh-CN": "中文",
  zh: "中文",
};

function getInitial(name: string): string {
  return (name || "?").slice(0, 1).toUpperCase();
}

function formatListTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startToday.getTime() - startMsg.getTime()) / 86400000);
  if (diffDays === 0) {
    return d.toLocaleTimeString("zh-CN", { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()] ?? "";
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

const AVATAR_HUES = ["#5856D6", "#FF9500", "#FF2D55", "#34C759", "#007AFF", "#AF52DE"];

function getAvatarColor(name: string): string {
  const code = (name || "?").charCodeAt(0);
  return AVATAR_HUES[code % AVATAR_HUES.length];
}

function hapticLight() {
  if (Platform.OS === "ios") {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

function useContactRows(conversations: Conversation[]): Conversation[] {
  return useMemo(() => {
    const m = new Map<string, Conversation>();
    for (const c of conversations) {
      const key = c.contact_phone;
      if (!m.has(key)) m.set(key, c);
    }
    return [...m.values()].sort((a, b) => {
      const na = (a.contact_name || a.contact_phone).toLowerCase();
      const nb = (b.contact_name || b.contact_phone).toLowerCase();
      return na.localeCompare(nb, "zh-Hans-CN");
    });
  }, [conversations]);
}

/**
 * 信息 Tab：类 Apple「电话」应用结构 — 电话（拨号盘）/ 短信（会话列表）/ 联系人。
 */
export default function MessagesIndexScreen() {
  const router = useRouter();
  const [hubTab, setHubTab] = useState<CommHubTab>("sms");
  const { conversations, isLoading, error, refetch } = useConversations();
  const { numbers: virtualNumbers, sessionReady: vnSessionReady } = useVirtualNumbers();
  const hasVirtualNumber = vnSessionReady && virtualNumbers.length > 0;
  const myDid = virtualNumbers[0]?.phone_number ?? "";
  const contactRows = useContactRows(conversations);

  const showCompose = hubTab === "sms" || hubTab === "contacts";

  if (isLoading && conversations.length === 0 && hubTab === "sms") {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: iosComm.bg }}>
        <ActivityIndicator size="large" color={iosComm.systemBlue} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: iosComm.bg }} edges={["top"]}>
      <View className="flex-row items-end justify-between px-4 pt-1 pb-2">
        <Text
          style={{
            flex: 1,
            fontSize: 34,
            fontWeight: "700",
            color: iosComm.label,
            letterSpacing: 0.35,
          }}
        >
          信息
        </Text>
        {showCompose ? (
          <Pressable
            onPress={() => {
              hapticLight();
              router.push("/conversation/new" as never);
            }}
            accessibilityRole="button"
            accessibilityLabel="撰写新信息"
            style={{
              width: 44,
              height: 44,
              marginBottom: 4,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="create-outline" size={28} color={iosComm.systemBlue} />
          </Pressable>
        ) : (
          <View style={{ width: 44, height: 44 }} />
        )}
      </View>

      <CommSegmentedControl value={hubTab} onChange={setHubTab} />

      {hubTab === "phone" ? (
        <PhoneDialPadTab
          hasVirtualNumber={hasVirtualNumber}
          myDidLabel={myDid || "—"}
          onComposeSms={(e164) => {
            router.push(`/conversation/new?phone=${encodeURIComponent(e164)}` as never);
          }}
        />
      ) : null}

      {hubTab === "sms" ? (
        <>
          <Pressable
            onPress={() => {
              hapticLight();
              pushPath("/voip");
            }}
            style={{
              marginHorizontal: 16,
              marginBottom: 8,
              borderRadius: 10,
              backgroundColor: iosComm.groupedSecondary,
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              paddingHorizontal: 14,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: iosComm.systemGreen + "33",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="call" size={18} color={iosComm.systemGreen} />
            </View>
            <View className="flex-1 ml-3 min-w-0">
              <Text style={{ color: iosComm.label, fontSize: 17, fontWeight: "600" }}>
                {hasVirtualNumber ? "我的号码" : "获取号码"}
              </Text>
              <Text style={{ color: iosComm.secondaryLabel, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                {hasVirtualNumber ? myDid : "开通后即可收发短信，像普通手机一样使用"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={iosComm.tertiaryLabel as string} />
          </Pressable>

          {error ? (
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 8,
                padding: 12,
                borderRadius: 10,
                backgroundColor: "rgba(255, 69, 58, 0.15)",
              }}
            >
              <Text style={{ color: "#FF453A", fontSize: 15 }}>
                {error instanceof Error ? error.message : (error as { message?: string })?.message ?? "加载失败"}
              </Text>
            </View>
          ) : null}

          {conversations.length === 0 ? (
            <View className="flex-1 items-center justify-center px-10 pt-4">
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: iosComm.groupedSecondary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons name="chatbubble-outline" size={36} color={iosComm.secondaryLabel as string} />
              </View>
              <Text style={{ color: iosComm.label, fontSize: 20, fontWeight: "600", textAlign: "center" }}>
                暂无对话
              </Text>
              <Text
                style={{
                  color: iosComm.secondaryLabel,
                  fontSize: 15,
                  textAlign: "center",
                  marginTop: 8,
                  lineHeight: 22,
                }}
              >
                {hasVirtualNumber
                  ? "点右上角撰写，或切到「电话」用拨号盘发第一条短信；客户发到虚拟号时，会话会出现在这里。"
                  : "开通虚拟号码后，即可像 iPhone「信息」一样收发短信。"}
              </Text>
              {!hasVirtualNumber ? (
                <Pressable
                  onPress={() => pushPath("/voip")}
                  style={{
                    marginTop: 24,
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: iosComm.systemBlue,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>去开通号码</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => router.push("/conversation/new" as never)}
                  style={{
                    marginTop: 24,
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: iosComm.systemGreen,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>撰写第一条信息</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={iosComm.systemBlue} />
              }
              renderItem={({ item, index }) => {
                const displayName = item.contact_name || item.contact_phone;
                const langShort = LANG_MAP[item.contact_language] ?? item.contact_language;
                const avatarBg = getAvatarColor(displayName);

                return (
                  <Pressable
                    onPress={() => {
                      hapticLight();
                      router.push(`/conversation/${item.id}`);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      backgroundColor: pressed ? iosComm.highlight : iosComm.bg,
                      borderBottomWidth: index === conversations.length - 1 ? 0 : 0.33,
                      borderBottomColor: iosComm.separator,
                    })}
                  >
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        backgroundColor: avatarBg,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 20, fontWeight: "600" }}>{getInitial(displayName)}</Text>
                    </View>
                    <View className="flex-1 ml-3 min-w-0">
                      <View className="flex-row items-baseline justify-between gap-2">
                        <Text style={{ color: iosComm.label, fontSize: 17, fontWeight: "600" }} numberOfLines={1}>
                          {displayName}
                        </Text>
                        <Text style={{ color: iosComm.tertiaryLabel, fontSize: 15 }} numberOfLines={1}>
                          {formatListTime(item.last_message_at)}
                        </Text>
                      </View>
                      <View className="flex-row items-center mt-2 gap-2">
                        <Text
                          style={{ color: iosComm.secondaryLabel, fontSize: 15, flex: 1 }}
                          numberOfLines={1}
                        >
                          {item.contact_phone}
                        </Text>
                        <Text style={{ color: iosComm.tertiaryLabel, fontSize: 13 }} numberOfLines={1}>
                          {langShort}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </>
      ) : null}

      {hubTab === "contacts" ? (
        contactRows.length === 0 ? (
          <View className="flex-1 items-center justify-center px-10">
            <Ionicons name="people-outline" size={56} color={iosComm.tertiaryLabel as string} />
            <Text style={{ color: iosComm.secondaryLabel, fontSize: 16, textAlign: "center", marginTop: 16 }}>
              暂无联系人{"\n"}开启对话后，号码会出现在这里
            </Text>
          </View>
        ) : (
          <FlatList
            data={contactRows}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={iosComm.systemBlue} />
            }
            renderItem={({ item, index }) => {
              const displayName = item.contact_name || item.contact_phone;
              const avatarBg = getAvatarColor(displayName);
              return (
                <Pressable
                  onPress={() => {
                    hapticLight();
                    router.push(`/conversation/${item.id}`);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: pressed ? iosComm.highlight : iosComm.bg,
                    borderBottomWidth: index === contactRows.length - 1 ? 0 : 0.33,
                    borderBottomColor: iosComm.separator,
                  })}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: avatarBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>{getInitial(displayName)}</Text>
                  </View>
                  <View className="flex-1 ml-3 min-w-0">
                    <Text style={{ color: iosComm.label, fontSize: 17, fontWeight: "600" }} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={{ color: iosComm.secondaryLabel, fontSize: 15, marginTop: 4 }} numberOfLines={1}>
                      {item.contact_phone}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={iosComm.tertiaryLabel as string} />
                </Pressable>
              );
            }}
          />
        )
      ) : null}
    </SafeAreaView>
  );
}
