import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { useMeProfile } from "@/hooks/useMeProfile";
import { createStripeCheckoutSession } from "@/lib/api/stripe-checkout";
import { pushPath } from "@/lib/web-navigation";

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m} 分 ${s} 秒`;
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const { checkout } = useLocalSearchParams<{ checkout?: string }>();
  const { getToken } = useAuth();
  const { data, isLoading, error, refetch, isRefetching } = useMeProfile();
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  useEffect(() => {
    if (checkout === "success" || checkout === "cancel") {
      void refetch();
    }
  }, [checkout, refetch]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const openStripeCheckout = async () => {
    setCheckoutBusy(true);
    try {
      const token = await getToken();
      if (!token) return;
      const successUrl = Linking.createURL("/subscription", { queryParams: { checkout: "success" } });
      const cancelUrl = Linking.createURL("/subscription", { queryParams: { checkout: "cancel" } });
      const { url } = await createStripeCheckoutSession(token, {
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      console.warn("[subscription] checkout", e);
    } finally {
      setCheckoutBusy(false);
    }
  };

  const pro = data?.is_pro;
  const usage = data?.usage;
  const smsLimit = usage?.sms_outbound_limit;
  const smsSent = usage?.sms_outbound_sent ?? 0;
  const voiceLimit = usage?.voice_seconds_limit;
  const voiceUsed = usage?.voice_seconds_used ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-surface-app" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3 border-b border-surface-border">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="mr-2 p-1"
          accessibilityLabel="返回"
        >
          <Ionicons name="chevron-back" size={24} color="#1e293b" />
        </Pressable>
        <Text className="text-lg font-semibold text-ink flex-1">订阅与用量</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {checkout === "success" && (
          <View className="mb-4 rounded-xl bg-success-500/15 border border-success-500/30 px-4 py-3">
            <Text className="text-success-700 font-medium">支付成功</Text>
            <Text className="text-ink-secondary text-sm mt-1">订阅状态同步可能需要几秒，请下拉刷新。</Text>
          </View>
        )}
        {checkout === "cancel" && (
          <View className="mb-4 rounded-xl bg-surface-elevated border border-surface-border px-4 py-3">
            <Text className="text-ink-secondary text-sm">已取消本次支付。</Text>
          </View>
        )}

        {isLoading && !data ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : error ? (
          <Text className="text-error-500">{error.message}</Text>
        ) : (
          <>
            <View className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-card mb-4">
              <Text className="text-xs font-semibold uppercase text-ink-tertiary mb-2">当前方案</Text>
              <Text className="text-2xl font-bold text-ink">
                {pro ? "Pro 订阅" : "免费体验"}
              </Text>
              <Text className="text-ink-secondary text-sm mt-2">
                {pro
                  ? "无限出站短信；虚拟号码通话按套餐计费（Telnyx）。"
                  : "可绑定 1 个虚拟号码；50 条出站短信；通话体验约 10 分钟（语音侧接入后从用量扣减）。"}
              </Text>
            </View>

            <View className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-card mb-4">
              <Text className="text-xs font-semibold uppercase text-ink-tertiary mb-3">用量</Text>
              <View className="flex-row justify-between py-2 border-b border-surface-border">
                <Text className="text-ink-secondary">出站短信</Text>
                <Text className="text-ink font-medium">
                  {pro ? "无限制" : `${smsSent} / ${smsLimit ?? 50}`}
                </Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-ink-secondary">通话（体验额度）</Text>
                <Text className="text-ink font-medium">
                  {pro
                    ? "无 10 分钟限制"
                    : `${formatSeconds(voiceUsed)} / ${voiceLimit != null ? formatSeconds(voiceLimit) : "10 分钟"}`}
                </Text>
              </View>
              {isRefetching && (
                <Text className="text-ink-tertiary text-xs mt-2">刷新中…</Text>
              )}
            </View>

            {!pro && (
              <Pressable
                onPress={() => openStripeCheckout()}
                disabled={checkoutBusy}
                className="rounded-xl bg-primary-600 py-4 items-center active:opacity-90 mb-2"
              >
                {checkoutBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">订阅 Pro（$39.99/月）</Text>
                )}
              </Pressable>
            )}

            <Pressable
              onPress={() => pushPath("/voip")}
              className="rounded-xl border border-surface-border py-3.5 items-center mb-8"
            >
              <Text className="text-ink font-medium">管理虚拟号码</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
