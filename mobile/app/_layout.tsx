import "../global.css";
import * as WebBrowser from "expo-web-browser";

import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@/lib/clerk-token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { WebResponsiveWrapper } from "@/components/WebResponsiveWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { theme } from "@/lib/theme";

WebBrowser.maybeCompleteAuthSession({ skipRedirectCheck: true });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function RootNavigator() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  /** 曾成功登录过本会话；用于区分「OAuth 刚回 /home、Clerk 尚未 hydration」与「用户主动登出」 */
  const hadSessionRef = useRef(false);
  const isSignedInRef = useRef(isSignedIn);
  isSignedInRef.current = isSignedIn;

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      hadSessionRef.current = true;
      return;
    }

    // 未登录：非 auth / landing / sso-callback 时，默认回落地页
    const inAuthGroup = segments[0] === "(auth)";
    const inLanding = segments[0] === "landing";
    const inSSO = segments[0] === "sso-callback";
    const inTabs = segments[0] === "(tabs)";

    if (inAuthGroup || inLanding || inSSO) return;

    // Web + 底部 Tab：Google OAuth 完成后会先跳到 /home，短暂出现 isSignedIn=false，若立刻 replace 会误判回 landing
    const oauthHydrationRace =
      Platform.OS === "web" && inTabs && !hadSessionRef.current;

    if (oauthHydrationRace) {
      const id = setTimeout(() => {
        if (isSignedInRef.current) return;
        router.replace("/landing");
      }, 1200);
      return () => clearTimeout(id);
    }

    router.replace("/landing");
  }, [isSignedIn, isLoaded, segments, router]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
        animation: Platform.OS === "ios" ? "slide_from_right" : "fade",
        animationDuration: 250,
        gestureEnabled: Platform.OS === "ios",
        gestureDirection: "horizontal",
        fullScreenGestureEnabled: true,
      }}
    />
  );
}

const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout() {
  if (!clerkKey?.trim()) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, padding: 24, justifyContent: "center" }}>
        <Text style={{ color: theme.danger, fontSize: 16 }}>缺少 EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY，请在 .env 中配置</Text>
      </View>
    );
  }
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ClerkProvider
          publishableKey={clerkKey}
          tokenCache={Platform.OS === "web" ? undefined : tokenCache}
        >
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <WebResponsiveWrapper>
              <StatusBar style="dark" />
              <RootNavigator />
            </WebResponsiveWrapper>
          </SafeAreaProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
