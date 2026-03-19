import { useOAuth, useSignIn, useSignUp } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import { router } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { PhoneInput } from "@/components/ui/PhoneInput";
import { useLang } from "@/lib/i18n";

const LABELS = {
  zh: {
    title: "登录 / 注册",
    tabPhone: "手机号",
    tabEmail: "邮箱",
    phoneSub: "短信验证码，安全快捷",
    emailSub: "邮箱和密码登录",
    sendCode: "获取验证码",
    signIn: "登录",
    email: "邮箱",
    password: "密码",
    emailPlaceholder: "your@email.com",
    passwordPlaceholder: "密码",
    orContinueWith: "或通过以下方式登录",
    incomplete: "手机号不完整",
    incompleteMsg: "请输入正确手机号",
    failTitle: "操作失败",
  },
  en: {
    title: "Login / Sign up",
    tabPhone: "Phone",
    tabEmail: "Email",
    phoneSub: "SMS verification, fast & secure",
    emailSub: "Sign in with email and password",
    sendCode: "Get Code",
    signIn: "Sign In",
    email: "Email",
    password: "Password",
    emailPlaceholder: "your@email.com",
    passwordPlaceholder: "Password",
    orContinueWith: "Or continue with",
    incomplete: "Incomplete number",
    incompleteMsg: "Please enter a valid phone number",
    failTitle: "Failed",
  },
  es: {
    title: "Iniciar sesión",
    tabPhone: "Teléfono",
    tabEmail: "Correo",
    phoneSub: "Verificación por SMS, rápido y seguro",
    emailSub: "Inicia sesión con correo y contraseña",
    sendCode: "Obtener Código",
    signIn: "Iniciar sesión",
    email: "Correo electrónico",
    password: "Contraseña",
    emailPlaceholder: "tu@correo.com",
    passwordPlaceholder: "Contraseña",
    orContinueWith: "O continúa con",
    incomplete: "Número incompleto",
    incompleteMsg: "Ingresa un número válido",
    failTitle: "Error",
  },
} as const;

type Tab = "phone" | "email";

