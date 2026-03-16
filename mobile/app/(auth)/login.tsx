import { Ionicons } from "@expo/vector-icons";
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
import { useLang } from "@/lib/i18n";

const LOGIN_LABELS = {
  zh: { title: "登录 / 注册", sub: "短信验证码，安全快捷", btn: "获取验证码", retry: "s 后重试", regions: "支持：美国 +1 · 中国 +86 · 墨西哥 +52", incomplete: "手机号不完整", incompleteMsg: "请输入正确手机号", failTitle: "发送失败" },
  en: { title: "Login / Sign up", sub: "SMS verification, fast & secure", btn: "Get Code", retry: "s retry", regions: "US +1 · China +86 · Mexico +52", incomplete: "Incomplete number", incompleteMsg: "Please enter a valid phone number", failTitle: "Failed to send" },
  es: { title: "Iniciar sesión", sub: "Verificación por SMS, rápido y seguro", btn: "Obtener Código", retry: "s reintentar", regions: "EE.UU +1 · China +86 · México +52", incomplete: "Número incompleto", incompleteMsg: "Ingresa un número válido", failTitle: "Error al enviar" },
} as const;

export default function LoginScreen() {
  const sendOtp = useAuth((state) => state.sendOtp);
  const isLoading = useAuth((state) => state.isLoading);
  const { lang } = useLang();
  const L = LOGIN_LABELS[lang] ?? LOGIN_LABELS.zh;

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
      Alert.alert(L.incomplete, L.incompleteMsg);
      return;
    }
    try {
      await sendOtp(fullPhone);
      setCountdown(60);
      router.push({ pathname: "/(auth)/verify", params: { phone: fullPhone } });
    } catch (error) {
      const message = error instanceof Error ? error.message : L.failTitle;
      Alert.alert(L.failTitle, message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-app" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-5 pt-4 pb-8">

          {/* 返回落地页 */}
          <Pressable
            onPress={() => router.replace("/landing")}
            className="flex-row items-center gap-1 mb-6 self-start active:opacity-70"
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={18} color="#94A3B8" />
            <Text className="text-slate-400 text-sm">Contractor GO</Text>
          </Pressable>

          {/* 标题 */}
          <View className="mb-8">
            <Text className="text-[28px] font-bold tracking-tight text-white">
              {L.title}
            </Text>
            <Text className="mt-1.5 text-base text-slate-400">
              {L.sub}
            </Text>
          </View>

          {/* 输入区 */}
          <View className="flex-1">
            <PhoneInput
              countryCode={countryCode}
              phoneNumber={phoneNumber}
              onCountryCodeChange={setCountryCode}
              onPhoneNumberChange={setPhoneNumber}
            />

            <Pressable
              onPress={handleSendOtp}
              disabled={!canSubmit}
              className="mt-5 min-h-touch-xl items-center justify-center rounded-auth-button bg-primary-600 px-5 active:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  {countdown > 0 ? `${countdown}${L.retry}` : L.btn}
                </Text>
              )}
            </Pressable>
          </View>

          {/* 支持地区 */}
          <View className="mt-auto pt-4">
            <Text className="text-center text-xs text-slate-600">
              {L.regions}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
