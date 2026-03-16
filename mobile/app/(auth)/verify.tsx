import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OtpInput } from "@/components/ui/OtpInput";
import { useAuth } from "@/hooks/useAuth";

function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return "***";
  const digits = phone.replace(/\D/g, "");
  const tail = digits.slice(-4);
  return `···${tail}`;
}

export default function VerifyScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const sendOtp = useAuth((state) => state.sendOtp);
  const verifyOtp = useAuth((state) => state.verifyOtp);
  const isLoading = useAuth((state) => state.isLoading);

  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const masked = phone ? maskPhone(phone) : "";

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerify = async (nextCode: string) => {
    if (!phone) {
      Alert.alert("缺少手机号", "请返回上一步重新输入手机号。");
      return;
    }
    try {
      await verifyOtp(phone, nextCode);
      router.replace("/(tabs)");
    } catch (error) {
      const message = error instanceof Error ? error.message : "验证码验证失败。";
      Alert.alert("验证失败", message);
      setCode("");
    }
  };

  const handleResend = async () => {
    if (!phone) return;
    try {
      await sendOtp(phone);
      setCountdown(60);
      setCode("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "重发失败。";
      Alert.alert("发送失败", message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-app" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-5 pt-4 pb-8">
          <Pressable
            onPress={() => router.back()}
            className="self-start rounded-lg py-2 pr-2 -ml-2"
            accessibilityLabel="返回"
            accessibilityRole="button"
          >
            <Text className="text-base font-medium text-primary-500">← 返回</Text>
          </Pressable>

          <View className="mt-8">
            <Text className="text-2xl font-bold tracking-tight text-white">
              输入验证码
            </Text>
            <Text className="mt-2 text-sm leading-5 text-surface-border">
              验证码已发送至 {masked}，请查收短信后输入 6 位数字
            </Text>
          </View>

          <View className="mt-8">
            <OtpInput
              value={code}
              onChange={setCode}
              onComplete={(nextCode: string) => void handleVerify(nextCode)}
            />

            <Pressable
              onPress={() => void handleVerify(code)}
              disabled={isLoading || code.length !== 6}
              className="mt-6 min-h-touch items-center justify-center rounded-auth-button bg-primary-500 px-5 py-3.5 disabled:opacity-50"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-base font-semibold text-white">验证并登录</Text>
              )}
            </Pressable>
          </View>

          <View className="mt-auto gap-3 pt-8">
            <Text className="text-center text-sm text-surface-border">
              {countdown > 0 ? `${countdown}s 后可重新发送` : "没收到验证码？"}
            </Text>
            <Pressable
              onPress={() => void handleResend()}
              disabled={countdown > 0 || isLoading}
              className="min-h-touch items-center justify-center rounded-auth-button border border-surface-border bg-surface-card px-5 py-3.5 disabled:opacity-50"
            >
              <Text className="text-base font-semibold text-white">重新发送验证码</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
