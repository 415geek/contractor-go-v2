import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { OtpInput } from "@/components/ui/OtpInput";
import { replaceSignedInHome } from "@/lib/web-navigation";

type VerifyFlow = "sign-in" | "sign-up-phone" | "sign-up-email";

function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return "***";
  const digits = phone.replace(/\D/g, "");
  const tail = digits.slice(-4);
  return `···${tail}`;
}

export default function VerifyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone, email, flow } = useLocalSearchParams<{
    phone?: string;
    email?: string;
    flow?: VerifyFlow;
  }>();

  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };

  const masked = phone ? maskPhone(phone) : email ?? "";
  const isPhone = flow !== "sign-up-email";

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerify = async (nextCode: string) => {
    if (!signInLoaded || !signUpLoaded) return;
    setLoading(true);
    try {
      if (flow === "sign-in") {
        const result = await signIn!.attemptFirstFactor({
          strategy: "phone_code",
          code: nextCode,
        });
        if (result.status === "complete") {
          await setActiveSignIn!({ session: result.createdSessionId! });
          replaceSignedInHome();
        }
      } else if (flow === "sign-up-phone") {
        const result = await signUp!.attemptPhoneNumberVerification({ code: nextCode });
        if (result.status === "complete") {
          await setActiveSignUp!({ session: result.createdSessionId! });
          replaceSignedInHome();
        }
      } else {
        const result = await signUp!.attemptEmailAddressVerification({ code: nextCode });
        if (result.status === "complete") {
          await setActiveSignUp!({ session: result.createdSessionId! });
          replaceSignedInHome();
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "验证码验证失败。";
      Alert.alert("验证失败", message);
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!signInLoaded || !signUpLoaded) return;
    setLoading(true);
    try {
      if (flow === "sign-in" && phone) {
        const factor = signIn!.supportedFirstFactors?.find(
          (f) => f.strategy === "phone_code"
        );
        await signIn!.prepareFirstFactor({
          strategy: "phone_code",
          phoneNumberId: (factor as any)?.phoneNumberId ?? "",
        });
      } else if (flow === "sign-up-phone") {
        await signUp!.preparePhoneNumberVerification({ strategy: "phone_code" });
      } else {
        await signUp!.prepareEmailAddressVerification({ strategy: "email_code" });
      }
      setCountdown(60);
      setCode("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "重发失败。";
      Alert.alert("发送失败", message);
    } finally {
      setLoading(false);
    }
  };

  const canVerify = code.length === 6 && signInLoaded && signUpLoaded && !loading;

  return (
    <SafeAreaView className="flex-1 bg-surface-app" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom, 24) }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View className="flex-1 px-5 pt-4">
          <Pressable
            onPress={() => router.back()}
            className="self-start rounded-lg py-2 pr-2 -ml-2 active:opacity-70"
            accessibilityLabel="返回"
            accessibilityRole="button"
            hitSlop={12}
          >
            <Text className="text-base font-medium text-primary-500">← 返回</Text>
          </Pressable>

          <View className="mt-8">
            <Text className="text-2xl font-bold tracking-tight text-white">
              输入验证码
            </Text>
            <Text className="mt-2 text-sm leading-5 text-slate-400">
              {isPhone
                ? `验证码已发送至 ${masked}，请查收短信后输入 6 位数字`
                : `验证码已发送至 ${masked}，请查收邮件后输入 6 位数字`}
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
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={!canVerify}
            >
              <Animated.View
                className="mt-6 min-h-touch items-center justify-center rounded-auth-button bg-primary-500 px-5 py-3.5"
                style={{ transform: [{ scale: scaleAnim }], opacity: canVerify ? 1 : 0.5 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-base font-semibold text-white">验证并登录</Text>
                )}
              </Animated.View>
            </Pressable>
          </View>

          <View className="mt-auto gap-3 pt-8">
            <Text className="text-center text-sm text-slate-400">
              {countdown > 0 ? `${countdown}s 后可重新发送` : "没收到验证码？"}
            </Text>
            <Pressable
              onPress={() => void handleResend()}
              disabled={countdown > 0 || loading}
              className="min-h-touch items-center justify-center rounded-auth-button border border-slate-700 bg-surface-card px-5 py-3.5 active:bg-surface-elevated disabled:opacity-50"
            >
              <Text className="text-base font-semibold text-white">重新发送验证码</Text>
            </Pressable>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
