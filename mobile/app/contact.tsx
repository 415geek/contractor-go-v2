import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WEB_APP_URL } from "@/lib/constants";
import {
  COMPANY_BRAND,
  LEGAL_ENTITY_NAME,
  REGISTERED_ADDRESS_LINES,
  SUPPORT_EMAIL,
} from "@/lib/company-legal";

/**
 * 公开页：对外联系信息（邮箱 + 地址）；未登录须能访问（根布局放行 /contact）。
 */
export default function ContactScreen() {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/landing");
  };

  const openMail = () => {
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${COMPANY_BRAND} 咨询`)}`);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-surface-app" edges={["top"]}>
        <View className="flex-row items-center border-b border-surface-border px-3 py-2">
          <Pressable onPress={goBack} hitSlop={12} className="p-2" accessibilityLabel="返回">
            <Ionicons name="chevron-back" size={26} color="#94a3b8" />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-semibold text-ink pr-10">联系我们</Text>
        </View>
        <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
          {Platform.OS === "web" ? (
            <Text className="text-xs text-ink-tertiary mb-4">公开地址：{WEB_APP_URL}/contact</Text>
          ) : null}

          <Text className="text-[15px] leading-[24px] text-ink-secondary mb-6">
            {COMPANY_BRAND} 由 {LEGAL_ENTITY_NAME} 运营。以下为对外公示的联系渠道，用于客户支持、合规与商务问询（含短信/10DLC 相关沟通）。
          </Text>

          <View className="mb-6 rounded-2xl border border-surface-border bg-surface-card p-4">
            <Text className="text-sm font-semibold text-ink mb-2">电子邮箱</Text>
            <Pressable onPress={openMail} accessibilityRole="link">
              <Text className="text-[16px] text-primary-400 underline">{SUPPORT_EMAIL}</Text>
            </Pressable>
            <Text className="text-[13px] leading-[20px] text-ink-tertiary mt-2">
              一般会在数个工作日内回复；紧急安全事件请在主题中注明「Security」。
            </Text>
          </View>

          <View className="mb-6 rounded-2xl border border-surface-border bg-surface-card p-4">
            <Text className="text-sm font-semibold text-ink mb-2">邮寄地址</Text>
            {REGISTERED_ADDRESS_LINES.map((line, i) => (
              <Text key={`${i}-${line}`} className="text-[15px] leading-[24px] text-ink-secondary">
                {line}
              </Text>
            ))}
            <Text className="text-[13px] leading-[20px] text-ink-tertiary mt-3">
              请确保上述地址与您在运营商注册（如 TCR Brand）及支付/税务档案中的主要营业地址一致；不一致时以贵司最新登记为准并及时更新本页。
            </Text>
          </View>

          <Text className="text-[13px] leading-[20px] text-ink-tertiary">
            另请参阅《隐私政策》与《服务条款》中关于消息服务、数据与退订（STOP）的说明。
          </Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
