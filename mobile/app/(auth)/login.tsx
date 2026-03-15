import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
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

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (phoneNumber.length < 8) {
      Alert.alert("手机号不完整", "请输入正确手机号 / Ingresa un numero valido.");
      return;
    }

    try {
      await sendOtp(fullPhone);
      setCountdown(60);
      router.push({
        pathname: "/(auth)/verify",
        params: { phone: fullPhone },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "发送验证码失败。";
      Alert.alert("发送失败", message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-1 px-6 py-10">
        <View className="mt-16 gap-3">
          <Text className="text-4xl font-bold text-white">Contractor GO</Text>
          <Text className="text-lg text-gray-300">包工头的智能助手</Text>
          <Text className="text-sm leading-6 text-gray-400">
            通过短信验证码快速登录。{"\n"}
            Accede con un codigo por SMS en segundos.
          </Text>
        </View>

        <View className="mt-12 gap-6">
          <PhoneInput
            countryCode={countryCode}
            phoneNumber={phoneNumber}
            onCountryCodeChange={setCountryCode}
            onPhoneNumberChange={setPhoneNumber}
          />

          <Pressable
            onPress={handleSendOtp}
            disabled={isLoading || countdown > 0}
            className={`rounded-xl px-5 py-4 ${isLoading || countdown > 0 ? "bg-blue-300" : "bg-blue-500"}`}
          >
            <Text className="text-center text-base font-semibold text-white">
              {countdown > 0 ? `${countdown}s 后重试` : "获取验证码"}
            </Text>
          </Pressable>
        </View>

        <View className="mt-auto rounded-2xl border border-gray-800 bg-gray-800/80 p-4">
          <Text className="text-sm text-gray-300">支持地区 / Regiones compatibles</Text>
          <Text className="mt-2 text-sm leading-6 text-gray-400">
            美国 +1、中国 +86、墨西哥 +52
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