export default function LoginScreen() {
  const { lang } = useLang();
  const L = LABELS[lang] ?? LABELS.zh;
  const insets = useSafeAreaInsets();

  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();
  const { startOAuthFlow: startGoogle } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startGitHub } = useOAuth({ strategy: "oauth_github" });

  const [tab, setTab] = useState<Tab>("phone");
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };

  const fullPhone = useMemo(() => `${countryCode}${phoneNumber}`, [countryCode, phoneNumber]);
  const canSendOtp = phoneNumber.length >= 8 && !loading;

  // ─── Phone OTP ─────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!signInLoaded || !signUpLoaded) return;
    if (phoneNumber.length < 8) {
      Alert.alert(L.incomplete, L.incompleteMsg);
      return;
    }
    setLoading(true);
    try {
      // Try sign-in first
      const si = await signIn!.create({ identifier: fullPhone });
      const factor = si.supportedFirstFactors?.find(
        (f) => f.strategy === "phone_code"
      );
      await signIn!.prepareFirstFactor({
        strategy: "phone_code",
        phoneNumberId: (factor as any)?.phoneNumberId ?? "",
      });
      router.push({ pathname: "/(auth)/verify", params: { phone: fullPhone, flow: "sign-in" } });
    } catch {
      // User not found → sign-up
      try {
        await signUp!.create({ phoneNumber: fullPhone });
        await signUp!.preparePhoneNumberVerification({ strategy: "phone_code" });
        router.push({ pathname: "/(auth)/verify", params: { phone: fullPhone, flow: "sign-up-phone" } });
      } catch (err) {
        const msg = err instanceof Error ? err.message : L.failTitle;
        Alert.alert(L.failTitle, msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Email / Password ──────────────────────────────────────────────────────
  const handleEmailAuth = async () => {
    if (!signInLoaded || !signUpLoaded) return;
    setLoading(true);
    try {
      const result = await signIn!.create({ identifier: email, password });
      if (result.status === "complete") {
        await setActiveSignIn!({ session: result.createdSessionId! });
        router.replace("/(tabs)");
      }
    } catch {
      // User not found → create account
      try {
        const result = await signUp!.create({ emailAddress: email, password });
        if (result.status === "complete") {
          await setActiveSignUp!({ session: result.createdSessionId! });
          router.replace("/(tabs)");
        } else {
          await signUp!.prepareEmailAddressVerification({ strategy: "email_code" });
          router.push({ pathname: "/(auth)/verify", params: { email, flow: "sign-up-email" } });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : L.failTitle;
        Alert.alert(L.failTitle, msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── OAuth ─────────────────────────────────────────────────────────────────
  const handleOAuth = useCallback(
    async (provider: "google" | "github") => {
      setLoading(true);
      try {
        if (Platform.OS === "web") {
          // Web: full-page redirect flow avoids popup/COOP/Turnstile issues entirely.
          // Clerk will redirect back to /sso-callback which completes the session.
          const strategy = `oauth_${provider}` as `oauth_${typeof provider}`;
          await signIn!.authenticateWithRedirect({
            strategy,
            redirectUrl: `${window.location.origin}/sso-callback`,
            redirectUrlComplete: `${window.location.origin}/`,
          });
          // Full page navigates away — no further code executes here.
          return;
        }

        // Native: popup-based OAuth with deep-link redirect scheme.
        const flow = provider === "google" ? startGoogle : startGitHub;
        const redirectUrl = AuthSession.makeRedirectUri({ scheme: "contractorgo" });
        const { createdSessionId, setActive, signUp: oauthSignUp } = await flow({ redirectUrl });
        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          router.replace("/(tabs)");
        } else if (oauthSignUp?.status === "complete" && oauthSignUp.createdSessionId && setActive) {
          await setActive({ session: oauthSignUp.createdSessionId });
          router.replace("/(tabs)");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : L.failTitle;
        Alert.alert(L.failTitle, msg);
      } finally {
        setLoading(false);
      }
    },
    [signIn, startGoogle, startGitHub, L.failTitle]
  );

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
          <View className="mb-6">
            <Text className="text-[28px] font-bold tracking-tight text-white">{L.title}</Text>
          </View>

          {/* Tab 切换 */}
          <View className="flex-row bg-surface-card rounded-xl p-1 mb-6">
            {(["phone", "email"] as Tab[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg items-center ${tab === t ? "bg-primary-600" : ""}`}
              >
                <Text className={`text-sm font-semibold ${tab === t ? "text-white" : "text-slate-400"}`}>
                  {t === "phone" ? L.tabPhone : L.tabEmail}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* 手机号 OTP */}
          {tab === "phone" && (
            <View className="flex-1">
              <Text className="text-slate-400 text-sm mb-4">{L.phoneSub}</Text>
              <PhoneInput
                countryCode={countryCode}
                phoneNumber={phoneNumber}
                onCountryCodeChange={setCountryCode}
                onPhoneNumberChange={setPhoneNumber}
              />
              <Pressable
                onPress={() => void handleSendOtp()}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={!canSendOtp}
              >
                <Animated.View
                  className="mt-5 min-h-touch-xl items-center justify-center rounded-auth-button bg-primary-600 px-5"
                  style={{ transform: [{ scale: scaleAnim }], opacity: canSendOtp ? 1 : 0.5 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-base font-semibold text-white">{L.sendCode}</Text>
                  )}
                </Animated.View>
              </Pressable>
            </View>
          )}

          {/* 邮箱 + 密码 */}
          {tab === "email" && (
            <View className="flex-1">
              <Text className="text-slate-400 text-sm mb-4">{L.emailSub}</Text>
              <View className="gap-3">
                <View>
                  <Text className="text-xs font-medium text-slate-400 mb-1">{L.email}</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder={L.emailPlaceholder}
                    placeholderTextColor="#475569"
                    className="rounded-xl border border-slate-700 bg-surface-card px-4 py-3.5 text-white text-base"
                  />
                </View>
                <View>
                  <Text className="text-xs font-medium text-slate-400 mb-1">{L.password}</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder={L.passwordPlaceholder}
                    placeholderTextColor="#475569"
                    className="rounded-xl border border-slate-700 bg-surface-card px-4 py-3.5 text-white text-base"
                  />
                </View>
              </View>
              <Pressable
                onPress={() => void handleEmailAuth()}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={!email || !password || loading}
              >
                <Animated.View
                  className="mt-5 min-h-touch-xl items-center justify-center rounded-auth-button bg-primary-600 px-5"
                  style={{ transform: [{ scale: scaleAnim }], opacity: email && password && !loading ? 1 : 0.5 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-base font-semibold text-white">{L.signIn}</Text>
                  )}
                </Animated.View>
              </Pressable>
            </View>
          )}

          {/* 社交登录 */}
          <View className="mt-auto pt-6">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="flex-1 h-px bg-slate-700" />
              <Text className="text-slate-500 text-xs">{L.orContinueWith}</Text>
              <View className="flex-1 h-px bg-slate-700" />
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => void handleOAuth("google")}
                disabled={loading}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-slate-700 bg-surface-card py-3.5 active:bg-surface-elevated disabled:opacity-50"
              >
                <Ionicons name="logo-google" size={18} color="#EA4335" />
                <Text className="text-white text-sm font-semibold">Google</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleOAuth("github")}
                disabled={loading}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-slate-700 bg-surface-card py-3.5 active:bg-surface-elevated disabled:opacity-50"
              >
                <Ionicons name="logo-github" size={18} color="#fff" />
                <Text className="text-white text-sm font-semibold">GitHub</Text>
              </Pressable>
            </View>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
