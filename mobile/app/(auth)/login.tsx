import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

import { PhoneInput } from "@/components/ui/PhoneInput";
import { useAuth } from "@/hooks/useAuth";

export default function LoginScreen() {
  const sendOtp = useAuth((state) => state.sendOtp);
  const isLoading = useAuth((state) => state.isLoading);

  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countdown, setCountdown] = useState(0);

  const fullPhone = useMemo(() => `${countryCode}${phoneNumber}`, [countryCode, phoneNumber]);
  const canSubmit = phoneNumber.length >= 8 && !isLoading && countdown === 0;

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (phoneNumber.length < 8) {
      Alert.alert("手机号不完整", "请输入正确手机号 / Ingresa un numero valido.");
      return;
    }
    try {
      await sendOtp(fullPhone);
      setCountdown(60);
      router.push({ pathname: "/(auth)/verify", params: { phone: fullPhone } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "发送验证码失败。";
      Alert.alert("发送失败", message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-app" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-5 pt-6 pb-8">
          {/* Hero: 品牌 + 一句价值主张，避免首屏信息过载 */}
          <View className="pt-4 pb-2">
            <Text className="text-[28px] font-bold tracking-tight text-white">
              Contractor GO
            </Text>
            <Text className="mt-2 text-base text-surface-border">
              包工头的智能助手 · 短信验证码登录
            </Text>
          </View>

          {/* 主操作区：电话输入 + 主按钮必须首屏可见 */}
          <View className="mt-8 flex-1">
            <PhoneInput
              countryCode={countryCode}
              phoneNumber={phoneNumber}
              onCountryCodeChange={setCountryCode}
              onPhoneNumberChange={setPhoneNumber}
            />

            <Pressable
              onPress={handleSendOtp}
              disabled={!canSubmit}
              className="mt-6 min-h-touch items-center justify-center rounded-auth-button bg-primary-500 px-5 py-3.5 active:opacity-90 disabled:opacity-50"
              style={({ pressed }) => (pressed && canSubmit ? { opacity: 0.9 } : undefined)}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  {countdown > 0 ? `${countdown}s 后重试` : "获取验证码"}
                </Text>
              )}
            </Pressable>
          </View>

          {/* 支持地区：弱化放置底部，不抢主操作 */}
          <View className="mt-auto pt-4">
            <Text className="text-center text-xs text-surface-border">
              支持地区：美国 +1 · 中国 +86 · 墨西哥 +52
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
