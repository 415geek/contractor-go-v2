import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OtpInput } from "@/components/ui/OtpInput";
import { useAuth } from "@/hooks/useAuth";

export default function VerifyScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const sendOtp = useAuth((state) => state.sendOtp);
  const verifyOtp = useAuth((state) => state.verifyOtp);
  const isLoading = useAuth((state) => state.isLoading);

  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
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
    if (!phone) {
      return;
    }

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
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-1 px-6 py-10">
        <Pressable onPress={() => router.back()} className="self-start rounded-lg bg-gray-800 px-4 py-2">
          <Text className="font-medium text-white">返回</Text>
        </Pressable>

        <View className="mt-12 gap-3">
          <Text className="text-3xl font-bold text-white">输入验证码</Text>
          <Text className="text-sm leading-6 text-gray-400">
            验证码已发送到 {phone ?? "你的手机"}.{"\n"}
            Ingresa el codigo de 6 digitos recibido por SMS.
          </Text>
        </View>

        <View className="mt-10 gap-6">
          <OtpInput
            value={code}
            onChange={setCode}
            onComplete={(nextCode: string) => {
              void handleVerify(nextCode);
            }}
          />

          <Pressable
            onPress={() => {
              void handleVerify(code);
            }}
            disabled={isLoading || code.length !== 6}
            className={`rounded-xl px-5 py-4 ${isLoading || code.length !== 6 ? "bg-blue-300" : "bg-blue-500"}`}
          >
            <Text className="text-center text-base font-semibold text-white">验证并登录</Text>
          </Pressable>
        </View>

        <View className="mt-auto gap-3">
          <Text className="text-center text-sm text-gray-400">
            {countdown > 0 ? `${countdown}s 后可重新发送` : "没有收到验证码？"}
          </Text>
          <Pressable
            onPress={() => {
              void handleResend();
            }}
            disabled={countdown > 0 || isLoading}
            className={`rounded-xl border border-gray-700 px-5 py-4 ${countdown > 0 || isLoading ? "bg-gray-800" : "bg-gray-800/50"}`}
          >
            <Text className="text-center text-base font-semibold text-white">重新发送验证码</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
